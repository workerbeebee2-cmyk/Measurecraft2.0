/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import ImageCanvas from './components/ImageCanvas';
import Sidebar from './components/Sidebar';
import { LineData, LineType } from './types';
import { analyzeImageMeasurements } from './services/geminiService';
import { Upload, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [lines, setLines] = useState<LineData[]>([]);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisSummary, setAnalysisSummary] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setLines([]);
        setAnalysisSummary(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const addLine = () => {
    const isFirst = lines.length === 0;
    const newLine: LineData = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Line ${lines.length + 1}`,
      category: 'Other',
      color: isFirst ? '#22c55e' : getRandomColor(),
      type: isFirst ? LineType.REFERENCE : LineType.TARGET,
      coords: { x1: 100, y1: 100, x2: 300, y2: 100 },
    };
    setLines([...lines, newLine]);
    setActiveLineId(newLine.id);
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
      setError("Please set a Green Reference line with a known physical length.");
      return;
    }

    if (!image) return;

    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeImageMeasurements(image, lines);
      
      const updatedLines = lines.map(line => {
        const lineResult = result.lines.find((r: any) => r.id === line.id);
        if (lineResult) {
          return { ...line, calculatedLength: lineResult.calculatedLength };
        }
        return line;
      });

      setLines(updatedLines);
      setAnalysisSummary(result.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 font-sans antialiased text-zinc-100 overflow-hidden">
      <div className="flex-1 flex flex-col relative">
        <header className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg hover:border-zinc-700 transition-colors">
              <Upload size={18} className="text-blue-500" />
              <span className="text-sm font-medium">Upload Image</span>
              <input type="file" onChange={handleFileUpload} className="hidden" accept="image/*" />
            </label>
            {image && (
              <button 
                onClick={() => setImage(null)}
                className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                title="Clear image"
              >
                <X size={18} />
              </button>
            )}
          </div>
          
          <div className="text-xs font-mono text-zinc-600 uppercase tracking-widest hidden md:block">
            Gemini-Powered Spatial Analysis
          </div>
        </header>

        <main className="flex-1 p-6 overflow-hidden flex flex-col">
          <ImageCanvas
            image={image || ''}
            lines={lines}
            onLinesChange={setLines}
            activeLineId={activeLineId}
            onSelectLine={setActiveLineId}
          />
          
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-4 p-4 rounded-xl bg-red-950/30 border border-red-500/50 text-red-200 flex items-center gap-3 backdrop-blur-sm"
              >
                <AlertCircle size={20} />
                <span className="text-sm font-medium">{error}</span>
              </motion.div>
            )}
            
            {analysisSummary && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-xl bg-green-950/30 border border-green-500/50 text-green-200 flex flex-col gap-2 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={20} />
                  <span className="text-sm font-bold uppercase tracking-wider">Analysis Complete</span>
                </div>
                <p className="text-sm text-green-100/80 leading-relaxed font-medium">
                  {analysisSummary}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <Sidebar
        lines={lines}
        onAddLine={addLine}
        onDeleteLine={deleteLine}
        onUpdateLine={updateLine}
        onAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
        activeLineId={activeLineId}
        onSelectLine={setActiveLineId}
      />
    </div>
  );
}

function getRandomColor() {
  const colors = ['#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f43f5e'];
  return colors[Math.floor(Math.random() * colors.length)];
}
