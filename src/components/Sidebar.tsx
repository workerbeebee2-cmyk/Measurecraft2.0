import { useState } from 'react';
import { LineData, LineType } from '../types';
import { cn } from '../lib/utils';
import { Trash2, Ruler, Plus, Send, Info, Target } from 'lucide-react';
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
}

export default function Sidebar({
  lines,
  onAddLine,
  onDeleteLine,
  onUpdateLine,
  onAnalyze,
  isAnalyzing,
  activeLineId,
  onSelectLine
}: SidebarProps) {
  const lineCategories = [
    'Height',
    'Length',
    'Width',
    'Span',
    'Diagonals',
    'Interior',
    'Cockpit',
    'Landing Gear',
    'Other'
  ];

  return (
    <div className="w-96 h-screen bg-zinc-950 border-l border-zinc-800 flex flex-col overflow-hidden">
      <div className="p-6 border-bottom border-zinc-800">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Ruler className="text-green-500" />
          AeroMeasure Tool
        </h2>
        <p className="text-zinc-500 text-sm mt-1">Draw lines and analyze dimensions</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <button
          onClick={onAddLine}
          className="w-full py-3 px-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-300 flex items-center justify-center gap-2 transition-all group font-medium"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform" />
          Add Measurement Line
        </button>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {lines.map((line) => (
              <motion.div
                key={line.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "p-4 rounded-xl border transition-all cursor-pointer",
                  activeLineId === line.id 
                    ? "bg-zinc-900 border-zinc-600 ring-1 ring-zinc-700" 
                    : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                )}
                onClick={() => onSelectLine(line.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: line.color }} />
                    <input
                      type="text"
                      value={line.name}
                      onChange={(e) => onUpdateLine(line.id, { name: e.target.value })}
                      className="bg-transparent border-none p-0 text-sm font-medium text-white focus:ring-0 w-32"
                    />
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteLine(line.id); }}
                    className="text-zinc-600 hover:text-red-500 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <select
                    value={line.category}
                    onChange={(e) => onUpdateLine(line.id, { category: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 text-[10px] uppercase tracking-wider rounded-lg text-white p-2"
                  >
                    {lineCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  
                  <select
                    value={line.type}
                    onChange={(e) => onUpdateLine(line.id, { type: e.target.value as LineType })}
                    className="bg-zinc-900 border-zinc-800 text-[10px] uppercase tracking-wider rounded-lg text-white p-2"
                  >
                    <option value={LineType.TARGET}>Target</option>
                    <option value={LineType.REFERENCE}>Reference</option>
                  </select>
                </div>
                
                <div className="flex gap-2">
                  {line.type === LineType.REFERENCE ? (
                    <input
                      type="number"
                      placeholder="Known (m/ft)"
                      value={line.realLength || ''}
                      onChange={(e) => onUpdateLine(line.id, { realLength: parseFloat(e.target.value) })}
                      className="flex-1 bg-zinc-900 border-zinc-800 text-xs rounded-lg text-white p-2 focus:border-green-500 outline-none"
                    />
                  ) : (
                    <div className="flex-1 bg-zinc-900 border-zinc-800 text-xs rounded-lg text-zinc-400 p-2 flex items-center font-mono">
                      {line.calculatedLength ? `${line.calculatedLength.toFixed(3)}` : '---'}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="p-6 border-t border-zinc-800 bg-zinc-950">
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing || lines.length < 2}
          className={cn(
            "w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg",
            isAnalyzing 
              ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
              : "bg-green-600 hover:bg-green-500 text-white hover:scale-[1.02] active:scale-[0.98]"
          )}
        >
          {isAnalyzing ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Target size={20} />
              </motion.div>
              Analyzing Geometry...
            </>
          ) : (
            <>
              <Send size={20} />
              Run Full AI Analysis
            </>
          )}
        </button>
        
        <div className="mt-4 flex items-start gap-2 text-xs text-zinc-500 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
          <Info size={14} className="mt-0.5 shrink-0" />
          <p>
            Place the <b>Green Reference Line</b> across a known measurement.
            AI will calculate others using perspective and depth tools.
          </p>
        </div>
      </div>
    </div>
  );
}
