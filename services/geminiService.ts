import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Attachment } from "../types";

// Helper to get client instance - recreated to ensure fresh key if needed
const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const streamChatResponse = async (
  history: { role: string; parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] }[],
  newMessage: string,
  attachments: Attachment[] = []
) => {
  const ai = getClient();
  
  // Create chat with history
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    history: history,
    config: {
      systemInstruction: 'You are Hanaxia, a helpful, professional, and intelligent AI assistant used in a corporate environment. You can analyze images, audio, PDFs, and other documents provided by the user.',
    }
  });

  // Construct current message parts
  const parts: any[] = [];
  
  // Add attachments first (multimodal context)
  if (attachments && attachments.length > 0) {
    attachments.forEach(att => {
      parts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data
        }
      });
    });
  }

  // Add text prompt
  if (newMessage) {
    parts.push({ text: newMessage });
  }

  // If both are empty (rare edge case), send a placeholder to avoid API error
  if (parts.length === 0) {
    parts.push({ text: "..." });
  }

  return await chat.sendMessageStream({ message: { parts } });
};

export const parseDocument = async (
  fileData: string,
  mimeType: string,
  fileName: string
): Promise<string> => {
  const ai = getClient();
  // Using flash for fast document understanding
  
  const parts: any[] = [];
  
  // Handle binary vs text data
  // PDF and Images go to inlineData. Text files go to text part.
  const isBinary = mimeType === 'application/pdf' || mimeType.startsWith('image/');

  if (isBinary) {
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: fileData,
      },
    });
    parts.push({
      text: `Analyze this document (${fileName}). Provide a comprehensive summary and extract key metadata in a structured format.`,
    });
  } else {
    // Treat as text content
    parts.push({
      text: `Analyze the following document content (${fileName}):\n\n${fileData}\n\nProvide a comprehensive summary and extract key metadata in a structured format.`,
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: parts,
    },
  });
  return response.text || "Could not parse document.";
};

export const runAgenticPlan = async (goal: string): Promise<string> => {
  const ai = getClient();
  // Using 3-pro-preview with thinking for complex planning
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Create a detailed, step-by-step execution plan for the following goal: "${goal}". Break it down into phases, actionable steps, and success criteria.`,
    config: {
      thinkingConfig: { thinkingBudget: 2048 },
    },
  });
  return response.text || "Could not generate plan.";
};

export interface ReferenceImage {
  data: string; // base64
  mimeType: string;
}

export const generateImage = async (
  prompt: string, 
  aspectRatio: string = "1:1", 
  count: number = 1,
  referenceImage?: ReferenceImage
): Promise<string[]> => {
  const ai = getClient();
  
  // Create an array of promises to generate 'count' number of images in parallel
  const promises = Array.from({ length: count }).map(async () => {
    try {
      const parts: any[] = [];
      
      // If reference image exists, add it first (multimodal prompt)
      if (referenceImage) {
        parts.push({
          inlineData: {
            mimeType: referenceImage.mimeType,
            data: referenceImage.data
          }
        });
      }
      
      // Add text prompt
      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: parts
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
          }
        }
      });
      
      const imgs: string[] = [];
      if (response.candidates?.[0]?.content?.parts) {
         for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
               imgs.push(`data:image/png;base64,${part.inlineData.data}`);
            }
         }
      }
      return imgs;
    } catch (error) {
      console.error("Image generation request failed", error);
      return [];
    }
  });

  const results = await Promise.all(promises);
  return results.flat();
};

export interface VeoResponse {
  uri: string;
  error?: string;
}

export const generateVideo = async (
  prompt: string, 
  aspectRatio: string = '16:9',
  referenceImage?: ReferenceImage
): Promise<VeoResponse> => {
  const ai = getClient();
  
  try {
    const params: any = {
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio
      }
    };

    if (referenceImage) {
      params.image = {
        imageBytes: referenceImage.data,
        mimeType: referenceImage.mimeType
      };
    }

    let operation = await ai.models.generateVideos(params);

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) throw new Error("No video URI returned.");
    
    return { uri };
  } catch (error: any) {
    console.error("Video generation error", error);
    return { uri: '', error: error.message || "Failed to generate video" };
  }
};