import React, { useState } from 'react';
import { AppRoute, Conversation } from '../types';
import { ROUTES, ICONS } from '../constants';

interface SidebarProps {
  route: AppRoute;
  setRoute: (route: AppRoute) => void;
  isOpen: boolean;
  onClose: () => void;
  
  // Chat props
  conversations: Conversation[];
  activeId: string;
  onSelectChat: (id: string) => void;
  onNewSession: () => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, title: string) => void;
  onClearHistory: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  route, setRoute, isOpen, onClose,
  conversations, activeId, onSelectChat, onNewSession, onDeleteChat, onRenameChat, onClearHistory
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const startEditing = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const saveEditing = (id: string) => {
    if (editTitle.trim()) {
      onRenameChat(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') saveEditing(id);
    if (e.key === 'Escape') setEditingId(null);
  };

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
           <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white md:hidden">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
               <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
        </div>

        <div className="p-4">
          <button 
             onClick={() => { onNewSession(); onClose(); }}
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
              <div className="px-4 mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">History</span>
                {conversations.length > 0 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onClearHistory(); }}
                    className="text-[10px] text-gray-400 hover:text-red-500 uppercase tracking-wider transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
              
              <div className="space-y-0.5">
                {conversations.length === 0 ? (
                  <div className="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-600 italic">
                     No recent history
                  </div>
                ) : (
                  conversations.map(c => (
                    <div 
                      key={c.id} 
                      className={`group relative flex items-center gap-2 w-full px-4 py-2 rounded-lg cursor-pointer transition-colors
                        ${activeId === c.id ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}
                      `}
                      onClick={() => onSelectChat(c.id)}
                    >
                      <span className="opacity-70 text-sm">💬</span>
                      
                      {editingId === c.id ? (
                        <input
                          autoFocus
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => saveEditing(c.id)}
                          onKeyDown={(e) => handleKeyDown(e, c.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 bg-transparent border-b border-purple-500 outline-none text-sm min-w-0"
                        />
                      ) : (
                        <div className="flex-1 truncate text-sm">{c.title}</div>
                      )}

                      {/* Action Buttons (visible on hover or active) */}
                      <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${editingId === c.id ? 'hidden' : ''}`}>
                         <button 
                           onClick={(e) => startEditing(c.id, c.title, e)}
                           className="p-1 hover:text-purple-500 rounded"
                           title="Rename"
                         >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                            </svg>
                         </button>
                         <button 
                           onClick={(e) => { e.stopPropagation(); onDeleteChat(c.id); }}
                           className="p-1 hover:text-red-500 rounded"
                           title="Delete"
                         >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                         </button>
                      </div>
                    </div>
                  ))
                )}
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