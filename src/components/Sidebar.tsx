import React from 'react';
import { LineData, LineType } from '../types';
import { cn } from '../lib/utils';
import { Trash2, Ruler, Plus, Send, Info, Target, ChevronRight, X, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  lines: LineData[];
  onAddLine: () => void;
  onDeleteLine: (id: string) => void;
  onUpdateLine: (id: string, updates: Partial<LineData>) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  activeLineId: string | null;
  onSelectLine: (id: string | null) => void;
  activeTab: 'draw' | 'results';
  setActiveTab: (tab: 'draw' | 'results') => void;
  onClose?: () => void;
  isDrawingMode?: boolean;
}

export default function Sidebar({
  lines,
  onAddLine,
  onDeleteLine,
  onUpdateLine,
  onAnalyze,
  isAnalyzing,
  activeLineId,
  onSelectLine,
  activeTab,
  setActiveTab,
  onClose,
  isDrawingMode
}: SidebarProps) {
  const lineCategories = [
    'Height', 'Length', 'Width', 'Span', 'Diagonals', 'Interior', 'Cockpit', 'Landing Gear', 'Other'
  ];

  return (
    <div className="w-full md:w-96 h-full md:h-screen bg-zinc-950 border-l border-zinc-800 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-zinc-800 bg-zinc-900/10">
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <button onClick={onClose} className="p-2 -ml-2 text-zinc-500 hover:text-white">
              <X size={20} />
            </button>
          </div>
          <div className="w-9 h-9 bg-linear-to-br from-green-500 to-cyan-500 rounded-lg flex items-center justify-center text-zinc-950 shrink-0">
            <Ruler size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-green-500 tracking-[0.2em] uppercase">MEASURAI</h2>
            <p className="text-[9px] text-zinc-500 tracking-[0.3em] uppercase">Equipment Precision System</p>
          </div>
          <div className="ml-auto flex gap-1">
             <button 
               onClick={() => setActiveTab('draw')}
               className={cn(
                 "p-1.5 rounded text-[10px] uppercase font-bold",
                 activeTab === 'draw' ? "bg-green-500/10 text-green-500" : "text-zinc-600"
               )}
             >DRAW</button>
             <button 
               onClick={() => setActiveTab('results')}
               className={cn(
                 "p-1.5 rounded text-[10px] uppercase font-bold",
                 activeTab === 'results' ? "bg-green-500/10 text-green-500" : "text-zinc-600"
               )}
             >RESULTS</button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Step 01: Image already handled in header but we can put status here */}
        <section>
          <div className="text-[10px] text-green-500 font-bold tracking-[0.3em] uppercase mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            01 / Tool Calibration
          </div>
          <div className="space-y-4">
            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
              <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-2">Known Reference Value</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="e.g. 4.5"
                  className="flex-1 bg-zinc-900 border-zinc-800 text-lg rounded-lg text-green-500 p-3 outline-none focus:border-green-500/50 transition-colors font-mono"
                  onChange={(e) => {
                    const refLine = lines.find(l => l.type === LineType.REFERENCE);
                    if (refLine) onUpdateLine(refLine.id, { realLength: parseFloat(e.target.value) });
                  }}
                  value={lines.find(l => l.type === LineType.REFERENCE)?.realLength || ''}
                />
                <select className="bg-zinc-900 border-zinc-800 text-xs rounded-lg text-zinc-400 p-3 italic">
                  <option>Meters (m)</option>
                  <option>Feet (ft)</option>
                  <option>Inches (in)</option>
                </select>
              </div>
              <p className="text-[9px] text-zinc-600 mt-2 italic">Assign this value to the green reference line in step 03.</p>
            </div>
          </div>
        </section>

        {/* Step 02: Line Categories */}
        <section>
          <div className="text-[10px] text-zinc-500 font-bold tracking-[0.3em] uppercase mb-4">
            02 / Selection
          </div>
          <button
            onClick={onAddLine}
            disabled={isDrawingMode}
            className={cn(
              "w-full py-4 rounded-xl border transition-all group font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3",
              isDrawingMode 
                ? "bg-green-500/10 border-green-500/50 text-green-500" 
                : "bg-zinc-900 border-zinc-800 hover:border-green-500/30 text-zinc-400 hover:text-green-500"
            )}
          >
            {isDrawingMode ? (
              <>
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                   <div className="w-2 h-2 rounded-full bg-green-500" />
                </motion.div>
                Drawing Mode Active...
              </>
            ) : (
              <>
                <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                Create Measurement
              </>
            )}
          </button>
        </section>

        {/* Step 03: Active Lines */}
        <section>
          <div className="text-[10px] text-zinc-500 font-bold tracking-[0.3em] uppercase mb-4 flex justify-between items-center">
            <span>03 / Active Dataset ({lines.length})</span>
          </div>
          
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {lines.map((line) => (
                <motion.div
                  key={line.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={cn(
                    "p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group",
                    activeLineId === line.id 
                      ? "bg-zinc-900 border-zinc-700 ring-1 ring-zinc-700 shadow-xl" 
                      : "bg-zinc-950/40 border-zinc-800 hover:border-zinc-700"
                  )}
                  onClick={() => onSelectLine(line.id)}
                >
                  <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: line.color }} />
                  
                  <div className="flex items-center justify-between mb-3 pl-2">
                    <input
                      type="text"
                      value={line.name}
                      onChange={(e) => onUpdateLine(line.id, { name: e.target.value })}
                      className="bg-transparent border-none p-0 text-xs font-bold text-white focus:ring-0 uppercase tracking-tighter"
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteLine(line.id); }}
                      className="text-zinc-700 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pl-2">
                     <select
                        value={line.category}
                        onChange={(e) => onUpdateLine(line.id, { category: e.target.value })}
                        className="bg-zinc-900/50 border-zinc-800 text-[9px] uppercase tracking-wider rounded-lg text-zinc-400 p-2"
                      >
                        {lineCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                      <select
                        value={line.type}
                        onChange={(e) => onUpdateLine(line.id, { type: e.target.value as LineType })}
                        className="bg-zinc-900/50 border-zinc-800 text-[9px] uppercase tracking-wider rounded-lg text-zinc-500 p-2 font-bold"
                      >
                        <option value={LineType.TARGET}>TARGET</option>
                        <option value={LineType.REFERENCE}>REFERENCE</option>
                      </select>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </div>

      <div className="p-6 border-t border-zinc-800 bg-zinc-950">
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing || lines.length < 2}
          className={cn(
            "w-full py-5 rounded-xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl",
            isAnalyzing 
              ? "bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800" 
              : "bg-linear-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-zinc-950 shadow-green-500/20 active:scale-[0.98]"
          )}
        >
          {isAnalyzing ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Cpu size={18} />
              </motion.div>
              Running Neural Engine
            </>
          ) : (
            <>
              <Send size={18} />
              Compute Neural Data
            </>
          )}
        </button>
      </div>
    </div>
  );
}
