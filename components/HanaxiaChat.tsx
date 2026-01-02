import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, SocketEvents, SocketPayloads, Attachment } from '../types';
import { streamChatResponse, generateChatTitle } from '../services/geminiService';
import { wsService } from '../services/websocketService';
import { GoogleGenAI, GenerateContentResponse, LiveServerMessage, Modality, Blob } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

// Helper for collision-free IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// --- Live API Helpers ---

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// --- Message Item Components ---

const CopyButton: React.FC<{ text: string, role: string }> = ({ text, role }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = role === 'user';

  return (
    <button
      onClick={handleCopy}
      className={`
        absolute top-2 right-2 z-10 p-1.5 rounded-lg transition-all duration-200 
        opacity-0 group-hover:opacity-100 focus:opacity-100
        ${isUser 
          ? 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10' 
          : 'bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-white/5'
        }
      `}
      title="Copy message"
    >
      {copied ? (
        <div className="flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-green-500">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
          </svg>
          <span className={`text-[10px] font-bold uppercase tracking-tighter ${isUser ? 'text-white' : 'text-green-600 dark:text-green-500'}`}>Copied!</span>
        </div>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
        </svg>
      )}
    </button>
  );
};

const CodeBlock: React.FC<{ language?: string, children: any }> = ({ language, children }) => {
  const [copied, setCopied] = useState(false);
  const codeContent = String(children).replace(/\n$/, '');

  const copyCode = () => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group/code my-4 rounded-xl overflow-hidden border border-gray-700/50">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-black text-gray-400 text-xs font-mono">
        <span>{language || 'code'}</span>
        <button 
          onClick={copyCode}
          className="hover:text-white transition-colors flex items-center gap-1.5"
        >
          {copied ? (
            <span className="text-green-500 font-bold uppercase">Copied!</span>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="!m-0 !rounded-none">
        <code className={language ? `language-${language}` : ''}>{children}</code>
      </pre>
    </div>
  );
};

const MessageItem: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div className={`flex flex-col gap-2 max-w-[90%] md:max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        
        {/* Attachments Display */}
        {message.attachments && message.attachments.length > 0 && (
          <div className={`flex flex-wrap gap-2 mb-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {message.attachments.map(att => (
               <div key={att.id} className="rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm bg-white dark:bg-[#252525]">
                  {att.type === 'image' ? (
                    <img src={`data:${att.mimeType};base64,${att.data}`} alt="attachment" className="max-h-[250px] max-w-full object-contain" />
                  ) : att.type === 'audio' ? (
                    <div className="p-2 min-w-[200px]">
                       <audio controls src={`data:${att.mimeType};base64,${att.data}`} className="w-full h-8" />
                       <div className="px-2 pt-1 text-xs text-gray-500 truncate">{att.name}</div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 min-w-[180px]">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate text-gray-800 dark:text-gray-200">{att.name}</div>
                        <div className="text-xs text-gray-500 uppercase">{att.mimeType.split('/')[1] || 'FILE'}</div>
                      </div>
                    </div>
                  )}
               </div>
            ))}
          </div>
        )}

        {/* Text Message Content */}
        {message.text !== undefined && (
          <div 
            className={`group relative px-6 py-4 rounded-2xl text-base leading-relaxed shadow-sm w-full transition-all ${
              isUser 
                ? 'bg-purple-600 text-white rounded-br-none dark:bg-white/10 dark:text-gray-100' 
                : 'bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-white/5'
            }`}
          >
            {/* Contextual Copy Button */}
            {message.text !== '' && <CopyButton text={message.text} role={message.role} />}

            <div className={`prose prose-slate dark:prose-invert max-w-none ${isUser ? 'prose-p:text-white dark:prose-p:text-gray-100' : ''}`}>
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  a: ({node, ...props}) => (
                    <a 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={`${isUser ? 'text-white underline font-bold' : 'text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300'} underline`} 
                      {...props} 
                    />
                  ),
                  code: ({node, className, children, ...props}) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match && !className?.includes('hljs');
                    
                    if (isInline) {
                      return (
                        <code 
                          className={`${isUser ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-white/10 text-pink-500'} rounded px-1.5 py-0.5 text-[0.9em] font-mono`} 
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }
                    
                    return <CodeBlock language={match?.[1]}>{children}</CodeBlock>;
                  },
                  // Prevent nested pre blocks
                  pre: ({ children }) => <>{children}</>,
                  // Tables and other Markdown features
                  table: ({ children }) => <div className="overflow-x-auto my-4"><table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">{children}</table></div>,
                  th: ({ children }) => <th className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-left text-xs font-bold uppercase tracking-wider">{children}</th>,
                  td: ({ children }) => <td className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 text-sm">{children}</td>,
                }}
              >
                {message.text}
              </ReactMarkdown>
            </div>
            
            {message.text === '' && isAssistant && (
              <div className="flex items-center gap-2 text-gray-400">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="text-sm italic opacity-50">Thinking...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Chat Input Component ---

interface ChatInputProps {
  onSend: (text: string, attachments: Attachment[]) => void;
  isLoading: boolean;
  activeConversationId: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading, activeConversationId }) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice Recording Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null);

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
    if ((!text.trim() && attachments.length === 0) || isLoading) return;
    
    // Stop listening if user hits send
    if (isListening) stopListening();

    onSend(text, attachments);
    
    setText('');
    setAttachments([]);
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = Array.from(e.target.files);
      const newAttachments: Attachment[] = [];

      for (const file of files) {
        if (file.size > 20 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Max 20MB.`);
          continue;
        }

        try {
          const { base64, type } = await readFile(file);
          newAttachments.push({
            id: generateId(),
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            type: type,
            data: base64,
            size: file.size
          });
        } catch (err) {
          console.error("Failed to read file", err);
        }
      }

      setAttachments(prev => [...prev, ...newAttachments]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const readFile = (file: File): Promise<{ base64: string, type: 'image' | 'audio' | 'video' | 'file' }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        
        let type: 'image' | 'audio' | 'video' | 'file' = 'file';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('audio/')) type = 'audio';
        else if (file.type.startsWith('video/')) type = 'video';
        
        resolve({ base64, type });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  // --- Voice Transcription Implementation ---

  const stopListening = () => {
    if (sessionRef.current) {
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsListening(false);
  };

  const startListening = async () => {
    try {
      setIsListening(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = inputCtx;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              const transcription = message.serverContent.inputTranscription.text;
              if (transcription) {
                setText(prev => (prev ? prev + ' ' + transcription : transcription));
                adjustHeight();
              }
            }
          },
          onerror: (e) => {
            console.error("Live transcription error", e);
            stopListening();
          },
          onclose: () => {
            stopListening();
          }
        }
      });

      sessionRef.current = sessionPromise;

    } catch (err) {
      console.error("Microphone access denied or error", err);
      setIsListening(false);
      alert("Microphone access is required for voice input.");
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 mb-6">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 animate-slide-up">
          {attachments.map(att => (
            <div key={att.id} className="relative group bg-white dark:bg-[#252525] border border-gray-200 dark:border-white/10 rounded-xl p-2 pr-8 flex items-center gap-2 max-w-[200px] shadow-sm">
              {att.type === 'image' ? (
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-black/50 flex-shrink-0">
                  <img src={`data:${att.mimeType};base64,${att.data}`} alt="preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
                  {att.type === 'audio' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path d="M7 4a3 3 0 0 1 6 0v6a3 3 0 1 1-6 0V4Z" />
                      <path d="M5.5 9.643a.75.75 0 0 0-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-1.5v-1.546A6.001 6.001 0 0 0 16 10v-.357a.75.75 0 0 0-1.5 0V10a4.5 4.5 0 0 1-9 0v-.357Z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate text-gray-700 dark:text-gray-200">{att.name}</div>
                <div className="text-[10px] text-gray-500">{(att.size / 1024).toFixed(0)} KB</div>
              </div>
              <button 
                onClick={() => removeAttachment(att.id)}
                className="absolute top-1 right-1 p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <form 
        onSubmit={handleSubmit} 
        className="relative bg-white dark:bg-[#1a1a1a] rounded-3xl border border-gray-200 dark:border-white/10 shadow-lg dark:shadow-xl flex items-end p-2 transition-colors focus-within:border-purple-500/50"
      >
        <input 
          type="file" 
          multiple 
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx"
        />
        
        <div className="flex items-center">
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            title="Attach files"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
            </svg>
          </button>

          <button 
            type="button" 
            onClick={toggleListening}
            className={`p-3 transition-all duration-300 rounded-full ${
              isListening ? 'text-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse' : 'text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'
            }`}
            title={isListening ? "Stop listening" : "Voice input"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening..." : "Message Hanaxia..."}
          rows={1}
          className="flex-1 bg-transparent py-3.5 px-2 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none max-h-[150px] overflow-y-auto custom-scrollbar"
          disabled={isLoading}
        />

        <button 
          type="submit" 
          disabled={(!text.trim() && attachments.length === 0) || isLoading}
          className={`p-2 rounded-full mb-1 transition-all ${
             (text.trim() || attachments.length > 0) && !isLoading ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200' : 'bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-gray-500'
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

// --- Main Chat Component ---

interface HanaxiaChatProps {
  activeConversation: Conversation;
  onUpdateConversation: (c: Conversation) => void;
  onAutoRename?: (id: string, title: string) => void;
}

const HanaxiaChat: React.FC<HanaxiaChatProps> = ({ activeConversation, onUpdateConversation, onAutoRename }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConversation.messages, isStreaming]);

  const handleSendMessage = async (text: string, attachments: Attachment[]) => {
    if ((!text.trim() && attachments.length === 0) || isStreaming) return;

    const isNewConversation = activeConversation.messages.length === 0;

    const userMsg: Message = { 
      id: generateId(), 
      role: 'user', 
      text: text, 
      attachments: attachments,
      time: Date.now() 
    };
    
    // Optimistic update
    const updatedWithUser = { ...activeConversation, messages: [...activeConversation.messages, userMsg] };
    onUpdateConversation(updatedWithUser);
    
    wsService.send(SocketEvents.CHAT_MESSAGE, {
      conversationId: activeConversation.id,
      conversationTitle: activeConversation.title,
      message: userMsg
    });

    // Auto-rename if first message and text exists
    if (isNewConversation && text.trim() && onAutoRename) {
      generateChatTitle(text).then(title => {
         onAutoRename(activeConversation.id, title);
      }).catch(err => console.error("Auto-rename failed", err));
    }

    setIsStreaming(true);

    try {
      const history = activeConversation.messages
        .filter(m => m.role !== 'system')
        .map(m => {
          const parts: any[] = [];
          
          if (m.attachments) {
            m.attachments.forEach(a => {
               parts.push({
                 inlineData: { mimeType: a.mimeType, data: a.data }
               });
            });
          }
          if (m.text) {
            parts.push({ text: m.text });
          }

          return {
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: parts
          };
        });

      const stream = await streamChatResponse(history, userMsg.text, attachments);
      
      const assistantId = generateId();
      const initialAssistantMsg: Message = { id: assistantId, role: 'assistant', text: '', time: Date.now() };
      
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
          
          const updatedMessages = [...currentConversationState.messages];
          const lastIndex = updatedMessages.findIndex(m => m.id === assistantId);
          if (lastIndex !== -1) {
             updatedMessages[lastIndex] = { ...updatedMessages[lastIndex], text: fullText };
          }
          currentConversationState = { ...currentConversationState, messages: updatedMessages };
          
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
        <div className="max-w-4xl mx-auto w-full px-4 pt-10 pb-12">
          {activeConversation.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in select-none px-4">
               {/* Logo Center */}
               <div className="w-20 h-20 bg-purple-600 rounded-2xl flex items-center justify-center text-white text-5xl font-bold mb-8 shadow-2xl shadow-purple-900/50">
                  H
               </div>
               <div className="text-center space-y-2">
                 <h1 className="text-lg font-medium tracking-[0.2em] text-gray-500 uppercase">ASSALAMMUALAIKUM! I'M HANAXIA</h1>
                 <p className="text-sm text-gray-400 max-w-sm mx-auto">How can I assist your workflow today? I can help with planning, analysis, and generation.</p>
               </div>
            </div>
          ) : (
            <div className="space-y-10">
              {activeConversation.messages.map((m) => (
                <MessageItem key={m.id} message={m} />
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