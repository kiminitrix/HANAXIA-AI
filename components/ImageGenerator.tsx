import React, { useState, useRef } from 'react';
import { ICONS } from '../constants';
import { generateImage, ReferenceImage } from '../services/geminiService';

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [refImage, setRefImage] = useState<ReferenceImage | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ratios = ['1:1', '3:4', '4:3', '9:16', '16:9'];

  const handleGenerate = async () => {
    if (!prompt.trim() && !refImage) return;
    setIsLoading(true);
    setImages([]); 
    try {
      const results = await generateImage(prompt, aspectRatio, 1, refImage || undefined);
      setImages(results);
    } catch (e) {
      console.error(e);
      alert("Failed to generate image.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (e: React.MouseEvent, src: string, index: number) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = src;
    link.download = `hanaxia-gen-${Date.now()}-${index}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-gray-50 dark:bg-transparent">
       {/* Modal for View Large */}
       {selectedImage && (
         <div 
           className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
           onClick={() => setSelectedImage(null)}
         >
           <button 
             className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
             onClick={() => setSelectedImage(null)}
           >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
               <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
             </svg>
           </button>
           <img 
             src={selectedImage} 
             alt="Full size" 
             className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
             onClick={e => e.stopPropagation()} 
           />
           <button
             className="absolute bottom-8 px-6 py-3 bg-white text-black font-bold rounded-full shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
             onClick={(e) => handleDownload(e, selectedImage, 999)}
           >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
             </svg>
             Download
           </button>
         </div>
       )}

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
                placeholder="A futuristic city in the clouds, cyberpunk style..."
                className="w-full p-4 rounded-2xl bg-gray-100 dark:bg-black/40 border border-transparent focus:border-purple-500 outline-none transition-all text-sm resize-none h-32 leading-relaxed"
              />
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Aspect Ratio</label>
              <div className="grid grid-cols-3 gap-2">
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

            {/* Reference Image Section */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Style Reference</label>
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
                  <span className="text-xs font-medium">Add Style/Structure</span>
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
                  <span>Dreaming...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                  </svg>
                  Generate Vision
                </>
              )}
            </button>
          </div>

          <div className="mt-auto p-6 bg-purple-50 dark:bg-purple-900/10 border-t border-purple-100 dark:border-white/5">
             <div className="flex items-center gap-3 text-purple-600 dark:text-purple-400">
                <div className="p-2 bg-white dark:bg-black/20 rounded-lg shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                   <div className="text-xs font-bold">PRO TIP</div>
                   <div className="text-[10px] leading-tight opacity-70">Use style references to keep structural consistency.</div>
                </div>
             </div>
          </div>
       </div>

       {/* Right Panel: Workspace / Results Area */}
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
            {images.length === 0 && !isLoading && (
               <div className="flex flex-col items-center justify-center animate-fade-in text-center max-w-sm">
                  <div className="w-24 h-24 bg-gray-100 dark:bg-white/5 rounded-3xl flex items-center justify-center text-gray-300 dark:text-gray-700 mb-6 rotate-3">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                     </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Creative Workspace</h3>
                  <p className="text-sm text-gray-500 mt-2">Adjust settings on the left and start generating high-quality AI images.</p>
               </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center animate-fade-in">
                    <div className="relative">
                      <div className="w-64 h-64 md:w-96 md:h-96 rounded-3xl bg-gray-100 dark:bg-white/5 animate-pulse border border-gray-200 dark:border-white/10 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-purple-500/10 to-transparent" />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-purple-500/20" />
                      </div>
                    </div>
                    <div className="mt-8 text-center">
                      <p className="text-purple-600 dark:text-purple-400 font-bold tracking-widest text-xs uppercase animate-pulse">Rendering Reality...</p>
                    </div>
                </div>
            )}

            {/* Results Area */}
            {!isLoading && images.length > 0 && (
               <div className="w-full flex flex-col items-center gap-8 animate-fade-in">
                  {images.map((src, i) => (
                    <div 
                      key={i} 
                      className="group relative rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black max-w-full max-h-[80vh] transition-all hover:shadow-purple-500/20"
                    >
                      <img 
                        src={src} 
                        alt={`Generated ${i}`} 
                        className="max-w-full max-h-[80vh] w-auto h-auto object-contain cursor-zoom-in" 
                        onClick={() => setSelectedImage(src)}
                      />
                      
                      {/* Action Overlay */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2 p-2 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10">
                        <button 
                           onClick={() => setSelectedImage(src)}
                           className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
                           title="View Large"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                            </svg>
                        </button>
                        <button 
                           onClick={(e) => handleDownload(e, src, i)}
                           className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-bold text-xs flex items-center gap-2 transition-all"
                           title="Download"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            Download
                        </button>
                      </div>
                    </div>
                  ))}
               </div>
            )}
         </div>
       </div>
    </div>
  );
};

export default ImageGenerator;