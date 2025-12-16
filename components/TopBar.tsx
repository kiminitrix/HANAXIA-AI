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
          className="p-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
        >
          {isDark ? (
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
             </svg>
          ) : (
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
               <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
             </svg>
          )}
        </button>
      </div>
    </header>
  );
};

export default TopBar;