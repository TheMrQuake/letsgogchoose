import React from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDark: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, message, onConfirm, onCancel, isDark }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" onClick={onCancel}>
            <div 
                className={`p-6 rounded-2xl w-full max-w-sm shadow-2xl border transform scale-100 transition-all ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Подтверждение</h3>
                <p className={`mb-8 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{message}</p>
                <div className="flex gap-3">
                    <button 
                        onClick={onCancel} 
                        className={`flex-1 py-2.5 rounded-xl font-medium transition-colors ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Отмена
                    </button>
                    <button 
                        onClick={() => { onConfirm(); onCancel(); }} 
                        className="flex-1 py-2.5 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                    >
                        Да, очистить
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;