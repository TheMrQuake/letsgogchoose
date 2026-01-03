import React from 'react';

export interface DecisionAction {
    label: string;
    onClick: () => void;
    type?: 'primary' | 'secondary' | 'danger';
}

interface DecisionModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    actions: DecisionAction[];
    onCancel: () => void;
    isDark: boolean;
}

const DecisionModal: React.FC<DecisionModalProps> = ({ isOpen, title, message, actions, onCancel, isDark }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" onClick={onCancel}>
            <div 
                className={`p-6 rounded-2xl w-full max-w-sm shadow-2xl border transform scale-100 transition-all ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
                <p className={`mb-6 text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{message}</p>
                <div className="flex flex-col gap-2">
                    {actions.map((action, idx) => {
                        let btnClass = "";
                        if (action.type === 'danger') {
                            btnClass = "bg-red-500 text-white hover:bg-red-600 shadow-red-500/30";
                        } else if (action.type === 'secondary') {
                            btnClass = isDark ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-slate-100 text-slate-600 hover:bg-slate-200";
                        } else {
                            // Primary default
                            btnClass = "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/30";
                        }

                        return (
                            <button 
                                key={idx}
                                onClick={() => { action.onClick(); onCancel(); }} 
                                className={`w-full py-3 rounded-xl font-medium transition-all shadow-md active:scale-95 ${btnClass}`}
                            >
                                {action.label}
                            </button>
                        );
                    })}
                    <button 
                        onClick={onCancel} 
                        className={`mt-2 w-full py-2 text-sm font-medium transition-colors hover:underline ${isDark ? 'text-slate-500 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Отмена
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DecisionModal;