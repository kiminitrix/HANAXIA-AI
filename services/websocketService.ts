import { SocketEvents } from '../types';

type Listener<T = any> = (payload: T) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Set<Listener>> = new Map();
  // Default to localhost or specific env var. Echo server is useful for self-test if no backend.
  private url: string = 'ws://localhost:8080';
  private reconnectInterval: number = 3000;

  constructor() {
    if (typeof process !== 'undefined' && process.env?.REACT_APP_WS_URL) {
      this.url = process.env.REACT_APP_WS_URL;
    } else if (typeof window !== 'undefined' && (window as any).HANAXIA_WS_URL) {
      this.url = (window as any).HANAXIA_WS_URL;
    }
  }

  connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      console.log(`Connecting to WS: ${this.url}`);
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        console.log('Hanaxia WebSocket Connected');
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Expecting format: { type: string, payload: any }
          if (data.type && data.payload) {
            this.emitLocal(data.type, data.payload);
          }
        } catch (e) {
          // Ignore parse errors (non-JSON messages)
        }
      };

      this.socket.onclose = () => {
        console.log('Hanaxia WebSocket Disconnected. Retrying...');
        this.socket = null;
        setTimeout(() => this.connect(), this.reconnectInterval);
      };

      this.socket.onerror = (error) => {
        // Silently handle error to prevent console spam in offline mode
      };
    } catch (e) {
      console.warn('WS Connection failed', e);
    }
  }

  send<T>(type: SocketEvents, payload: T) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, payload }));
    }
  }

  subscribe<T>(type: SocketEvents, callback: Listener<T>) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    // Unsubscribe function
    return () => {
      const callbacks = this.listeners.get(type);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  private emitLocal(type: string, payload: any) {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      callbacks.forEach(cb => cb(payload));
    }
  }
}

export const wsService = new WebSocketService();