import React from 'react';
import { ICONS } from '../constants';

interface TopBarProps {
  onToggle: () => void;
  isDark: boolean;
  onMenuClick: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onToggle, isDark, onMenuClick }) => {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-white/5 transition-colors duration-300">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Open Menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-purple-600 flex items-center justify-center text-white font-bold text-lg">H</div>
            <span className="text-lg font-bold tracking-wide text-gray-900 dark:text-white">HANAXIA</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          aria-label="Toggle theme"
          onClick={onToggle}
          className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        >
          {isDark ? ICONS.sun : ICONS.moon}
        </button>
      </div>
    </header>
  );
};

export default TopBar;