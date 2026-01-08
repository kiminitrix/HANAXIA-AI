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
    const aiStudio = (window as any).aistudio;

    if (aiStudio) {
      const hasKey = await aiStudio.hasSelectedApiKey();
      if (!hasKey) {
        try {
          await aiStudio.openSelectKey();
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
    <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-gray-50 dark:bg-transparent">
       
       {/* Left Panel: Control Sidebar */}
       <div className="lg:w-96 w-full flex-none bg-white dark:bg-white/5 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-white/10 overflow-y-auto custom-scrollbar flex flex-col">
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
                Studio Settings
              </h2>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-semibold opacity-60">Config Your Generation</p>
            </div>

            {/* Prompt Area */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Prompt</label>
              <textarea 
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="A high-tech lab where a robot is soldering a circuit board, cinematic lighting, 4k..."
                className="w-full p-4 rounded-2xl bg-gray-100 dark:bg-black/40 border border-transparent focus:border-purple-500 outline-none transition-all text-sm resize-none h-32 leading-relaxed"
              />
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Aspect Ratio</label>
              <div className="grid grid-cols-2 gap-2">
                {ratios.map(r => (
                  <button 
                    key={r}
                    onClick={() => setAspectRatio(r)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      aspectRatio === r 
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
                        : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Start Image (Reference) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Start Image (Optional)</label>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
              />
              
              {!refImage ? (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-purple-500 hover:text-purple-500 transition-all group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                  </svg>
                  <span className="text-xs font-medium">Upload Initial Frame</span>
                </button>
              ) : (
                <div className="relative group rounded-2xl overflow-hidden aspect-video border border-gray-200 dark:border-white/10">
                   <img 
                    src={`data:${refImage.mimeType};base64,${refImage.data}`} 
                    alt="Ref" 
                    className="w-full h-full object-cover"
                   />
                   <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={clearRefImage}
                        className="p-2 bg-red-500 text-white rounded-full hover:scale-110 transition-transform"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                         </svg>
                      </button>
                   </div>
                </div>
              )}
            </div>

            <button 
              onClick={handleGenerate}
              disabled={(!prompt.trim() && !refImage) || isLoading}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                  Generate Video
                </>
              )}
            </button>
          </div>

          <div className="mt-auto p-6 bg-purple-50 dark:bg-purple-900/10 border-t border-purple-100 dark:border-white/5">
             <div className="flex flex-col gap-2">
                <div 
                    className="flex items-center gap-2 text-amber-600 dark:text-amber-500/80 cursor-pointer hover:underline"
                    onClick={openBillingDocs}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] font-bold">PAID API KEY REQUIRED</span>
                </div>
                <div className="text-[10px] text-gray-500 opacity-70 leading-tight">
                    Veo generation models require a paid Tier API key. Use 1080p for higher quality.
                </div>
             </div>
          </div>
       </div>

       {/* Right Panel: Workspace Area */}
       <div className="flex-1 overflow-y-auto w-full h-full relative custom-scrollbar bg-white dark:bg-[#0a0a0a]">
         {/* Subtle Grid Background */}
         <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(to right, #808080 1px, transparent 1px), linear-gradient(to bottom, #808080 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />

         <div className="min-h-full w-full p-8 flex flex-col items-center justify-center">
            
            {/* Empty State */}
            {!videoUri && !isLoading && !error && (
               <div className="flex flex-col items-center justify-center animate-fade-in text-center max-w-sm">
                  <div className="w-24 h-24 bg-gray-100 dark:bg-white/5 rounded-3xl flex items-center justify-center text-gray-300 dark:text-gray-700 mb-6 -rotate-3">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12">
                       <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                     </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Cinematic Workspace</h3>
                  <p className="text-sm text-gray-500 mt-2">Adjust your vision on the left to start generating cinematic AI video clips.</p>
               </div>
            )}

            {/* Error State */}
            {error && (
              <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-2xl text-center max-w-md mx-auto animate-fade-in">
                <div className="text-3xl mb-3">⚠️</div>
                <div className="font-bold mb-1">Generation Error</div>
                <div className="text-sm opacity-80">{error}</div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center animate-fade-in">
                    <div className="relative">
                      <div className="w-64 h-64 md:w-[480px] md:h-[270px] rounded-3xl bg-gray-100 dark:bg-white/5 animate-pulse border border-gray-200 dark:border-white/10 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-purple-500/10 to-transparent" />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-purple-500/20" />
                      </div>
                    </div>
                    <div className="mt-8 text-center space-y-2">
                      <p className="text-purple-600 dark:text-purple-400 font-bold tracking-widest text-xs uppercase animate-pulse">Rendering Reality...</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest opacity-60">This typically takes 1-2 minutes</p>
                    </div>
                </div>
            )}

            {/* Results Area */}
            {!isLoading && videoUri && (
               <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6 animate-fade-in">
                 <div className="w-full rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10 bg-black aspect-video relative group">
                    <video 
                      src={`${videoUri}&key=${process.env.API_KEY}`} 
                      controls 
                      autoPlay 
                      loop
                      className="w-full h-full object-contain"
                    />
                 </div>
                 
                 <div className="w-full bg-white dark:bg-[#1a1a1a] p-5 rounded-3xl border border-gray-200 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
                    <div className="flex-1 min-w-0 px-2 text-center md:text-left">
                       <div className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">Prompt Detail</div>
                       <div className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-lg italic font-medium">"{prompt}"</div>
                    </div>
                    <a 
                      href={`${videoUri}&key=${process.env.API_KEY}`} 
                      download 
                      className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-2xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-all text-sm flex items-center gap-2 shadow-lg shadow-black/10"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Download MP4
                    </a>
                 </div>
               </div>
            )}
         </div>
       </div>
    </div>
  );
};

export default VideoGenerator;