import React from 'react';
import { SavedList } from './types';

interface SavedListsModalProps {
    isDark: boolean;
    savedLists: SavedList[];
    currentListId: string | null;
    onClose: () => void;
    onLoadList: (list: SavedList) => void;
    onDeleteList: (id: string, e: React.MouseEvent) => void;
    onCreateNew: () => void;
    onUploadTxt: () => void;
}

const SavedListsModal: React.FC<SavedListsModalProps> = ({ 
    isDark, 
    savedLists, 
    currentListId, 
    onClose, 
    onLoadList, 
    onDeleteList, 
    onCreateNew, 
    onUploadTxt 
}) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className={`p-6 rounded-2xl w-full max-w-lg shadow-2xl border max-h-[80vh] flex flex-col ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Мои Списки</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-500 transition-colors">✕</button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                    {savedLists.length === 0 ? (<div className="text-center py-10 text-slate-500">Нет сохраненных списков.<br/>Назови текущий список и нажми кнопку сохранения.</div>) : (
                        savedLists.map((list) => (
                            <div key={list.id} onClick={() => onLoadList(list)} className={`flex justify-between items-center p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${isDark ? 'bg-slate-700/50 border-slate-600 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-white hover:shadow-md'} ${currentListId === list.id ? 'border-indigo-500 ring-1 ring-indigo-500' : ''}`}>
                                <div><div className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{list.name}</div><div className="text-xs text-slate-500">{list.items.length} вар. • {new Date(list.updatedAt).toLocaleDateString()}</div></div>
                                <button onClick={(e) => onDeleteList(list.id, e)} className="p-2 text-slate-400 hover:text-red-500 transition-colors transform hover:scale-110"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                            </div>
                        ))
                    )}
                </div>
                <div className="mt-6 pt-4 border-t border-slate-700 flex flex-col sm:flex-row gap-3 justify-center items-center">
                        <button onClick={onCreateNew} className="text-indigo-500 hover:text-indigo-400 text-sm font-medium transition-colors hover:underline underline-offset-4">+ Создать новый пустой список</button>
                        <button onClick={onUploadTxt} className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>Загрузить из .txt</button>
                </div>
            </div>
        </div>
    );
};

export default SavedListsModal;
