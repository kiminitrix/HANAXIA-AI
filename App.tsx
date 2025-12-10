import React, { useState, useEffect } from 'react';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import HanaxiaChat from './components/HanaxiaChat';
import DocParser from './components/DocParser';
import AgenticPlanner from './components/AgenticPlanner';
import CalendarPlanner from './components/CalendarPlanner';
import ImageGenerator from './components/ImageGenerator';
import VideoGenerator from './components/VideoGenerator';
import { AppRoute } from './types';
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

  // Initialize WebSocket connection
  useEffect(() => {
    wsService.connect();
  }, []);

  // Render current route
  const renderContent = () => {
    switch (route) {
      case AppRoute.CHAT: return <HanaxiaChat />;
      case AppRoute.DOC: return <DocParser />;
      case AppRoute.AGENT: return <AgenticPlanner />;
      case AppRoute.CALENDAR: return <CalendarPlanner />;
      case AppRoute.IMAGE: return <ImageGenerator />;
      case AppRoute.VIDEO: return <VideoGenerator />;
      default: return <HanaxiaChat />;
    }
  };

  return (
    <div className={`h-screen flex flex-col overflow-hidden transition-colors duration-300 ${dark ? 'bg-[#0a0a0a] text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* Top Bar - Fixed height */}
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
        />
        
        {/* Main Content - Full width/height, scrollable internally */}
        <main className="flex-1 relative w-full h-full overflow-hidden bg-[#0a0a0a] dark:bg-[#050505]">
            {/* Subtle Grid Background */}
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