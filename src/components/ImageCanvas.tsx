import { useEffect, useRef } from 'react';
import { Canvas, FabricImage, Line, FabricText, Point, util } from 'fabric';
import { LineData, LineType } from '../types';

interface ImageCanvasProps {
  image: string;
  lines: LineData[];
  onLinesChange: (lines: LineData[]) => void;
  activeLineId: string | null;
  onSelectLine: (id: string | null) => void;
  isDrawingMode?: boolean;
  onFinishDrawing?: (coords: { x1: number; y1: number; x2: number; y2: number }) => void;
  onCancelDrawing?: () => void;
}

export default function ImageCanvas({ 
  image, 
  lines, 
  onLinesChange, 
  activeLineId, 
  onSelectLine,
  isDrawingMode,
  onFinishDrawing,
  onCancelDrawing
}: ImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvas = useRef<Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<LineData[]>(lines);
  const isDrawingModeRef = useRef(isDrawingMode);
  const isDrawingInternal = useRef(false);
  const tempLine = useRef<Line | null>(null);

  // Sync refs
  useEffect(() => { linesRef.current = lines; }, [lines]);
  useEffect(() => { isDrawingModeRef.current = isDrawingMode; }, [isDrawingMode]);

  // Image loading logic
  const loadImage = async () => {
    if (!fabricCanvas.current || !image) return;
    const canvas = fabricCanvas.current;

    try {
      const img = await FabricImage.fromURL(image);
      canvas.clear();
      
      const containerWidth = containerRef.current?.clientWidth || 800;
      const containerHeight = containerRef.current?.clientHeight || 600;
      const scale = Math.min(containerWidth / img.width!, containerHeight / img.height!);
      
      img.set({ selectable: false, evented: false, scaleX: scale, scaleY: scale });
      canvas.setDimensions({ width: img.width! * scale, height: img.height! * scale });
      canvas.add(img);
      canvas.centerObject(img);
      canvas.renderAll();
      syncLinesToCanvas();
    } catch (err) {
      console.error("Failed to load image:", err);
    }
  };

  const syncLinesToCanvas = () => {
    if (!fabricCanvas.current) return;
    const canvas = fabricCanvas.current;
    
    // Clear only line/text objects
    canvas.getObjects().forEach(obj => {
      if (obj instanceof Line || obj instanceof FabricText) canvas.remove(obj);
    });

    linesRef.current.forEach(line => {
      const x1 = line.coords.x1 * canvas.width!;
      const y1 = line.coords.y1 * canvas.height!;
      const x2 = line.coords.x2 * canvas.width!;
      const y2 = line.coords.y2 * canvas.height!;

      const fabricLine = new Line([x1, y1, x2, y2], {
        stroke: line.color,
        strokeWidth: activeLineId === line.id ? 4 : 2,
        selectable: !isDrawingModeRef.current,
        evented: !isDrawingModeRef.current,
        hasControls: true,
        hasBorders: true,
        transparentCorners: false,
        cornerColor: 'white',
        cornerStrokeColor: line.color,
        cornerSize: 8,
        data: { id: line.id },
        strokeUniform: true
      });

      const text = new FabricText(line.name, {
        left: (x1 + x2) / 2,
        top: (y1 + y2) / 2 - 20,
        fontSize: 14,
        fill: line.color,
        backgroundColor: 'rgba(0,0,0,0.5)',
        selectable: false,
        evented: false
      });

      canvas.add(fabricLine);
      canvas.add(text);
      if (activeLineId === line.id) canvas.setActiveObject(fabricLine);
    });
    canvas.renderAll();
  };

  // Initialize Canvas
  useEffect(() => {
    if (!canvasRef.current || fabricCanvas.current) return;

    fabricCanvas.current = new Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#0a0a0a',
      preserveObjectStacking: true
    });

    const canvas = fabricCanvas.current;

    canvas.on('mouse:down', (options) => {
      if (isDrawingModeRef.current && !isDrawingInternal.current) {
        const pointer = canvas.getPointer(options.e);
        isDrawingInternal.current = true;
        const coords: [number, number, number, number] = [pointer.x, pointer.y, pointer.x, pointer.y];
        tempLine.current = new Line(coords, {
          stroke: linesRef.current.length === 0 ? '#22c55e' : '#3b82f6',
          strokeWidth: 2,
          selectable: false,
          evented: false,
          strokeUniform: true
        });
        canvas.add(tempLine.current);
      }
    });

    canvas.on('mouse:move', (options) => {
      if (isDrawingInternal.current && tempLine.current) {
        const pointer = canvas.getPointer(options.e);
        tempLine.current.set({ x2: pointer.x, y2: pointer.y });
        canvas.renderAll();
      }
    });

    canvas.on('mouse:up', () => {
      if (isDrawingInternal.current && tempLine.current) {
        const line = tempLine.current;
        const coords = { 
          x1: line.x1! / canvas.width!, 
          y1: line.y1! / canvas.height!, 
          x2: line.x2! / canvas.width!, 
          y2: line.y2! / canvas.height! 
        };
        const length = Math.hypot(line.x2! - line.x1!, line.y2! - line.y1!);
        if (length > 5) onFinishDrawing?.(coords);
        else onCancelDrawing?.();
        canvas.remove(line);
        tempLine.current = null;
        isDrawingInternal.current = false;
      }
    });

    canvas.on('selection:created', (e) => {
      const activeObject = e.selected?.[0] as any;
      if (activeObject?.data?.id) onSelectLine(activeObject.data.id);
    });

    canvas.on('selection:updated', (e) => {
      const activeObject = e.selected?.[0] as any;
      if (activeObject?.data?.id) onSelectLine(activeObject.data.id);
    });

    canvas.on('selection:cleared', () => {
      if (!isDrawingInternal.current) onSelectLine(null);
    });

    canvas.on('object:modified', (e) => {
      const obj = e.target;
      if (obj && obj instanceof Line && (obj as any).data?.id) {
        const lineId = (obj as any).data.id;
        const matrix = obj.calcTransformMatrix();
        const p1 = util.transformPoint(new Point(obj.x1!, obj.y1!), matrix);
        const p2 = util.transformPoint(new Point(obj.x2!, obj.y2!), matrix);
        onLinesChange(linesRef.current.map(l => l.id === lineId ? { 
          ...l, 
          coords: { 
            x1: p1.x / canvas.width!, 
            y1: p1.y / canvas.height!, 
            x2: p2.x / canvas.width!, 
            y2: p2.y / canvas.height! 
          } 
        } : l));
      }
    });

    return () => { canvas.dispose(); fabricCanvas.current = null; };
  }, []);

  // Update canvas state when mode changes
  useEffect(() => {
    if (!fabricCanvas.current) return;
    const canvas = fabricCanvas.current;
    canvas.selection = !isDrawingMode;
    canvas.defaultCursor = isDrawingMode ? 'crosshair' : 'default';
    canvas.getObjects().forEach(obj => {
      if (obj instanceof Line) {
        obj.selectable = !isDrawingMode;
        obj.evented = !isDrawingMode;
      }
    });
    canvas.renderAll();
  }, [isDrawingMode]);

  // Update image and resize
  useEffect(() => { if (image) loadImage(); }, [image]);
  useEffect(() => { syncLinesToCanvas(); }, [lines, activeLineId]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => { if (image) loadImage(); });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [image]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] md:min-h-[600px] flex items-center justify-center bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 shadow-2xl relative">
      <canvas ref={canvasRef} id="measurement-canvas" />
      {!image && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 gap-4">
          <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800">
             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="90" cy="90" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
          </div>
          <p className="font-medium">Upload an image to start measuring</p>
        </div>
      )}
    </div>
  );
}
