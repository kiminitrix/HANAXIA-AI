import React from 'react';
import { AppRoute } from '../types';
import { ROUTES } from '../constants';

interface SidebarProps {
  route: AppRoute;
  setRoute: (route: AppRoute) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ route, setRoute, isOpen, onClose }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={`
          fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar Content */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50
          w-72 bg-white dark:bg-[#0f0f11] border-r border-gray-200 dark:border-white/5
          transform transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/5">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded bg-purple-600 flex items-center justify-center text-white font-bold">H</div>
             <span className="font-bold text-lg tracking-wide text-gray-900 dark:text-white">HANAXIA</span>
           </div>
           <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
               <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
        </div>

        <div className="p-4">
          <button 
             onClick={() => { setRoute(AppRoute.CHAT); onClose(); }}
             className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white font-medium flex items-center justify-center gap-2 transition-colors"
          >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
               <path fillRule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
             </svg>
             New Session
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-6 custom-scrollbar">
           {/* Capabilities */}
           <div>
              <div className="px-4 mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Capabilities</div>
              <nav className="space-y-1">
                {ROUTES.map(i => (
                  <button
                    key={i.id}
                    onClick={() => {
                      setRoute(i.id as AppRoute);
                      onClose();
                    }}
                    className={`flex items-center gap-3 w-full text-left px-4 py-2.5 rounded-lg transition-all duration-200 group
                      ${route === i.id 
                        ? 'bg-[#6366f1] text-white' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                  >
                    <div className={`${route === i.id ? 'text-white' : 'opacity-70 group-hover:opacity-100'}`}>
                      {i.icon}
                    </div>
                    <div className="font-medium text-sm">{i.label}</div>
                  </button>
                ))}
              </nav>
           </div>

           {/* History */}
           <div>
              <div className="px-4 mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">History</div>
              <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-600 italic">
                 No recent history
              </div>
           </div>
        </div>
        
        {/* User Profile */}
        <div className="p-4 border-t border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#0a0a0c]">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                 MK
              </div>
              <div>
                 <div className="text-sm font-medium text-gray-900 dark:text-white">Master Kimi</div>
                 <div className="text-xs text-purple-600 dark:text-purple-400">Pro Plan</div>
              </div>
           </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;