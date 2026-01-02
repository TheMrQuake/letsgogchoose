import React, { useState, useMemo } from 'react';
import { CATALOG } from './constants';
import { CatalogList } from './types';

interface CatalogModalProps {
    isDark: boolean;
    onClose: () => void;
    onLoadList: (list: CatalogList, icon: string) => void;
}

const CatalogModal: React.FC<CatalogModalProps> = ({ isDark, onClose, onLoadList }) => {
    const [catalogSearch, setCatalogSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");

    const filteredCatalog = useMemo(() => {
        const searchLower = catalogSearch.toLowerCase();
        const categoriesToSearch = activeCategory === 'all' 
            ? CATALOG 
            : CATALOG.filter(cat => cat.id === activeCategory);
        const results: { categoryName: string; categoryEmoji: string; list: CatalogList }[] = [];
        categoriesToSearch.forEach(cat => {
            cat.lists.forEach(list => {
                const matchName = list.name.toLowerCase().includes(searchLower);
                const matchItems = list.items.some(i => i.toLowerCase().includes(searchLower));
                if (matchName || matchItems) {
                    results.push({ categoryName: cat.name, categoryEmoji: cat.emoji, list });
                }
            });
        });
        return results;
    }, [catalogSearch, activeCategory]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className={`p-6 rounded-2xl w-full max-w-lg shadow-2xl border flex flex-col h-[85vh] ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
              <div className="flex justify-between items-center mb-4">
                 <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    📚 Каталог Идей
                 </h3>
                 <button onClick={onClose} className="text-slate-400 hover:text-slate-500 transition-colors">✕</button>
              </div>

              <div className="relative mb-4">
                <input 
                    type="text" 
                    value={catalogSearch} 
                    onChange={(e) => setCatalogSearch(e.target.value)} 
                    placeholder="Найти список (например: пицца, игры)..." 
                    className={`w-full rounded-xl pl-10 pr-4 py-3 outline-none border focus:ring-2 focus:ring-emerald-500 transition-all ${isDark ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900'}`} 
                />
                <span className="absolute left-3 top-3.5 text-slate-400">🔍</span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 mb-2 custom-scrollbar">
                  <button onClick={() => setActiveCategory('all')} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeCategory === 'all' ? 'bg-emerald-500 text-white' : (isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}`}>Все</button>
                  {CATALOG.map(cat => (
                      <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeCategory === cat.id ? 'bg-emerald-500 text-white' : (isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}`}>
                          {cat.emoji} {cat.name}
                      </button>
                  ))}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3">
                  {filteredCatalog.length === 0 ? (
                      <div className="text-center py-10 text-slate-500">Ничего не найдено 😔 <br/> Попробуйте другой запрос.</div>
                  ) : (
                      filteredCatalog.map((item, idx) => (
                          <div key={idx} onClick={() => onLoadList(item.list, item.list.icon || '✨')} className={`cursor-pointer p-4 rounded-xl border transition-all hover:scale-[1.01] hover:shadow-lg ${isDark ? 'bg-slate-700/40 border-slate-600 hover:bg-slate-700' : 'bg-white border-slate-100 hover:border-emerald-200'}`}>
                              <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                      <span className="text-2xl">{item.list.icon || '📝'}</span>
                                      <div>
                                          <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{item.list.name}</div>
                                          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{item.categoryName}</div>
                                      </div>
                                  </div>
                                  <span className="text-xs bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded-full text-slate-600 dark:text-slate-300 font-mono">{item.list.items.length}</span>
                              </div>
                              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed opacity-80">
                                  {item.list.items.join(', ')}
                              </p>
                          </div>
                      ))
                  )}
              </div>
           </div>
        </div>
    );
};

export default CatalogModal;
