import React, { useState, useEffect } from 'react';
import { Goal, AgentTemplate, SocketEvents, SocketPayloads } from '../types';
import { ICONS } from '../constants';
import { runAgenticPlan } from '../services/geminiService';
import { wsService } from '../services/websocketService';

const AgenticPlanner: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('hanaxia-agent-goals');
    return saved ? JSON.parse(saved) : [];
  });
  const [templates, setTemplates] = useState<AgentTemplate[]>(() => {
    const saved = localStorage.getItem('hanaxia-agent-templates');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalText, setNewGoalText] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  
  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    localStorage.setItem('hanaxia-agent-goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('hanaxia-agent-templates', JSON.stringify(templates));
  }, [templates]);

  // Subscribe to real-time agent updates
  useEffect(() => {
    const unsubUpdate = wsService.subscribe(
      SocketEvents.AGENT_UPDATE, 
      (payload: SocketPayloads[SocketEvents.AGENT_UPDATE]) => {
        setGoals(prev => {
           const idx = prev.findIndex(g => g.id === payload.goal.id);
           if (idx !== -1) {
             const copy = [...prev];
             copy[idx] = payload.goal;
             return copy;
           }
           return [payload.goal, ...prev];
        });
      }
    );

    const unsubDelete = wsService.subscribe(
      SocketEvents.AGENT_DELETE,
      (payload: SocketPayloads[SocketEvents.AGENT_DELETE]) => {
        setGoals(prev => prev.filter(g => g.id !== payload.id));
        if (editingId === payload.id) {
            setEditingId(null);
            setEditText('');
        }
      }
    );

    return () => {
      unsubUpdate();
      unsubDelete();
    };
  }, [editingId]);

  const addGoal = () => {
    if (!newGoalText.trim() || !newGoalTitle.trim()) return;
    const g: Goal = { 
      id: Date.now().toString(), 
      title: newGoalTitle, 
      text: newGoalText, 
      created: Date.now() 
    };
    
    // Update local and broadcast
    setGoals(prev => [g, ...prev]);
    wsService.send(SocketEvents.AGENT_UPDATE, { goal: g });

    setNewGoalTitle('');
    setNewGoalText('');
    setSelectedTemplateId('');
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    wsService.send(SocketEvents.AGENT_DELETE, { id });
  };

  const executePlan = async (id: string, text: string) => {
    setLoadingId(id);
    try {
      const plan = await runAgenticPlan(text);
      setGoals(prev => {
        const updated = prev.map(g => {
          if (g.id === id) {
            const newGoal = { ...g, plan };
            wsService.send(SocketEvents.AGENT_UPDATE, { goal: newGoal });
            return newGoal;
          }
          return g;
        });
        return updated;
      });
    } catch (e) {
      console.error(e);
      alert("Failed to generate plan");
    } finally {
      setLoadingId(null);
    }
  };

  const startEditing = (goal: Goal) => {
    if (!goal.plan) return;
    setEditingId(goal.id);
    setEditText(goal.plan);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditText('');
  };

  const savePlan = (goal: Goal) => {
    const updatedGoal = { ...goal, plan: editText };
    setGoals(prev => prev.map(g => g.id === goal.id ? updatedGoal : g));
    wsService.send(SocketEvents.AGENT_UPDATE, { goal: updatedGoal });
    setEditingId(null);
    setEditText('');
  };

  // Template Management
  const handleSaveTemplate = () => {
    if (!newGoalTitle && !newGoalText) return;
    const name = prompt("Enter a name for this template:", newGoalTitle || "New Template");
    if (!name) return;

    const newTemplate: AgentTemplate = {
      id: Date.now().toString(),
      name,
      title: newGoalTitle,
      text: newGoalText
    };
    setTemplates(prev => [...prev, newTemplate]);
    setSelectedTemplateId(newTemplate.id);
  };

  const handleUpdateTemplate = () => {
    if (!selectedTemplateId) return;
    setTemplates(prev => prev.map(t => 
      t.id === selectedTemplateId 
        ? { ...t, title: newGoalTitle, text: newGoalText } 
        : t
    ));
    alert("Template updated successfully.");
  };

  const handleRenameTemplate = () => {
    if (!selectedTemplateId) return;
    const tmpl = templates.find(t => t.id === selectedTemplateId);
    const name = prompt("Rename template:", tmpl?.name);
    if (name && name.trim()) {
      setTemplates(prev => prev.map(t => 
        t.id === selectedTemplateId ? { ...t, name: name.trim() } : t
      ));
    }
  };

  const handleLoadTemplate = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedTemplateId(id);
    if (!id) {
       setNewGoalTitle('');
       setNewGoalText('');
       return;
    }

    const tmpl = templates.find(t => t.id === id);
    if (tmpl) {
      setNewGoalTitle(tmpl.title);
      setNewGoalText(tmpl.text);
    }
  };

  const handleDeleteTemplate = (e: React.MouseEvent) => {
    if (!selectedTemplateId) return;
    if (confirm("Delete this template?")) {
       setTemplates(prev => prev.filter(t => t.id !== selectedTemplateId));
       setSelectedTemplateId('');
       setNewGoalTitle('');
       setNewGoalText('');
    }
  };

  return (
    // Main Container: 
    // - Mobile: Stacked, overflow-y-auto on parent (App.tsx is h-full hidden, so we need auto here)
    // - Desktop: Side-by-side, container hidden, internal panes scroll
    <div className="h-full w-full flex flex-col lg:flex-row gap-6 p-6 overflow-y-auto lg:overflow-hidden">
      
      {/* Creation Panel */}
      <div className="flex-none lg:w-1/3 lg:h-full lg:overflow-y-auto custom-scrollbar">
        <div className="bg-white/50 dark:bg-black/20 p-6 rounded-2xl border border-white/20 shadow-sm backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            {ICONS.planner} New Mission
          </h2>
          
          <div className="space-y-4">
            {/* Templates Section */}
            <div className="bg-white/40 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
               <div className="flex justify-between items-center">
                 <label className="text-xs font-semibold uppercase tracking-wider opacity-60">Template Library</label>
               </div>
               
               <select 
                 value={selectedTemplateId}
                 onChange={handleLoadTemplate}
                 className="w-full p-2 rounded-lg bg-white/50 dark:bg-black/40 border border-gray-200 dark:border-gray-700 outline-none text-sm"
               >
                 <option value="">-- Select or Create New --</option>
                 {templates.map(t => (
                   <option key={t.id} value={t.id}>{t.name}</option>
                 ))}
               </select>

               {selectedTemplateId && (
                 <div className="flex gap-2">
                   <button 
                     onClick={handleUpdateTemplate}
                     className="flex-1 px-2 py-1.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                   >
                     Update Content
                   </button>
                   <button 
                     onClick={handleRenameTemplate}
                     className="px-2 py-1.5 text-xs font-medium bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                   >
                     Rename
                   </button>
                   <button 
                     onClick={handleDeleteTemplate}
                     className="px-2 py-1.5 text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                   >
                     Delete
                   </button>
                 </div>
               )}
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider opacity-60 ml-1">Goal Title</label>
              <input 
                value={newGoalTitle}
                onChange={e => setNewGoalTitle(e.target.value)}
                placeholder="e.g., Q4 Marketing Strategy"
                className="w-full mt-1 p-3 rounded-xl bg-white/50 dark:bg-black/40 border border-gray-200 dark:border-gray-700 outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider opacity-60 ml-1">Description & Context</label>
              <textarea 
                value={newGoalText}
                onChange={e => setNewGoalText(e.target.value)}
                placeholder="Describe the objective, constraints, and desired outcome..."
                className="w-full mt-1 p-3 rounded-xl bg-white/50 dark:bg-black/40 border border-gray-200 dark:border-gray-700 outline-none focus:border-purple-500 transition-colors min-h-[150px] resize-none"
              />
            </div>
            
            <div className="flex flex-col gap-2 pt-2">
              <button 
                onClick={addGoal}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-purple-500/20 hover:scale-[1.02] transition-transform"
              >
                Create Agent Mission
              </button>
              
              {!selectedTemplateId && (
                <button 
                  onClick={handleSaveTemplate}
                  disabled={!newGoalTitle && !newGoalText}
                  className="w-full py-2 text-sm text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg transition-colors disabled:opacity-50"
                >
                  Save as New Template
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* List Panel */}
      <div className="flex-1 lg:h-full lg:overflow-y-auto custom-scrollbar space-y-4 pr-1">
        {goals.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center opacity-50 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl">
            <div className="text-4xl mb-2">🗺️</div>
            <div>No active missions. Start planning!</div>
          </div>
        ) : (
          goals.map(goal => (
            <div key={goal.id} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{goal.title}</h3>
                  <div className="text-xs text-gray-500">{new Date(goal.created).toLocaleDateString()}</div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => deleteGoal(goal.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    {ICONS.trash}
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 bg-gray-50 dark:bg-black/20 p-3 rounded-lg">
                {goal.text}
              </p>

              {goal.plan ? (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                      {ICONS.check} Generated Strategic Plan
                    </div>
                    {editingId !== goal.id && (
                      <button 
                        onClick={() => startEditing(goal)} 
                        className="text-xs font-medium text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors underline decoration-dotted"
                      >
                        Edit Plan
                      </button>
                    )}
                  </div>

                  {editingId === goal.id ? (
                    <div className="space-y-3 animate-fade-in">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full p-4 rounded-xl bg-gray-50 dark:bg-black/40 border border-purple-300 dark:border-purple-800/50 outline-none focus:ring-2 focus:ring-purple-500/50 min-h-[300px] font-mono text-sm leading-relaxed resize-y shadow-inner"
                        placeholder="Edit the plan..."
                      />
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={cancelEditing} 
                          className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => savePlan(goal)} 
                          className="px-4 py-2 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-md shadow-purple-500/20"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                      {goal.plan}
                    </div>
                  )}
                </div>
              ) : (
                <button 
                  onClick={() => executePlan(goal.id, goal.text)}
                  disabled={loadingId === goal.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-black font-medium text-sm hover:opacity-90 disabled:opacity-50"
                >
                  {loadingId === goal.id ? (
                    <>{ICONS.loading} Thinking...</>
                  ) : (
                    <>Run Agent Planner</>
                  )}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AgenticPlanner;