import React, { useState, useEffect } from 'react';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import HanaxiaChat from './components/HanaxiaChat';
import DocParser from './components/DocParser';
import AgenticPlanner from './components/AgenticPlanner';
import CalendarPlanner from './components/CalendarPlanner';
import ImageGenerator from './components/ImageGenerator';
import VideoGenerator from './components/VideoGenerator';
import ControlPanel from './components/ControlPanel';
import Auth from './components/Auth';
import LogoutPage from './components/LogoutPage';
import { AppRoute, Conversation, SocketEvents, SocketPayloads, AuthState } from './types';
import { wsService } from './services/websocketService';

// Theme hook
function useTheme() {
  const [dark, setDark] = useState(() => {
    const v = localStorage.getItem('hanaxia-theme');
    // Default to dark mode for corporate aesthetic
    return v ? v === 'dark' : true; 
  });

  useEffect(() => {
    localStorage.setItem('hanaxia-theme', dark ? 'dark' : 'light');
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [dark]);

  return { dark, toggle: () => setDark(d => !d) };
}

export default function App() {
  const { dark, toggle } = useTheme();
  const [route, setRoute] = useState<AppRoute>(AppRoute.CHAT);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Auth state
  const [authState, setAuthState] = useState<AuthState>(() => {
    const saved = localStorage.getItem('hanaxia-auth');
    return (saved === 'true') ? 'AUTHENTICATED' : 'LOGIN';
  });

  // --- Chat State Management ---
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const raw = localStorage.getItem('hanaxia-chats');
    return raw ? JSON.parse(raw) : [{ id: 'init-chat', title: 'New Chat', messages: [] }];
  });
  const [activeId, setActiveId] = useState<string>(() => {
     const raw = localStorage.getItem('hanaxia-chats');
     const parsed = raw ? JSON.parse(raw) : [{ id: 'init-chat' }];
     return parsed[0]?.id || 'init-chat';
  });

  // Persist chats
  useEffect(() => {
    localStorage.setItem('hanaxia-chats', JSON.stringify(conversations));
  }, [conversations]);

  // Handle Auth Persistence
  useEffect(() => {
    localStorage.setItem('hanaxia-auth', (authState === 'AUTHENTICATED').toString());
  }, [authState]);

  // Subscribe to real-time chat updates
  useEffect(() => {
    if (authState !== 'AUTHENTICATED') return;
    
    wsService.connect();
    const unsubscribe = wsService.subscribe(
      SocketEvents.CHAT_MESSAGE, 
      (payload: SocketPayloads[SocketEvents.CHAT_MESSAGE]) => {
        setConversations(prev => {
          const exists = prev.some(c => c.id === payload.conversationId);
          if (exists) {
            return prev.map(c => {
              if (c.id === payload.conversationId) {
                if (c.messages.some(m => m.id === payload.message.id)) {
                  return c;
                }
                return { ...c, messages: [...c.messages, payload.message] };
              }
              return c;
            });
          } else {
            const newConv: Conversation = {
              id: payload.conversationId,
              title: payload.conversationTitle || 'Remote Chat',
              messages: [payload.message]
            };
            return [newConv, ...prev];
          }
        });
      }
    );
    return unsubscribe;
  }, [authState]);

  // --- Handlers ---

  const handleLogin = () => {
    setAuthState('AUTHENTICATED');
  };

  const handleLogout = () => {
    setAuthState('LOGOUT_TRANSITION');
    setTimeout(() => {
      setAuthState('LOGIN');
    }, 2000); // Show logout screen for 2 seconds as requested
  };

  const handleCreateNewSession = () => {
    const newId = `${Date.now()}`;
    const newChat: Conversation = { id: newId, title: 'New Chat', messages: [] };
    setConversations(prev => [newChat, ...prev]);
    setActiveId(newId);
    setRoute(AppRoute.CHAT);
    setIsSidebarOpen(false);
  };

  const handleDeleteChat = (id: string) => {
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (filtered.length === 0) {
        const newId = `${Date.now()}`;
        return [{ id: newId, title: 'New Chat', messages: [] }];
      }
      return filtered;
    });
  };

  useEffect(() => {
     if (!conversations.find(c => c.id === activeId)) {
        if (conversations.length > 0) {
           setActiveId(conversations[0].id);
        }
     }
  }, [conversations, activeId]);

  const handleRenameChat = (id: string, newTitle: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to delete all chat history? This cannot be undone.")) {
       const newId = `${Date.now()}`;
       setConversations([{ id: newId, title: 'New Chat', messages: [] }]);
       setActiveId(newId);
    }
  };

  const handleUpdateConversation = (updatedChat: Conversation) => {
     setConversations(prev => prev.map(c => c.id === updatedChat.id ? updatedChat : c));
  };

  // Render current route
  const renderContent = () => {
    switch (route) {
      case AppRoute.CHAT: 
        return (
          <HanaxiaChat 
             activeConversation={conversations.find(c => c.id === activeId) || conversations[0]}
             onUpdateConversation={handleUpdateConversation}
             onAutoRename={handleRenameChat}
          />
        );
      case AppRoute.DOC: return <DocParser />;
      case AppRoute.AGENT: return <AgenticPlanner />;
      case AppRoute.CALENDAR: return <CalendarPlanner />;
      case AppRoute.IMAGE: return <ImageGenerator />;
      case AppRoute.VIDEO: return <VideoGenerator />;
      case AppRoute.PROFILE: return <ControlPanel />;
      default: return <HanaxiaChat activeConversation={conversations[0]} onUpdateConversation={handleUpdateConversation} onAutoRename={handleRenameChat} />;
    }
  };

  // Main screen routing
  if (authState === 'LOGOUT_TRANSITION') {
    return <LogoutPage />;
  }

  if (authState !== 'AUTHENTICATED') {
    return <Auth onLogin={handleLogin} authState={authState} setAuthState={setAuthState} />;
  }

  return (
    <div className={`h-screen flex flex-col overflow-hidden transition-colors duration-300 ${dark ? 'bg-[#0a0a0a] text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* Top Bar */}
      <div className="flex-none z-20">
        <TopBar 
          onToggle={toggle} 
          isDark={dark} 
          onMenuClick={() => setIsSidebarOpen(true)}
        />
      </div>
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <Sidebar 
          route={route} 
          setRoute={setRoute} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onLogout={handleLogout}
          // Chat Props
          conversations={conversations}
          activeId={activeId}
          onSelectChat={(id) => { setActiveId(id); setRoute(AppRoute.CHAT); setIsSidebarOpen(false); }}
          onNewSession={handleCreateNewSession}
          onDeleteChat={handleDeleteChat}
          onRenameChat={handleRenameChat}
          onClearHistory={handleClearHistory}
        />
        
        {/* Main Content */}
        <main className="flex-1 relative w-full h-full overflow-hidden bg-transparent">
             <div 
              className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{
                backgroundImage: `linear-gradient(to right, #808080 1px, transparent 1px), linear-gradient(to bottom, #808080 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
              }}
            />
            
            <div className="relative h-full w-full flex flex-col">
              {renderContent()}
            </div>
        </main>
      </div>
    </div>
  );
}