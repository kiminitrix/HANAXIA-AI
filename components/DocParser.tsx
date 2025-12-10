import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';
import { parseDocument } from '../services/geminiService';
import { wsService } from '../services/websocketService';
import { SocketEvents, SocketPayloads } from '../types';

const DocParser: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedText, setParsedText] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        let result = reader.result as string;
        // Remove data URL prefix (e.g. "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleParse = async () => {
    if (!file) return;
    setIsProcessing(true);
    setParsedText(null);

    try {
      const base64Data = await convertFileToBase64(file);
      const result = await parseDocument(base64Data, file.type, file.name);
      setParsedText(result);
      // Broadcast result to other users
      wsService.send(SocketEvents.DOC_UPDATE, { text: result });
    } catch (error) {
      console.error("Parsing failed", error);
      setParsedText("Error parsing document. Please try again or ensure the format is supported.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
            Intelligent Document Parser
          </h2>
          <p className="text-gray-500 dark:text-gray-400">Upload a PDF or Text file to extract insights and summaries instantly.</p>
          <div className="text-xs text-purple-600 dark:text-purple-400 font-mono bg-purple-50 dark:bg-purple-900/10 px-2 py-1 rounded inline-block">
            ● Live Collaboration Enabled
          </div>
        </div>

        <div 
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
            dragActive 
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
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
          />
          
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-3xl">
              {ICONS.doc}
            </div>
            
            {file ? (
              <div className="space-y-2">
                <div className="font-medium text-lg">{file.name}</div>
                <div className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</div>
                <button 
                  onClick={handleParse} 
                  disabled={isProcessing}
                  className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/30 disabled:opacity-50"
                >
                  {isProcessing ? 'Analyzing...' : 'Parse Document'}
                </button>
              </div>
            ) : (
              <div>
                <label htmlFor="file-upload" className="cursor-pointer font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400">
                  Upload a file
                </label>
                <span className="text-gray-500"> or drag and drop</span>
              </div>
            )}
          </div>
        </div>

        {parsedText && (
          <div className="bg-white/50 dark:bg-black/20 rounded-2xl border border-white/20 p-6 backdrop-blur-sm shadow-sm animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Analysis Result</h3>
              <button 
                onClick={() => navigator.clipboard.writeText(parsedText)}
                className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Copy
              </button>
            </div>
            <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
              {parsedText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocParser;