import React, { useState } from 'react';

interface RouletteSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (bullets: number) => void;
    isDark: boolean;
}

const RouletteSetupModal: React.FC<RouletteSetupModalProps> = ({ isOpen, onClose, onStart, isDark }) => {
    const [bullets, setBullets] = useState(1);

    if (!isOpen) return null;

    const handleRandom = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent modal background click interaction
        e.preventDefault(); // Prevent accidental form submission behavior
        const randomBullets = Math.floor(Math.random() * 6) + 1;
        setBullets(randomBullets);
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" onClick={onClose}>
            <div 
                className={`p-6 rounded-2xl w-full max-w-sm shadow-2xl border transform scale-100 transition-all ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">🔫</span>
                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Русская Рулетка</h3>
                </div>
                
                <p className={`mb-6 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Барабан револьвера имеет 6 камор. Сколько пуль зарядить?
                </p>

                <div className="mb-8">
                    <div className="flex justify-between mb-2">
                        <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>1 пуля</span>
                        <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{bullets} / 6</span>
                        <div className="flex gap-2">
                             <button 
                                type="button"
                                onClick={handleRandom} 
                                className="text-xs px-2 py-0.5 rounded bg-indigo-500 text-white hover:bg-indigo-600 transition-colors shadow-sm active:scale-95" 
                                title="Случайное количество"
                             >
                                🎲 Случайно
                             </button>
                             <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>6 пуль</span>
                        </div>
                    </div>
                    <input 
                        type="range" 
                        min="1" 
                        max="6" 
                        step="1"
                        value={bullets}
                        onChange={(e) => setBullets(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-red-600"
                    />
                </div>

                <div className="flex gap-3">
                    <button 
                        type="button"
                        onClick={onClose} 
                        className={`flex-1 py-3 rounded-xl font-medium transition-colors ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Отмена
                    </button>
                    <button 
                        type="button"
                        onClick={() => { onStart(bullets); onClose(); }} 
                        className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 transition-all shadow-lg shadow-red-900/40 active:scale-95"
                    >
                        Зарядить!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RouletteSetupModal;