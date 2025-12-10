import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '../types';
import { ICONS } from '../constants';

const CalendarPlanner: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('hanaxia-events');
    return saved ? JSON.parse(saved) : [];
  });
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    localStorage.setItem('hanaxia-events', JSON.stringify(events));
  }, [events]);

  const addEvent = () => {
    if (!title || !date) return;
    setEvents(prev => [{ id: Date.now().toString(), title, date }, ...prev].sort((a,b) => a.date.localeCompare(b.date)));
    setTitle('');
    setDate('');
  };

  const removeEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white/50 dark:bg-black/20 p-6 rounded-2xl border border-white/20 shadow-sm backdrop-blur-sm flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold uppercase tracking-wider opacity-60 ml-1">Event Title</label>
            <input 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              placeholder="Meeting with Board"
              className="w-full mt-1 p-3 rounded-xl bg-white/50 dark:bg-black/40 border border-gray-200 dark:border-gray-700 outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <div className="min-w-[150px]">
            <label className="text-xs font-semibold uppercase tracking-wider opacity-60 ml-1">Date</label>
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)}
              className="w-full mt-1 p-3 rounded-xl bg-white/50 dark:bg-black/40 border border-gray-200 dark:border-gray-700 outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <button 
            onClick={addEvent}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/20"
          >
            Add Event
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.length === 0 ? (
            <div className="col-span-full text-center py-12 opacity-50">
              No events scheduled.
            </div>
          ) : (
            events.map(ev => (
              <div key={ev.id} className="group bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all relative">
                <div className="flex items-center gap-2 mb-2 text-purple-600 dark:text-purple-400 text-sm font-semibold">
                  {ICONS.calendar} {new Date(ev.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                <div className="font-medium text-lg text-gray-800 dark:text-gray-100">{ev.title}</div>
                
                <button 
                  onClick={() => removeEvent(ev.id)}
                  className="absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                >
                  {ICONS.trash}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPlanner;