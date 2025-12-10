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
      // Generate 1 image
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
      // Extract base64 part
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
    <div className="flex flex-col h-full relative">
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

       {/* Main Display Area */}
       <div className="flex-1 overflow-y-auto w-full flex flex-col items-center justify-center">
         <div className="max-w-6xl mx-auto w-full px-4 pt-8 pb-4 flex-1 flex flex-col justify-center">
            
            {/* Empty State */}
            {images.length === 0 && !isLoading && (
               <div className="flex flex-col items-center justify-center animate-fade-in text-center">
                  <div className="text-purple-500 text-6xl mb-6 shadow-purple-500/50 drop-shadow-2xl">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-20 h-20">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                     </svg>
                  </div>
                  <h2 className="text-2xl font-medium text-gray-800 dark:text-gray-200">Create something amazing.</h2>
                  <p className="text-gray-500 mt-2">Enter a prompt below to generate.</p>
               </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center">
                    <div className="flex gap-8 justify-center w-full">
                        <div className="w-[400px] h-[400px] rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse flex items-center justify-center border border-gray-200 dark:border-white/10">
                            <div className="text-purple-500 text-4xl animate-spin">{ICONS.loading}</div>
                        </div>
                    </div>
                    <p className="mt-6 text-gray-500 dark:text-gray-400 font-medium">Dreaming up your image...</p>
                </div>
            )}

            {/* Results Area */}
            {!isLoading && images.length > 0 && (
               <div className="flex flex-wrap justify-center items-center gap-8 w-full">
                  {images.map((src, i) => (
                    <div key={i} className="group relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black max-w-[450px] w-full aspect-square transition-transform hover:scale-[1.02]">
                      <img src={src} alt={`Generated ${i}`} className="w-full h-full object-cover" />
                      
                      {/* Action Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4 backdrop-blur-[2px]">
                        <button 
                           onClick={() => setSelectedImage(src)}
                           className="p-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white backdrop-blur-md transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                           title="View Large"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>
                        </button>
                        <button 
                           onClick={(e) => handleDownload(e, src, i)}
                           className="p-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white backdrop-blur-md transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75"
                           title="Download"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                        </button>
                      </div>
                    </div>
                  ))}
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
                      <div className="font-semibold text-gray-900 dark:text-white">Reference Image</div>
                      <div>Used for structure & style</div>
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
              placeholder="Describe the image you want to generate..."
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

export default ImageGenerator;