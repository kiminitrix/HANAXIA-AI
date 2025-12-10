import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, SocketEvents, SocketPayloads } from '../types';
import { streamChatResponse } from '../services/geminiService';
import { wsService } from '../services/websocketService';
import { GenerateContentResponse } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

// Helper for collision-free IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface ChatInputProps {
  onSend: (text: string) => void;
  isLoading: boolean;
  activeConversationId: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading, activeConversationId }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    adjustHeight();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || isLoading) return;
    onSend(text);
    setText('');
    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 mb-6">
      <form 
        onSubmit={handleSubmit} 
        className="relative bg-white dark:bg-[#1a1a1a] rounded-3xl border border-gray-200 dark:border-white/10 shadow-lg dark:shadow-xl flex items-end p-2 transition-colors focus-within:border-purple-500/50"
      >
        <button 
          type="button" 
          className="p-3 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Message Hanaxia..."
          rows={1}
          className="flex-1 bg-transparent py-3.5 px-2 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none max-h-[150px] overflow-y-auto custom-scrollbar"
          disabled={isLoading}
        />

        <button 
          type="submit" 
          disabled={!text.trim() || isLoading}
          className={`p-2 rounded-full mb-1 transition-all ${
             text.trim() && !isLoading ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200' : 'bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-gray-500'
          }`}
        >
          {isLoading ? (
             <div className="w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
          ) : (
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
};

interface HanaxiaChatProps {
  activeConversation: Conversation;
  onUpdateConversation: (c: Conversation) => void;
}

const HanaxiaChat: React.FC<HanaxiaChatProps> = ({ activeConversation, onUpdateConversation }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConversation.messages, isStreaming]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: Message = { id: generateId(), role: 'user', text: text, time: Date.now() };
    
    // Optimistic update
    const updatedWithUser = { ...activeConversation, messages: [...activeConversation.messages, userMsg] };
    onUpdateConversation(updatedWithUser);
    
    wsService.send(SocketEvents.CHAT_MESSAGE, {
      conversationId: activeConversation.id,
      conversationTitle: activeConversation.title,
      message: userMsg
    });

    setIsStreaming(true);

    try {
      const history = updatedWithUser.messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      const stream = await streamChatResponse(history, userMsg.text);
      
      const assistantId = generateId();
      const initialAssistantMsg: Message = { id: assistantId, role: 'assistant', text: '', time: Date.now() };
      
      // Add empty assistant message
      let currentConversationState = { 
        ...updatedWithUser, 
        messages: [...updatedWithUser.messages, initialAssistantMsg] 
      };
      onUpdateConversation(currentConversationState);

      let fullText = '';
      for await (const chunk of stream) {
        const content = chunk as GenerateContentResponse;
        if (content.text) {
          fullText += content.text;
          
          // Update the last message in local updated state variable
          const updatedMessages = [...currentConversationState.messages];
          const lastIndex = updatedMessages.findIndex(m => m.id === assistantId);
          if (lastIndex !== -1) {
             updatedMessages[lastIndex] = { ...updatedMessages[lastIndex], text: fullText };
          }
          currentConversationState = { ...currentConversationState, messages: updatedMessages };
          
          // Propagate up
          onUpdateConversation(currentConversationState);
        }
      }

      wsService.send(SocketEvents.CHAT_MESSAGE, {
        conversationId: activeConversation.id,
        conversationTitle: activeConversation.title,
        message: { ...initialAssistantMsg, text: fullText }
      });

    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg: Message = { id: generateId(), role: 'assistant', text: "I apologize, but I encountered an error connecting to the service.", time: Date.now() };
      onUpdateConversation({
         ...activeConversation,
         messages: [...activeConversation.messages, userMsg, errorMsg]
      });
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 overflow-y-auto w-full custom-scrollbar" ref={scrollRef}>
        <div className="max-w-3xl mx-auto w-full px-4 pt-10 pb-4">
          {activeConversation.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in select-none">
               {/* Logo Center */}
               <div className="w-20 h-20 bg-purple-600 rounded-2xl flex items-center justify-center text-white text-5xl font-bold mb-8 shadow-2xl shadow-purple-900/50">
                  H
               </div>
               <div className="text-center space-y-2">
                 <h1 className="text-lg font-medium tracking-[0.2em] text-gray-500 uppercase">Hanaxia Neural Interface</h1>
               </div>
            </div>
          ) : (
            <div className="space-y-6">
              {activeConversation.messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[90%] md:max-w-[85%] px-5 py-4 rounded-2xl text-[15px] leading-7 shadow-sm ${
                      m.role === 'user' 
                        ? 'bg-purple-600 text-white rounded-br-none dark:bg-white/10 dark:text-white' 
                        : 'bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-white/5'
                    }`}
                  >
                    {m.role === 'assistant' ? (
                       <div className="prose prose-slate dark:prose-invert prose-sm max-w-none">
                        <ReactMarkdown 
                           remarkPlugins={[remarkGfm]}
                           rehypePlugins={[rehypeHighlight]}
                           components={{
                             a: ({node, ...props}) => <a target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 underline" {...props} />,
                             code: ({node, className, children, ...props}) => {
                               const match = /language-(\w+)/.exec(className || '');
                               const isInline = !match && !className?.includes('hljs');
                               if (isInline) return <code className="bg-gray-100 dark:bg-white/10 rounded px-1.5 py-0.5 text-xs font-mono" {...props}>{children}</code>;
                               return <code className={className} {...props}>{children}</code>;
                             },
                             pre: ({node, ...props}) => <pre className="bg-gray-900 dark:bg-[#0d0d0d] text-white p-4 rounded-xl border border-gray-200 dark:border-white/5 overflow-x-auto my-2" {...props} />
                           }}
                        >
                          {m.text}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap font-medium">{m.text}</div>
                    )}
                    {m.text === '' && m.role === 'assistant' && <span className="animate-pulse opacity-50">Thinking...</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ChatInput 
        onSend={handleSendMessage} 
        isLoading={isStreaming} 
        activeConversationId={activeConversation.id}
      />
    </div>
  );
};

export default HanaxiaChat;