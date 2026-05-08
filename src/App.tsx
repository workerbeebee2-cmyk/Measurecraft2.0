/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import ImageCanvas from './components/ImageCanvas';
import Sidebar from './components/Sidebar';
import { LineData, LineType, AnalysisResult } from './types';
import { analyzeNeuralSpatial } from './services/spatialEngine';
import { Upload, X, AlertCircle, CheckCircle2, Zap, LayoutGrid, Terminal, Menu, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

const ANALYSIS_STEPS = [
  "Initializing Projective Neural Mesh...",
  "Calibrating Scale Vectors...",
  "Computing Z-Depth Fore-shortening...",
  "Applying Parallax Neural Logic...",
  "Normalizing Perspective Matrix...",
  "Finalizing Neural Geometry Computation..."
];

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [lines, setLines] = useState<LineData[]>([]);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'draw' | 'results'>('draw');
  const [analysisLog, setAnalysisLog] = useState<string[]>([]);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setLines([]);
        setAnalysisResult(null);
        setError(null);
        setAnalysisLog([]);
        setActiveTab('draw');
      };
      reader.readAsDataURL(file);
    }
  };

  const addLine = () => {
    setIsDrawingMode(true);
    setError(null);
  };

  const handleFinishDrawing = (coords: { x1: number; y1: number; x2: number; y2: number }) => {
    const isFirst = lines.length === 0;
    const newLine: LineData = {
      id: Math.random().toString(36).substr(2, 9),
      name: isFirst ? 'REF SCALE' : `MEASURE ${lines.length + 1}`,
      category: isFirst ? 'Other' : 'Length',
      color: isFirst ? '#22c55e' : getRandomColor(),
      type: isFirst ? LineType.REFERENCE : LineType.TARGET,
      coords,
    };
    setLines([...lines, newLine]);
    setActiveLineId(newLine.id);
    setIsDrawingMode(false);
  };

  const deleteLine = (id: string) => {
    setLines(lines.filter(l => l.id !== id));
    if (activeLineId === id) setActiveLineId(null);
  };

  const updateLine = (id: string, updates: Partial<LineData>) => {
    setLines(lines.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const handleAnalyze = async () => {
    const referenceLine = lines.find(l => l.type === LineType.REFERENCE);
    if (!referenceLine || !referenceLine.realLength) {
      setError("CALIBRATION ERROR: Reference scale is required.");
      return;
    }

    if (!image) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysisLog([]);
    setActiveTab('results');

    // Simulate analysis steps visually
    for (const step of ANALYSIS_STEPS) {
       setAnalysisLog(prev => [...prev, `[CORE] ${step}`]);
       await new Promise(r => setTimeout(r, 400));
    }

    try {
      const result = await analyzeNeuralSpatial(lines);
      
      const updatedLines = lines.map(line => {
        const lineResult = result.lines.find((r: any) => r.id === line.id);
        if (lineResult) {
          return { 
            ...line, 
            calculatedLength: lineResult.calculatedLength,
            confidence: lineResult.confidence,
            reasoning: lineResult.reasoning
          };
        }
        return line;
      });

      setLines(updatedLines);
      setAnalysisResult(result);
      setAnalysisLog(prev => [...prev, `[SUCCESS] ${result.summary}`]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setAnalysisLog(prev => [...prev, `[FATAL] ${err instanceof Error ? err.message : "Unknown error"}`]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-zinc-950 font-sans antialiased text-zinc-100 overflow-hidden relative">
      <div className="flex-1 flex flex-col relative h-full">
        <header className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setIsSidebarVisible(true)}
              className="md:hidden p-2 text-zinc-400 hover:text-white"
            >
              <Menu size={20} />
            </button>
            <label className="flex items-center gap-2 cursor-pointer bg-zinc-900 border border-zinc-800 px-3 md:px-4 py-2 rounded-lg hover:border-zinc-700 transition-colors group">
              <Upload size={16} className="text-blue-500 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] md:text-[11px] uppercase font-bold tracking-wider">Load Data</span>
              <input type="file" onChange={handleFileUpload} className="hidden" accept="image/*" />
            </label>
            {image && (
              <button 
                onClick={() => setImage(null)}
                className="p-2 text-zinc-700 hover:text-red-500 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-6">
             <div className="flex flex-col items-end">
                <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-0.5">Neural Status</div>
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)] animate-pulse" />
                   <span className="text-[10px] font-mono text-zinc-400">GEOMETRY-V2 READY</span>
                </div>
             </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-hidden flex flex-col min-h-0">
          <AnimatePresence mode="wait">
            {activeTab === 'draw' ? (
              <motion.div 
                key="draw"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="flex-1 min-h-0"
              >
                <ImageCanvas
                  image={image || ''}
                  lines={lines}
                  onLinesChange={setLines}
                  activeLineId={activeLineId}
                  onSelectLine={setActiveLineId}
                  isDrawingMode={isDrawingMode}
                  onFinishDrawing={handleFinishDrawing}
                  onCancelDrawing={() => setIsDrawingMode(false)}
                />
              </motion.div>
            ) : (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 overflow-y-auto space-y-6 pr-2"
              >
                {/* Analysis Log */}
                <div className="bg-black border border-zinc-800 p-4 rounded-xl font-mono">
                  <div className="flex items-center gap-2 mb-4 border-b border-zinc-800 pb-2">
                     <Terminal size={14} className="text-green-500" />
                     <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Real-time Analysis Sequence</span>
                  </div>
                  <div className="space-y-1.5 h-32 overflow-y-auto scrollbar-hide">
                    {analysisLog.map((log, i) => (
                      <div key={i} className="text-[10px] flex gap-3">
                        <span className="text-zinc-700">[{i.toString().padStart(2, '0')}]</span>
                        <span className={cn(
                          log.includes('[SUCCESS]') ? "text-green-500" : 
                          log.includes('[FATAL]') ? "text-red-500" : "text-zinc-500"
                        )}>{log}</span>
                      </div>
                    ))}
                    {isAnalyzing && (
                      <div className="text-[10px] text-green-500 animate-pulse">
                        [PROCESS] Working... _
                      </div>
                    )}
                  </div>
                </div>

                {/* Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lines.filter(l => l.type === LineType.TARGET).map(line => (
                    <motion.div 
                      key={line.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl flex flex-col group overflow-hidden relative"
                    >
                      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                         <LayoutGrid size={48} />
                      </div>
                      <div className="flex items-center gap-2 mb-4">
                         <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: line.color }} />
                         <div>
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{line.category}</div>
                            <div className="text-sm font-bold uppercase">{line.name}</div>
                         </div>
                         <div className="ml-auto text-right">
                            <div className={cn(
                              "text-xs font-bold",
                              line.confidence && line.confidence > 90 ? "text-green-500" : "text-amber-500"
                            )}>
                              {line.confidence ? `${line.confidence.toFixed(1)}%` : '---'}
                            </div>
                            <div className="text-[8px] text-zinc-600 uppercase tracking-widest">Confidence</div>
                         </div>
                      </div>

                      <div className="flex items-baseline gap-2 mb-4">
                         <span className="text-4xl font-black text-white font-mono tracking-tighter">
                           {line.calculatedLength?.toFixed(3) || '---'}
                         </span>
                         <span className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Units</span>
                      </div>

                      <div className="text-[10px] text-zinc-400 bg-black/40 p-3 rounded-lg border border-white/5 italic">
                         <Zap size={10} className="inline mr-2 text-amber-500" />
                         {line.reasoning || "Pending analysis update..."}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {analysisResult && (
                  <div className="bg-green-600/10 border border-green-500/20 p-6 rounded-2xl flex flex-col gap-3">
                     <div className="flex items-center gap-2 text-green-500">
                        <CheckCircle2 size={20} />
                        <span className="text-sm font-black uppercase tracking-[0.2em]">Summary Analysis</span>
                     </div>
                     <p className="text-sm text-green-100/90 leading-relaxed font-medium">
                        {analysisResult.summary}
                     </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-4 p-4 rounded-xl bg-red-950/30 border border-red-500/50 text-red-200 flex items-center gap-3 backdrop-blur-sm"
              >
                <AlertCircle size={20} />
                <span className="text-xs font-bold uppercase tracking-wider">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Sidebar with Mobile Support */}
      <div className={cn(
        "fixed inset-0 z-50 md:relative md:inset-auto md:z-auto transition-transform duration-300 ease-in-out transform",
        isSidebarVisible ? "translate-x-0" : "translate-x-full md:translate-x-0"
      )}>
        {/* Mobile Overlay */}
        <div 
          className={cn(
            "absolute inset-0 bg-black/60 md:hidden transition-opacity duration-300",
            isSidebarVisible ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => setIsSidebarVisible(false)}
        />
        
        <div className="relative h-full flex flex-row-reverse md:flex-row">
          <Sidebar
            lines={lines}
            onAddLine={addLine}
            onDeleteLine={deleteLine}
            onUpdateLine={updateLine}
            onAnalyze={() => {
              handleAnalyze();
              if (window.innerWidth < 768) setIsSidebarVisible(false);
            }}
            isAnalyzing={isAnalyzing}
            activeLineId={activeLineId}
            onSelectLine={(id) => {
              setActiveLineId(id);
              if (id && window.innerWidth < 768) setIsSidebarVisible(false);
            }}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onClose={() => setIsSidebarVisible(false)}
            isDrawingMode={isDrawingMode}
          />
        </div>
      </div>
    </div>
  );
}

function getRandomColor() {
  const colors = ['#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f43f5e'];
  return colors[Math.floor(Math.random() * colors.length)];
}
