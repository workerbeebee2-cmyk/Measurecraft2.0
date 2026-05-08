import { useEffect, useRef } from 'react';
import { Canvas, FabricImage, Line, FabricText, Point, util } from 'fabric';
import { LineData, LineType } from '../types';

interface ImageCanvasProps {
  image: string;
  lines: LineData[];
  onLinesChange: (lines: LineData[]) => void;
  activeLineId: string | null;
  onSelectLine: (id: string | null) => void;
}

export default function ImageCanvas({ image, lines, onLinesChange, activeLineId, onSelectLine }: ImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvas = useRef<Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    fabricCanvas.current = new Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#1a1a1a',
    });

    const canvas = fabricCanvas.current;

    canvas.on('selection:created', (e) => {
      const activeObject = e.selected?.[0] as any;
      if (activeObject?.data?.id) {
        onSelectLine(activeObject.data.id);
      }
    });

    canvas.on('selection:updated', (e) => {
      const activeObject = e.selected?.[0] as any;
      if (activeObject?.data?.id) {
        onSelectLine(activeObject.data.id);
      }
    });

    canvas.on('selection:cleared', () => {
      onSelectLine(null);
    });

    canvas.on('object:modified', (e) => {
      const obj = e.target;
      if (obj && obj instanceof Line && (obj as any).data?.id) {
        const lineId = (obj as any).data.id;
        // Calculate the absolute coordinates of the endpoints after transformations
        const matrix = obj.calcTransformMatrix();
        const p1 = util.transformPoint(new Point(obj.x1!, obj.y1!), matrix);
        const p2 = util.transformPoint(new Point(obj.x2!, obj.y2!), matrix);
        
        onLinesChange(lines.map(l => l.id === lineId ? { 
          ...l, 
          coords: { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y } 
        } : l));
      }
    });

    return () => {
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (!fabricCanvas.current || !image) return;
    const canvas = fabricCanvas.current;

    const loadImage = async () => {
      try {
        const img = await FabricImage.fromURL(image);
        canvas.clear();
        
        // Calculate scale to fit container
        const containerWidth = containerRef.current?.clientWidth || 800;
        const containerHeight = containerRef.current?.clientHeight || 600;
        
        const scale = Math.min(containerWidth / img.width!, containerHeight / img.height!);
        
        img.set({
          selectable: false,
          evented: false,
          scaleX: scale,
          scaleY: scale,
        });

        canvas.setDimensions({
          width: img.width! * scale,
          height: img.height! * scale
        });
        canvas.add(img);
        canvas.centerObject(img);
        canvas.renderAll();

        // Redraw lines
        syncLinesToCanvas();
      } catch (err) {
        console.error("Failed to load image into fabric:", err);
      }
    };

    loadImage();
  }, [image]);

  useEffect(() => {
    syncLinesToCanvas();
  }, [lines, activeLineId]);

  const syncLinesToCanvas = () => {
    if (!fabricCanvas.current) return;
    const canvas = fabricCanvas.current;
    
    // Remove existing line objects except the background image
    const objects = canvas.getObjects();
    objects.forEach(obj => {
      if (obj instanceof Line || obj instanceof FabricText) {
        canvas.remove(obj);
      }
    });

    lines.forEach(line => {
      const fabricLine = new Line([line.coords.x1, line.coords.y1, line.coords.x2, line.coords.y2], {
        stroke: line.color,
        strokeWidth: activeLineId === line.id ? 4 : 2,
        selectable: true,
        hasControls: true,
        hasBorders: true,
        data: { id: line.id }
      });

      // Add label
      const text = new FabricText(line.name, {
        left: (line.coords.x1 + line.coords.x2) / 2,
        top: (line.coords.y1 + line.coords.y2) / 2 - 20,
        fontSize: 14,
        fill: line.color,
        backgroundColor: 'rgba(0,0,0,0.5)',
        selectable: false,
      });

      canvas.add(fabricLine);
      canvas.add(text);
      
      if (activeLineId === line.id) {
        canvas.setActiveObject(fabricLine);
      }
    });

    canvas.renderAll();
  };

  const startDrawing = () => {
    if (!fabricCanvas.current) return;
    const canvas = fabricCanvas.current;
    
    // Logic for adding a new line can be triggered from parent
  };

  return (
    <div ref={containerRef} className="w-full h-full min-h-[600px] flex items-center justify-center bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 shadow-2xl relative">
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
