import React, { useRef, useState, useEffect } from 'react';

interface ImageCropperProps {
    imageUrl: string;
    onCancel: () => void;
    onSave: (croppedImageUrl: string) => void;
    isDark: boolean;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ imageUrl, onCancel, onSave, isDark }) => {
    const imageRef = useRef<HTMLImageElement>(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const img = new Image();
        img.src = imageUrl;
    }, [imageUrl]);

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        setStartPos({ x: clientX - position.x, y: clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        setPosition({ x: clientX - startPos.x, y: clientY - startPos.y });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleSave = () => {
        const canvas = document.createElement('canvas');
        const size = 300; 
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.beginPath();
        ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
        ctx.clip();

        const img = imageRef.current;
        if (!img) return;

        const previewSize = 250;
        const scaleFactor = size / previewSize;

        const drawScale = scale * scaleFactor;
        const drawX = (position.x * scaleFactor) + (size / 2) - (img.width * drawScale / 2);
        const drawY = (position.y * scaleFactor) + (size / 2) - (img.height * drawScale / 2);

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);
        
        ctx.drawImage(img, drawX, drawY, img.width * drawScale, img.height * drawScale);

        onSave(canvas.toDataURL('image/png'));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onMouseUp={handleMouseUp} onTouchEnd={handleMouseUp}>
            <div className={`w-full max-w-sm rounded-2xl p-6 flex flex-col items-center ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Кадрирование</h3>
                
                <div 
                    className="relative w-[250px] h-[250px] bg-slate-900 overflow-hidden rounded-lg cursor-move touch-none border-2 border-dashed border-slate-500 mb-4"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onTouchStart={handleMouseDown}
                    onTouchMove={handleMouseMove}
                >
                    <img 
                        ref={imageRef}
                        src={imageUrl} 
                        alt="Crop target" 
                        className="absolute max-w-none origin-center pointer-events-none select-none"
                        style={{ 
                            transform: `translate(-50%, -50%) translate(${125 + position.x}px, ${125 + position.y}px) scale(${scale})`,
                            left: 0,
                            top: 0
                        }}
                        draggable={false}
                    />
                    
                    <div className="absolute inset-0 pointer-events-none border-[100px] border-black/50 rounded-full box-content -m-[100px]"></div>
                    <div className="absolute inset-0 pointer-events-none border-2 border-white/50 rounded-full"></div>
                </div>

                <div className="w-full px-4 mb-6">
                    <label className={`text-xs mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Масштаб</label>
                    <input 
                        type="range" 
                        min="0.1" 
                        max="3" 
                        step="0.05" 
                        value={scale} 
                        onChange={(e) => setScale(parseFloat(e.target.value))}
                        className="w-full"
                    />
                </div>

                <div className="flex gap-3 w-full">
                    <button onClick={onCancel} className={`flex-1 py-2 rounded-xl text-sm font-medium ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Отмена</button>
                    <button onClick={handleSave} className="flex-1 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700">Сохранить</button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropper;