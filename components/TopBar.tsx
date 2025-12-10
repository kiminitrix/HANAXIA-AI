import React from 'react';
import { ICONS } from '../constants';

interface TopBarProps {
  onToggle: () => void;
  isDark: boolean;
  onMenuClick: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onToggle, isDark, onMenuClick }) => {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-[#0a0a0a] border-b border-white/5">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Open Menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-purple-600 flex items-center justify-center text-white font-bold text-lg">H</div>
            <span className="text-lg font-bold tracking-wide text-white">HANAXIA</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
         <button className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors" title="Export/Download">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
         </button>
        <button
          aria-label="Toggle theme"
          onClick={onToggle}
          className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
        >
          {isDark ? ICONS.sun : ICONS.moon}
        </button>
      </div>
    </header>
  );
};

export default TopBar;