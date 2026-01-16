import React from 'react';

const LogoutPage: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-[#0a0a0a] animate-fade-in">
       <div className="w-20 h-20 rounded-3xl bg-purple-600 flex items-center justify-center text-white shadow-2xl shadow-purple-900/40 mb-8 animate-pulse">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12">
          <path d="M2 19V17H22V19H2ZM2 15L3.5 6L8 10.5L12 4L16 10.5L20.5 6L22 15H2Z" />
        </svg>
      </div>
      <h1 className="text-4xl font-black tracking-widest text-gray-900 dark:text-white mb-2">HANAXIA</h1>
      <p className="text-lg font-bold text-purple-600 dark:text-purple-400 uppercase tracking-[0.2em] animate-fade-in-up">
        See You Next Time
      </p>
    </div>
  );
};

export default LogoutPage;