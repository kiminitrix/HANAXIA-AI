import React from 'react';

export const ICONS = {
  sun: '☀️',
  moon: '🌙',
  chat: '💬',
  doc: '📄',
  planner: '🧭',
  calendar: '📆',
  image: '🖼️',
  video: '🎬',
  send: '📤',
  loading: '⏳',
  trash: '🗑️',
  check: '✅',
  plus: '➕',
};

export const ROUTES = [
  { id: 'chat', label: 'Hanaxia Chat', icon: ICONS.chat },
  { id: 'doc', label: 'Doc Parser', icon: ICONS.doc },
  { id: 'agent', label: 'Agentic Planner', icon: ICONS.planner },
  { id: 'calendar', label: 'Calendar Planner', icon: ICONS.calendar },
  { id: 'image', label: 'Image Generator', icon: ICONS.image },
  { id: 'video', label: 'Video Generator', icon: ICONS.video },
] as const;
