import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';
import { parseDocument } from '../services/geminiService';
import { wsService } from '../services/websocketService';
import { SocketEvents, SocketPayloads } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

const DocParser: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [parsedText, setParsedText] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [mdPreviews, setMdPreviews] = useState<{name: string, content: string}[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time doc updates
  useEffect(() => {
    const unsubscribe = wsService.subscribe(
      SocketEvents.DOC_UPDATE,
      (payload: SocketPayloads[SocketEvents.DOC_UPDATE]) => {
        setParsedText(payload.text);
      }
    );
    return unsubscribe;
  }, []);

  // Clear parsed text when files change to ensure result consistency
  useEffect(() => {
    if (parsedText && !isProcessing) {
      setParsedText(null);
    }
  }, [files]);

  // Handle File Preview for Markdown
  useEffect(() => {
    const loadPreviews = async () => {
      const previews: {name: string, content: string}[] = [];
      
      for (const file of files) {
        if (file.name.toLowerCase().endsWith('.md') || file.type === 'text/markdown') {
          try {
            const content = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.readAsText(file);
            });
            previews.push({ name: file.name, content });
          } catch (e) {
            console.error("Failed to read markdown file", e);
          }
        }
      }
      setMdPreviews(previews);
    };

    loadPreviews();
  }, [files]);

  const validateFiles = (fileList: FileList): File[] => {
    const validFiles: File[] = [];
    let hasSizeError = false;

    Array.from(fileList).forEach(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        hasSizeError = true;
      } else {
        validFiles.push(file);
      }
    });

    if (hasSizeError) {
      setError("One or more files exceeded the 10MB size limit and were skipped.");
    } else {
      setError(null);
    }
    return validFiles;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = validateFiles(e.dataTransfer.files);
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = validateFiles(e.target.files);
      setFiles(prev => [...prev, ...validFiles]);
    }
    e.target.value = ''; // Reset input to allow re-selecting same files
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    if (files.length === 1) { // Will become 0
       setError(null);
    }
  };

  const clearFiles = () => {
    setFiles([]);
    setParsedText(null);
    setError(null);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const className = "w-8 h-8";
    
    switch(ext) {
      case 'pdf': 
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${className} text-red-500`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        );
      case 'md':
      case 'txt':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${className} text-blue-500`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        );
      case 'csv':
        return (
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${className} text-green-500`}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3h-7.5m7.5 0H12m0 0h-7.5m7.5 0v-1.5c0-.621.504-1.125 1.125-1.125M12 5.625v7.125M3.75 5.625A1.125 1.125 0 0 1 4.875 4.5h14.25a1.125 1.125 0 0 1 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125H4.875A1.125 1.125 0 0 1 3.75 7.125v-1.5Z" />
           </svg>
        );
      case 'html':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${className} text-orange-500`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${className} text-gray-500`}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        );
    }
  };

  const readFileContent = (file: File): Promise<{ content: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      // Enhanced detection for images in case file.type is missing
      const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|heic|bmp)$/i.test(file.name);
      
      const reader = new FileReader();
      
      if (isPdf || isImage) {
        reader.readAsDataURL(file);
        reader.onload = () => {
          const result = reader.result as string;
          // Robustly handle data URI format
          const base64 = result.includes(',') ? result.split(',')[1] : result;
          
          let mimeType = file.type;
          // Fallback if browser didn't detect type
          if (!mimeType) {
             if (isPdf) mimeType = 'application/pdf';
             else if (isImage) mimeType = 'image/jpeg'; // Fallback to jpeg
          }

          resolve({ content: base64, mimeType });
        };
      } else {
        reader.readAsText(file);
        reader.onload = () => {
           resolve({ content: reader.result as string, mimeType: 'text/plain' });
        };
      }
      reader.onerror = (error) => reject(error);
    });
  };

  const handleParse = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setParsedText(null);
    setError(null);

    try {
      const results: string[] = [];
      // Process files sequentially to maintain order and stability
      for (const file of files) {
        const { content, mimeType } = await readFileContent(file);
        const result = await parseDocument(content, mimeType, file.name);
        results.push(`## Analysis: ${file.name}\n\n${result}`);
      }
      
      const combinedText = results.join('\n\n---\n\n');
      setParsedText(combinedText);
      wsService.send(SocketEvents.DOC_UPDATE, { text: combinedText });
    } catch (error) {
      console.error("Parsing failed", error);
      setError("Error parsing one or more documents. Please check file formats.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (parsedText) {
      navigator.clipboard.writeText(parsedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
            Intelligent Document Parser
          </h2>
          <p className="text-gray-500 dark:text-gray-400">Upload multiple PDF, Markdown, Text, CSV, or HTML files to extract insights instantly.</p>
          <div className="text-xs text-purple-600 dark:text-purple-400 font-mono bg-purple-50 dark:bg-purple-900/10 px-2 py-1 rounded inline-block">
            ● Live Collaboration Enabled
          </div>
        </div>

        {/* Upload Area */}
        <div 
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ease-in-out ${
            dragActive 
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 scale-[1.01]' 
              : 'border-gray-300 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600'
          }`}
          onDragEnter={handleDrag} 
          onDragLeave={handleDrag} 
          onDragOver={handleDrag} 
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            onChange={handleChange}
            accept=".pdf,.txt,.md,.csv,.html"
            multiple // Enable multiple files
          />
          
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-colors ${dragActive ? 'bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-white' : 'bg-purple-100 dark:bg-purple-900/50'}`}>
              {ICONS.doc}
            </div>
            
            {files.length === 0 ? (
              <div>
                <label htmlFor="file-upload" className="cursor-pointer font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400 underline decoration-dotted">
                  Click to upload
                </label>
                <span className="text-gray-500"> or drag and drop</span>
                <p className="text-xs text-gray-400 mt-2">Supported: PDF, TXT, MD, CSV, HTML (Max 10MB)</p>
              </div>
            ) : (
              <div className="w-full">
                 <div className="flex items-center justify-center gap-2 mb-4">
                   <button onClick={clearFiles} className="text-xs text-red-500 hover:text-red-600 underline">Clear All</button>
                   <label htmlFor="file-upload" className="text-xs text-purple-600 hover:text-purple-500 cursor-pointer underline">Add More</label>
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
           <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 p-3 rounded-lg text-sm text-center border border-red-100 dark:border-red-900/30 animate-fade-in">
             {error}
           </div>
        )}

        {/* File List */}
        {files.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
             {files.map((f, i) => (
                <div key={`${f.name}-${i}`} className="bg-white dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/10 shadow-sm flex items-center gap-3 relative group">
                   <div className="flex-shrink-0">
                      {getFileIcon(f.name)}
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate" title={f.name}>{f.name}</div>
                      <div className="text-xs text-gray-500">{(f.size / 1024).toFixed(1)} KB</div>
                   </div>
                   <button 
                     onClick={() => removeFile(i)}
                     className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                     title="Remove file"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                     </svg>
                   </button>
                </div>
             ))}
          </div>
        )}

        {/* Action Button */}
        {files.length > 0 && (
           <div className="flex justify-center">
             <button 
                onClick={handleParse} 
                disabled={isProcessing}
                className={`px-8 py-3 rounded-xl font-medium transition-all shadow-lg flex items-center justify-center gap-2 min-w-[200px]
                  ${isProcessing 
                      ? 'bg-gray-100 dark:bg-white/10 text-gray-400 cursor-not-allowed' 
                      : 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-500/30 hover:scale-105'
                  }`}
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    <span>Processing {files.length} file{files.length > 1 ? 's' : ''}...</span>
                  </>
                ) : (
                  <>
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                     </svg>
                     Analyze Documents
                  </>
                )}
              </button>
           </div>
        )}

        {/* Markdown Previews */}
        {mdPreviews.length > 0 && !isProcessing && (
          <div className="space-y-4">
             {mdPreviews.map((preview, i) => (
                <div key={i} className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm animate-fade-in">
                   <div className="flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-white/5 pb-3">
                     <span className="text-sm font-bold uppercase tracking-wider text-gray-500">Preview: {preview.name}</span>
                     <span className="text-xs bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded text-gray-500">Markdown</span>
                   </div>
                   <div className="prose prose-sm dark:prose-invert max-w-none max-h-[200px] overflow-y-auto custom-scrollbar">
                      <ReactMarkdown 
                         remarkPlugins={[remarkGfm]}
                         rehypePlugins={[rehypeHighlight]}
                         components={{
                           pre: ({node, ...props}) => <pre className="bg-gray-50 dark:bg-black/50 p-3 rounded-lg overflow-x-auto" {...props} />,
                           code: ({node, className, children, ...props}) => {
                              const match = /language-(\w+)/.exec(className || '');
                              const isInline = !match && !className?.includes('hljs');
                              if (isInline) return <code className="bg-gray-100 dark:bg-white/10 px-1 py-0.5 rounded text-xs" {...props}>{children}</code>;
                              return <code className={className} {...props}>{children}</code>;
                           }
                         }}
                      >
                        {preview.content}
                      </ReactMarkdown>
                   </div>
                </div>
             ))}
          </div>
        )}

        {/* Analysis Result */}
        {parsedText && (
          <div className="bg-white/50 dark:bg-black/20 rounded-2xl border border-white/20 p-6 backdrop-blur-sm shadow-sm animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <span className="w-2 h-6 bg-purple-500 rounded-full inline-block"></span>
                Analysis Result
              </h3>
              <button 
                onClick={handleCopy}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5
                   ${copied 
                     ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400' 
                     : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                   }`}
              >
                {copied ? (
                   <>
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                       <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                     </svg>
                     Copied!
                   </>
                ) : (
                   <>
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                     </svg>
                     Copy
                   </>
                )}
              </button>
            </div>
            
            <div className="prose prose-slate dark:prose-invert max-w-none text-sm">
                <ReactMarkdown 
                   remarkPlugins={[remarkGfm]}
                   rehypePlugins={[rehypeHighlight]}
                   components={{
                      pre: ({node, ...props}) => <pre className="bg-[#282c34] text-white p-4 rounded-lg overflow-x-auto shadow-inner" {...props} />,
                      code: ({node, className, children, ...props}) => {
                         const match = /language-(\w+)/.exec(className || '');
                         const isInline = !match && !className?.includes('hljs');
                         if (isInline) return <code className="bg-gray-100 dark:bg-white/10 px-1 py-0.5 rounded text-xs font-mono text-pink-500" {...props}>{children}</code>;
                         return <code className={className} {...props}>{children}</code>;
                      }
                   }}
                >
                  {parsedText}
                </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocParser;