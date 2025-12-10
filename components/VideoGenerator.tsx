import React, { useState, useRef } from 'react';
import { ICONS } from '../constants';
import { generateVideo, ReferenceImage } from '../services/geminiService';

const VideoGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [refImage, setRefImage] = useState<ReferenceImage | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Veo supports limited aspect ratios
  const ratios = ['16:9', '9:16'];

  const handleGenerate = async () => {
    if (!prompt.trim() && !refImage) return;
    setError(null);
    setVideoUri(null);

    // 1. Check API Key Selection for Veo
    // Cast window to any to avoid type conflict with global 'AIStudio' type if it exists
    const aiStudio = (window as any).aistudio;

    if (aiStudio) {
      const hasKey = await aiStudio.hasSelectedApiKey();
      if (!hasKey) {
        try {
          await aiStudio.openSelectKey();
          // Re-check to avoid race condition assumptions if user cancels
          if (!(await aiStudio.hasSelectedApiKey())) {
             setError("An API key from a paid project is required for Video generation.");
             return;
          }
        } catch (e) {
          console.error(e);
          setError("Failed to select API key.");
          return;
        }
      }
    }

    // 2. Generate
    setIsLoading(true);
    try {
      const result = await generateVideo(prompt, aspectRatio, refImage || undefined);
      if (result.error) {
        if (result.error.includes("Requested entity was not found") && aiStudio) {
           // Handle stale key case
           await aiStudio.openSelectKey();
           setError("Key was invalid. Please try generating again with the new key.");
        } else {
           setError(result.error);
        }
      } else {
        setVideoUri(result.uri);
      }
    } catch (e: any) {
      setError(e.message || "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const base64 = result.split(',')[1];
      setRefImage({
        data: base64,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const clearRefImage = () => {
    setRefImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openBillingDocs = () => {
    window.open('https://ai.google.dev/gemini-api/docs/billing', '_blank');
  };

  return (
    <div className="flex flex-col h-full relative">
       {/* Main Display Area */}
       <div className="flex-1 overflow-y-auto w-full flex flex-col items-center justify-center">
         <div className="max-w-6xl mx-auto w-full px-4 pt-8 pb-4 flex-1 flex flex-col justify-center">
            
            {/* Empty State */}
            {!videoUri && !isLoading && !error && (
               <div className="flex flex-col items-center justify-center animate-fade-in text-center">
                  <div className="text-purple-500 text-6xl mb-6 shadow-purple-500/50 drop-shadow-2xl">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-20 h-20">
                       <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                     </svg>
                  </div>
                  <h2 className="text-2xl font-medium text-gray-800 dark:text-gray-200">Cinematic AI Video.</h2>
                  <p className="text-gray-500 mt-2">Create amazing videos with Veo.</p>
                  <div 
                    className="mt-4 text-xs text-amber-600 bg-amber-100 dark:text-amber-500/80 dark:bg-amber-900/10 px-3 py-1 rounded-full cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-900/20 transition-colors"
                    onClick={openBillingDocs}
                  >
                    ⚠️ Requires paid API key. Click for details.
                  </div>
               </div>
            )}

            {/* Error State */}
            {error && (
              <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-200 rounded-xl text-center max-w-md mx-auto">
                <div className="text-2xl mb-2">⚠️</div>
                {error}
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center">
                    <div className="flex gap-8 justify-center w-full">
                        <div className="w-[400px] h-[225px] rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse flex items-center justify-center border border-gray-200 dark:border-white/10">
                            <div className="text-purple-500 text-4xl animate-spin">{ICONS.loading}</div>
                        </div>
                    </div>
                    <p className="mt-6 text-gray-500 dark:text-gray-400 font-medium">Generating video... (this may take a minute)</p>
                </div>
            )}

            {/* Results Area */}
            {!isLoading && videoUri && (
               <div className="w-full max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10 bg-black">
                 <video 
                   src={`${videoUri}&key=${process.env.API_KEY}`} 
                   controls 
                   autoPlay 
                   loop
                   className="w-full h-auto max-h-[70vh]"
                 />
                 <div className="p-4 bg-white dark:bg-[#0a0a0a] flex justify-between items-center border-t border-gray-200 dark:border-white/10">
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-300 truncate max-w-lg">{prompt}</div>
                    <a 
                      href={`${videoUri}&key=${process.env.API_KEY}`} 
                      download 
                      className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-sm flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Download MP4
                    </a>
                 </div>
               </div>
            )}
         </div>
       </div>

       {/* Input Area */}
       <div className="max-w-3xl mx-auto w-full px-4 mb-6 z-10">
          {/* Reference Image Preview */}
          {refImage && (
             <div className="bg-white dark:bg-[#1a1a1a] rounded-t-2xl border-x border-t border-gray-200 dark:border-white/10 px-4 py-3 flex items-center justify-between animate-slide-up">
                <div className="flex items-center gap-3">
                   <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden relative group">
                      <img 
                        src={`data:${refImage.mimeType};base64,${refImage.data}`} 
                        alt="Reference" 
                        className="w-full h-full object-cover"
                      />
                   </div>
                   <div className="text-xs text-gray-500 dark:text-gray-400">
                      <div className="font-semibold text-gray-900 dark:text-white">Start Image</div>
                      <div>Video will begin with this frame</div>
                   </div>
                </div>
                <button 
                   onClick={clearRefImage}
                   className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                   </svg>
                </button>
             </div>
          )}

          {/* Aspect Ratio Pills */}
          <div className={`bg-white dark:bg-[#1a1a1a] border-x border-gray-200 dark:border-white/10 px-4 py-3 flex items-center gap-4 text-xs font-medium ${refImage ? 'border-t border-gray-100 dark:border-white/5' : 'rounded-t-2xl border-t'}`}>
             <div className="text-gray-500 flex items-center gap-1">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                 <path fillRule="evenodd" d="M1 11.27c0-.246.033-.492.099-.73l1.523-5.521A2.75 2.75 0 0 1 5.273 3h9.454a2.75 2.75 0 0 1 2.651 2.019l1.523 5.52c.066.239.099.485.099.732V15a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-3.73Zm3.068-5.852.651 2.36a.75.75 0 0 1-.726.95H3a.75.75 0 0 1-.75-.75v-.069c0-.041.003-.082.01-.122l.74-2.684a1.25 1.25 0 0 1 1.068-.315ZM14.12 3H5.273a2.75 2.75 0 0 0-2.651 2.019l-.366 1.326a2.254 2.254 0 0 0 1.708.884h11.472a2.25 2.25 0 0 0 1.708-.884l-.366-1.326A2.75 2.75 0 0 0 14.12 3ZM4.5 9.75a.75.75 0 0 0-.75.75V15c0 .414.336.75.75.75h11c.414 0 .75-.336.75-.75v-4.5a.75.75 0 0 0-.75-.75H4.5Z" clipRule="evenodd" />
               </svg>
               ASPECT RATIO:
             </div>
             <div className="flex gap-2">
               {ratios.map(r => (
                  <button 
                    key={r}
                    onClick={() => setAspectRatio(r)}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      aspectRatio === r 
                        ? 'bg-[#6366f1] text-white' 
                        : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10'
                    }`}
                  >
                    {r}
                  </button>
               ))}
             </div>
          </div>

          {/* Input Bar */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-b-3xl border border-gray-200 dark:border-white/10 shadow-lg dark:shadow-xl flex items-center p-2 pr-2">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />
            <button 
               onClick={() => fileInputRef.current?.click()}
               className="p-3 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
               title="Upload reference image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
              </svg>
            </button>
            <input 
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Describe the video you want to generate..."
              className="flex-1 bg-transparent py-3 px-2 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
            />
             <button 
               onClick={handleGenerate}
               disabled={(!prompt.trim() && !refImage) || isLoading}
               className={`p-2 rounded-full transition-all ${
                 (prompt.trim() || refImage) && !isLoading ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200' : 'bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-gray-500'
               }`}
             >
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
               </svg>
             </button>
          </div>
       </div>
    </div>
  );
};

export default VideoGenerator;