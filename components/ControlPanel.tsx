import React, { useState } from 'react';

const ControlPanel: React.FC = () => {
  const [username, setUsername] = useState('Master Kimi');
  const [email, setEmail] = useState('kimi@hanaxia.ai');
  const [password, setPassword] = useState('••••••••');
  
  const handleUpdate = (field: string) => {
    alert(`${field} update feature is not connected to a backend in this demo, but the state has been updated.`);
  };

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-3xl font-black shadow-xl">
               MK
            </div>
            <button className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-white">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15a2.25 2.25 0 0 0 2.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
              </svg>
            </button>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Profile Settings</h1>
            <p className="text-gray-500 text-sm">Manage your account information and security</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Username */}
          <div className="bg-white dark:bg-[#111111] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
             <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Username</label>
             <div className="flex gap-4">
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-purple-500 outline-none transition-all text-sm"
                />
                <button 
                  onClick={() => handleUpdate('Username')}
                  className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors"
                >
                  Update
                </button>
             </div>
          </div>

          {/* Email */}
          <div className="bg-white dark:bg-[#111111] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
             <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Email Address</label>
             <div className="flex gap-4">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-purple-500 outline-none transition-all text-sm"
                />
                <button 
                  onClick={() => handleUpdate('Email')}
                  className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors"
                >
                  Update
                </button>
             </div>
          </div>

          {/* Password */}
          <div className="bg-white dark:bg-[#111111] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
             <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Change Password</label>
             <div className="space-y-4">
                <input 
                  type="password" 
                  placeholder="New password"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-purple-500 outline-none transition-all text-sm"
                />
                <input 
                  type="password" 
                  placeholder="Confirm new password"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-purple-500 outline-none transition-all text-sm"
                />
                <button 
                  onClick={() => handleUpdate('Password')}
                  className="w-full py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                >
                  Update Password
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;