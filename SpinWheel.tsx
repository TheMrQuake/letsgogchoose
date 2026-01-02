import React, { useRef, useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { THEMES } from './constants';
import { playTickSound, playWinSound } from './utils';

interface SpinWheelProps {
    segments: string[];
    isSpinning: boolean;
    onSpinEnd: (winner: string) => void;
    spinTrigger: number;
    stopTrigger: number;
    centerImage?: string;
    onCenterClick: () => void;
    theme?: string;
    size?: number;
}

const SpinWheel: React.FC<SpinWheelProps> = ({ 
    segments, 
    isSpinning, 
    onSpinEnd, 
    spinTrigger, 
    stopTrigger, 
    centerImage, 
    onCenterClick, 
    theme = 'rainbow', 
    size = 400 
}) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const currentRotation = useRef(0);
    const velocity = useRef(0);
    const animFrameId = useRef<number | null>(null);
    const lastSegmentIndex = useRef(0);
    const prevSpinTrigger = useRef(spinTrigger);
    const prevStopTrigger = useRef(stopTrigger);
    const [hoveredText, setHoveredText] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const totalCount = segments.length;

    const groupedSegments = useMemo(() => {
        const groups: Record<string, number> = {};
        segments.forEach(seg => { groups[seg] = (groups[seg] || 0) + 1; });
        const uniqueKeys = Object.keys(groups);
        const numUnique = uniqueKeys.length;
        let colors: string[] = [];
        if (theme === 'rainbow') {
            colors = Array.from({ length: numUnique }, (_, i) => `hsl(${(i * 360) / numUnique}, 85%, 60%)`);
        } else {
            colors = THEMES[theme] || THEMES['popart'];
        }
        let currentAngle = 0;
        return uniqueKeys.map((text, i) => {
            const count = groups[text];
            const weight = count / totalCount;
            const angleSize = weight * 360;
            const segment = {
                id: `seg-${i}`,
                text,
                count,
                color: theme === 'rainbow' ? colors[i] : colors[i % colors.length],
                startAngle: currentAngle,
                endAngle: currentAngle + angleSize
            };
            currentAngle += angleSize;
            return segment;
        });
    }, [segments, theme, totalCount]);

    const getSegmentAtTop = (rotation: number) => {
        const normalizedRotation = rotation % 360;
        let effectiveAngle = (270 - normalizedRotation) % 360;
        if (effectiveAngle < 0) effectiveAngle += 360;
        return groupedSegments.find(seg => effectiveAngle >= seg.startAngle && effectiveAngle < seg.endAngle);
    };

    const getSectorPath = (startAngle: number, endAngle: number, radius: number) => {
        const startRad = (Math.PI / 180) * startAngle;
        const endRad = (Math.PI / 180) * endAngle;
        const x1 = 50 + radius * Math.cos(startRad);
        const y1 = 50 + radius * Math.sin(startRad);
        const x2 = 50 + radius * Math.cos(endRad);
        const y2 = 50 + radius * Math.sin(endRad);
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
        return `M50,50 L${x1},${y1} A${radius},${radius} 0 ${largeArcFlag},1 ${x2},${y2} Z`;
    };

    // Immediate stop logic
    useEffect(() => {
        if (stopTrigger !== prevStopTrigger.current && isSpinning) {
            prevStopTrigger.current = stopTrigger;
            
            if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
            velocity.current = 0; 
            
            const winnerSeg = getSegmentAtTop(currentRotation.current);
            const winnerText = winnerSeg ? winnerSeg.text : (segments[0] || 'Error');
            
            playWinSound();
            onSpinEnd(winnerText);
        }
    }, [stopTrigger, isSpinning, segments, groupedSegments, onSpinEnd]);

    // Spin animation loop
    useEffect(() => {
        if (spinTrigger === prevSpinTrigger.current) return;
        prevSpinTrigger.current = spinTrigger;
        prevStopTrigger.current = stopTrigger; 
        setHoveredText(null);
        
        velocity.current = Math.random() * 15 + 20; 
        
        const animate = () => {
            currentRotation.current += velocity.current;
            velocity.current *= 0.994;
            if (canvasRef.current) {
                canvasRef.current.style.transform = `rotate(${currentRotation.current}deg)`;
            }
            const currentSegment = getSegmentAtTop(currentRotation.current);
            const currentId = currentSegment ? groupedSegments.indexOf(currentSegment) : -1;
            if (currentId !== lastSegmentIndex.current && velocity.current > 0.1) {
                playTickSound();
                lastSegmentIndex.current = currentId;
            }
            if (velocity.current < 0.02) {
                velocity.current = 0;
                const winnerSeg = getSegmentAtTop(currentRotation.current);
                const winnerText = winnerSeg ? winnerSeg.text : segments[0];
                playWinSound();
                onSpinEnd(winnerText);
                if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
            } else {
                animFrameId.current = requestAnimationFrame(animate);
            }
        };
        if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
        animate();
        return () => { if (animFrameId.current) cancelAnimationFrame(animFrameId.current); };
    }, [spinTrigger, groupedSegments, segments, stopTrigger, onSpinEnd]);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isSpinning) setMousePos({ x: e.clientX, y: e.clientY });
    };

    const fontSize = Math.max(1.5, Math.min(4.5, 35 / groupedSegments.length));
    const calculatedMaxChars = Math.floor(25 - (groupedSegments.length / 4)); 
    const maxChars = Math.max(8, calculatedMaxChars);
    
    const isCenterImageurl = useMemo(() => {
        if (!centerImage) return false;
        return centerImage.startsWith('http') || centerImage.startsWith('data:') || centerImage.startsWith('/');
    }, [centerImage]);

    return (
        <React.Fragment>
          <div 
            className="relative w-full aspect-square mx-auto my-8 select-none max-w-[92vw]" 
            style={{ maxWidth: `${size}px` }} 
            onMouseMove={handleMouseMove} 
            onMouseLeave={() => setHoveredText(null)}
          >
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
               <div className="w-8 h-10 bg-slate-800 dark:bg-white rounded-sm" style={{ clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)' }}></div>
            </div>
            <div className="w-full h-full rounded-full border-4 border-slate-200 dark:border-slate-700 relative overflow-hidden bg-slate-100 dark:bg-slate-800">
              <div ref={canvasRef} className="w-full h-full" style={{ willChange: 'transform' }}>
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                  {groupedSegments.map((seg) => {
                      const path = getSectorPath(seg.startAngle, seg.endAngle, 50);
                      const midAngle = (seg.startAngle + seg.endAngle) / 2;
                      let displayText = seg.text;
                      if (displayText.length > maxChars) displayText = displayText.substring(0, maxChars) + '..';
                      const showText = (seg.endAngle - seg.startAngle) > 10;
                      return (
                          <g key={seg.id} onMouseEnter={() => !isSpinning && setHoveredText(`${seg.text}${seg.count > 1 ? ` (x${seg.count})` : ''}`)} style={{ cursor: isSpinning ? 'default' : 'help' }}>
                              <path d={path} fill={seg.color} stroke="transparent" />
                              {showText && (
                                  <g transform={`rotate(${midAngle}, 50, 50)`}>
                                      <text x="92" y="50" fill="white" fontSize={fontSize} fontWeight="600" textAnchor="end" dominantBaseline="middle" style={{ fontFamily: 'Inter, sans-serif' }}>
                                          {displayText}
                                      </text>
                                  </g>
                              )}
                          </g>
                      );
                  })}
                  </svg>
              </div>
            </div>
            <div onClick={onCenterClick} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full flex items-center justify-center z-10 border-4 border-slate-100 dark:border-slate-800 cursor-pointer overflow-hidden group bg-white dark:bg-slate-700 hover:scale-105 transition-transform shadow-lg" title="Нажми, чтобы изменить картинку" onMouseEnter={() => setHoveredText(null)}>
               {centerImage ? (
                 isCenterImageurl ? (
                    <img src={centerImage} alt="Center" className="w-full h-full object-cover" />
                 ) : (
                    <span className="text-4xl select-none leading-none pt-1" role="img" aria-label="emoji">
                        {centerImage}
                    </span>
                 )
               ) : (
                 <div className="w-full h-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                     <span className="text-2xl text-slate-400 dark:text-slate-300">★</span>
                 </div>
               )}
               <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
               </div>
            </div>
          </div>
          {hoveredText && !isSpinning && createPortal(
            <div className="fixed z-[9999] pointer-events-none px-4 py-2 bg-slate-900/95 text-white text-sm font-medium rounded-lg shadow-xl backdrop-blur-sm border border-slate-700 transition-opacity duration-150" style={{ left: mousePos.x, top: mousePos.y - 15, transform: 'translate(-50%, -100%)', maxWidth: '300px', textAlign: 'center', wordWrap: 'break-word' }}>
              {hoveredText}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-900/95"></div>
            </div>,
            document.body
          )}
        </React.Fragment>
    );
};

export default SpinWheel;
