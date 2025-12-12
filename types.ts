export interface Attachment {
  id: string;
  type: 'image' | 'audio' | 'video' | 'file';
  mimeType: string;
  data: string; // base64
  name: string;
  size: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  time: number;
  attachments?: Attachment[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}

export interface Goal {
  id: string;
  title: string;
  text: string;
  created: number;
  plan?: string;
}

export interface AgentTemplate {
  id: string;
  name: string;
  title: string;
  text: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  description?: string;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
}

export interface GeneratedVideo {
  url: string;
  prompt: string;
}

export enum AppRoute {
  CHAT = 'chat',
  DOC = 'doc',
  AGENT = 'agent',
  CALENDAR = 'calendar',
  IMAGE = 'image',
  VIDEO = 'video',
}

export enum SocketEvents {
  CHAT_MESSAGE = 'CHAT_MESSAGE',
  DOC_UPDATE = 'DOC_UPDATE',
  AGENT_UPDATE = 'AGENT_UPDATE',
  AGENT_DELETE = 'AGENT_DELETE',
  INPUT_UPDATE = 'INPUT_UPDATE',
  INPUT_CURSOR = 'INPUT_CURSOR',
}

export interface SocketPayloads {
  [SocketEvents.CHAT_MESSAGE]: {
    conversationId: string;
    conversationTitle?: string;
    message: Message;
  };
  [SocketEvents.DOC_UPDATE]: {
    text: string;
  };
  [SocketEvents.AGENT_UPDATE]: {
    goal: Goal;
  };
  [SocketEvents.AGENT_DELETE]: {
    id: string;
  };
  [SocketEvents.INPUT_UPDATE]: {
    conversationId: string;
    text: string;
    senderId: string;
  };
  [SocketEvents.INPUT_CURSOR]: {
    conversationId: string;
    userId: string;
    userName: string;
    color: string;
    selectionStart: number;
    selectionEnd: number;
  };
}