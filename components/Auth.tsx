import React, { useState } from 'react';
import { AuthState } from '../types';

interface AuthProps {
  onLogin: () => void;
  authState: AuthState;
  setAuthState: (state: AuthState) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, authState, setAuthState }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'kimivoltex' && password === 'kimi@1234') {
      onLogin();
    } else {
      setError('Invalid username or password.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Registration submitted! You can now login with your credentials.');
    setAuthState('LOGIN');
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Password reset instructions sent to ${email}`);
    setAuthState('LOGIN');
  };

  const Logo = () => (
    <div className="flex flex-col items-center mb-8">
      <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-2xl shadow-purple-900/40 mb-4 animate-bounce-slow">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
          <path d="M2 19V17H22V19H2ZM2 15L3.5 6L8 10.5L12 4L16 10.5L20.5 6L22 15H2Z" />
        </svg>
      </div>
      <h1 className="text-3xl font-black tracking-widest text-gray-900 dark:text-white">HANAXIA</h1>
      <p className="text-xs font-bold text-purple-600 dark:text-purple-400 mt-2 uppercase tracking-[0.3em]">
        {authState === 'LOGIN' ? 'Welcome to HANAXIA' : authState === 'REGISTER' ? 'Join the Empire' : 'Restore Access'}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-gray-50 dark:bg-[#0a0a0a] relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-md animate-fade-in z-10">
        <Logo />

        <div className="bg-white dark:bg-[#111111] p-8 rounded-3xl border border-gray-200 dark:border-white/5 shadow-2xl">
          {authState === 'LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Username</label>
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-purple-500 outline-none transition-all text-sm"
                  placeholder="Enter username"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-purple-500 outline-none transition-all text-sm"
                  placeholder="Enter password"
                  required
                />
              </div>
              {error && <p className="text-xs font-bold text-red-500 mt-2">{error}</p>}
              <div className="flex justify-between items-center text-xs">
                <button type="button" onClick={() => setAuthState('FORGOT_PASSWORD')} className="text-purple-600 hover:underline">Forgot password?</button>
                <button type="button" onClick={() => setAuthState('REGISTER')} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Create account</button>
              </div>
              <button 
                type="submit"
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-500/25 active:scale-95"
              >
                Sign In
              </button>
            </form>
          )}

          {authState === 'REGISTER' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                <input 
                  type="email"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-purple-500 outline-none transition-all text-sm"
                  placeholder="name@company.com"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Username</label>
                <input 
                  type="text"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-purple-500 outline-none transition-all text-sm"
                  placeholder="Choose a username"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
                <input 
                  type="password"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-purple-500 outline-none transition-all text-sm"
                  placeholder="Create password"
                  required
                />
              </div>
              <div className="flex justify-center items-center text-xs">
                <button type="button" onClick={() => setAuthState('LOGIN')} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline underline-offset-4">Already have an account? Login</button>
              </div>
              <button 
                type="submit"
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-500/25 active:scale-95"
              >
                Register
              </button>
            </form>
          )}

          {authState === 'FORGOT_PASSWORD' && (
            <form onSubmit={handleForgotSubmit} className="space-y-5">
              <p className="text-sm text-gray-500 mb-2">Enter your email and we'll send you a link to reset your password.</p>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-purple-500 outline-none transition-all text-sm"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="flex justify-center items-center text-xs">
                <button type="button" onClick={() => setAuthState('LOGIN')} className="text-purple-600 hover:underline">Back to Login</button>
              </div>
              <button 
                type="submit"
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-500/25 active:scale-95"
              >
                Reset Password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;