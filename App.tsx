import React, { useState, useEffect, useMemo, useRef } from 'react';
import SpinWheel from './SpinWheel';
import ImageCropper from './ImageCropper';
import CatalogModal from './CatalogModal';
import SavedListsModal from './SavedListsModal';
import ConfirmationModal from './ConfirmationModal';
import DecisionModal, { DecisionAction } from './DecisionModal';
import RouletteSetupModal from './RouletteSetupModal';
import BackgroundEffect from './components/BackgroundEffect'; // Import the new background component
import { CATALOG, THEMES, THEME_NAMES } from './constants';
import { SavedList, CatalogList } from './types';
import { playGunshot, playChamberClick } from './utils';

const App: React.FC = () => {
    const [items, setItems] = useState<string[]>([]);
    const [currentListName, setCurrentListName] = useState("Мой список");
    const [currentListId, setCurrentListId] = useState<string | null>(null);
    const [centerImage, setCenterImage] = useState<string | undefined>(undefined);
    const [inputValue, setInputValue] = useState("");
    const [isSpinning, setIsSpinning] = useState(false);
    const [spinTrigger, setSpinTrigger] = useState(0);
    const [stopTrigger, setStopTrigger] = useState(0);
    const [winner, setWinner] = useState<string | null>(null);
    
    // Settings State
    const [removeAfterSpin, setRemoveAfterSpin] = useState(false);
    const [spinCenterImage, setSpinCenterImage] = useState(false);
    const [hideWheelText, setHideWheelText] = useState(false);
    const [currentTheme, setCurrentTheme] = useState('rainbow');
    const [wheelSize, setWheelSize] = useState(400); 
    const [isHistoryOpen, setIsHistoryOpen] = useState(false); 
    const [showAllThemes, setShowAllThemes] = useState(false);
    
    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Special Modes
    const [isRouletteMode, setIsRouletteMode] = useState(false);
    
    const [history, setHistory] = useState<string[]>([]);
    const [savedLists, setSavedLists] = useState<SavedList[]>([]);
    const [showListsModal, setShowListsModal] = useState(false);
    const [isDark, setIsDark] = useState(true);
    
    const [editingItem, setEditingItem] = useState<string | null>(null); 
    const [editingText, setEditingText] = useState(""); 

    const [showCatalog, setShowCatalog] = useState(false);
    const [showRouletteModal, setShowRouletteModal] = useState(false);

    const [imageToCrop, setImageToCrop] = useState<string | null>(null);

    // Confirmation Modal State (Simple Yes/No)
    const [confirmation, setConfirmation] = useState<{ isOpen: boolean; message: string; onConfirm: () => void }>({
        isOpen: false,
        message: "",
        onConfirm: () => {}
    });

    // Decision Modal State (Multiple choices)
    const [decision, setDecision] = useState<{ isOpen: boolean; title: string; message: string; actions: DecisionAction[] }>({
        isOpen: false,
        title: "",
        message: "",
        actions: []
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const groupedItems = useMemo(() => {
        const groups: Record<string, number> = {};
        items.forEach(item => { groups[item] = (groups[item] || 0) + 1; });
        const uniqueList: string[] = [];
        const seen = new Set();
        items.forEach(item => {
            if (!seen.has(item)) { uniqueList.push(item); seen.add(item); }
        });
        return uniqueList.map(text => ({ text, count: groups[text] }));
    }, [items]);

    const loadRandomStarter = () => {
        const randomCat = CATALOG[Math.floor(Math.random() * CATALOG.length)];
        const randomList = randomCat.lists[Math.floor(Math.random() * randomCat.lists.length)];
        setItems(randomList.items);
        setCurrentListName(randomList.name);
        setCurrentListId(null);
        setCenterImage(randomList.icon || randomCat.emoji);
        setIsRouletteMode(false);
    };

    // Initialization and Persistence
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const dataParam = params.get('data');
        const sharedName = params.get('name');
        const sharedItems = params.get('items');
        const sharedCenter = params.get('center');
        
        const storedLists = localStorage.getItem('wheel_saved_lists');
        const storedHistory = localStorage.getItem('wheel_history');
        const storedSettings = localStorage.getItem('wheel_settings');
        const lastListId = localStorage.getItem('wheel_last_list_id');

        if (storedLists) setSavedLists(JSON.parse(storedLists));
        if (storedHistory) setHistory(JSON.parse(storedHistory));
        
        if (storedSettings) {
            const settings = JSON.parse(storedSettings);
            setRemoveAfterSpin(settings.removeAfterSpin || false);
            if (typeof settings.spinCenterImage !== 'undefined') setSpinCenterImage(settings.spinCenterImage);
            if (typeof settings.hideWheelText !== 'undefined') setHideWheelText(settings.hideWheelText);
            if (settings.theme) setCurrentTheme(settings.theme);
            if (settings.wheelSize) setWheelSize(settings.wheelSize);
            if (typeof settings.isHistoryOpen !== 'undefined') setIsHistoryOpen(settings.isHistoryOpen);
        }

        if (dataParam) {
            try {
                const decodedStr = decodeURIComponent(escape(atob(dataParam)));
                const decoded = JSON.parse(decodedStr);
                if (decoded.n) setCurrentListName(decoded.n);
                if (decoded.i) setItems(decoded.i);
                if (decoded.c) setCenterImage(decoded.c);
                if (decoded.t) setCurrentTheme(decoded.t);
                setCurrentListId(null);
                window.history.replaceState({}, document.title, window.location.pathname);
            } catch (e) {}
        } 
        else if (sharedName && sharedItems) {
            setCurrentListName(decodeURIComponent(sharedName));
            setItems(decodeURIComponent(sharedItems).split(','));
            if (sharedCenter) setCenterImage(decodeURIComponent(sharedCenter));
            setCurrentListId(null); 
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (storedLists && lastListId) {
            const lists = JSON.parse(storedLists);
            const lastList = lists.find((l: SavedList) => l.id === lastListId);
            if (lastList) {
                setCurrentListName(lastList.name);
                setItems(lastList.items);
                setCurrentListId(lastList.id);
                setCenterImage(lastList.centerImage);
                if (lastList.theme) setCurrentTheme(lastList.theme);
            } else {
                loadRandomStarter();
            }
        } else {
            loadRandomStarter();
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('wheel_settings', JSON.stringify({ 
            removeAfterSpin, 
            spinCenterImage,
            hideWheelText,
            theme: currentTheme,
            wheelSize,
            isHistoryOpen
        }));
        localStorage.setItem('wheel_history', JSON.stringify(history));
    }, [removeAfterSpin, spinCenterImage, hideWheelText, history, currentTheme, wheelSize, isHistoryOpen]);

    useEffect(() => {
        localStorage.setItem('wheel_saved_lists', JSON.stringify(savedLists));
    }, [savedLists]);

    useEffect(() => {
        if (isDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [isDark]);

    const saveListInternal = (name: string, listItems: string[], image: string | undefined, theme: string, existingId: string | null) => {
        const now = Date.now();
        let newList: SavedList;
        let newLists = [...savedLists];
        let newId = existingId;
        if (existingId) {
            const index = newLists.findIndex(l => l.id === existingId);
            if (index >= 0) {
                newList = { ...newLists[index], name, items: listItems, centerImage: image, theme: theme || 'rainbow', updatedAt: now };
                newLists[index] = newList;
            } else {
                newId = now.toString();
                newList = { id: newId, name, items: listItems, centerImage: image, theme: theme || 'rainbow', updatedAt: now };
                newLists.push(newList);
            }
        } else {
            newId = now.toString();
            newList = { id: newId, name, items: listItems, centerImage: image, theme: theme || 'rainbow', updatedAt: now };
            newLists.push(newList);
        }
        setSavedLists(newLists);
        return newId;
    };

    const saveCurrentList = () => {
        const newId = saveListInternal(currentListName, items, centerImage, currentTheme, currentListId);
        if (newId) {
            setCurrentListId(newId);
            localStorage.setItem('wheel_last_list_id', newId);
        }
    };

    const deleteSavedList = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirmation({
            isOpen: true,
            message: "Вы уверены, что хотите удалить этот список навсегда?",
            onConfirm: () => {
                const newLists = savedLists.filter(l => l.id !== id);
                setSavedLists(newLists);
                if (currentListId === id) {
                    setCurrentListId(null);
                    localStorage.removeItem('wheel_last_list_id');
                }
            }
        });
    };

    const loadList = (list: SavedList) => {
        setItems(list.items);
        setCurrentListName(list.name);
        setCurrentListId(list.id);
        setCenterImage(list.centerImage);
        if (list.theme) setCurrentTheme(list.theme);
        localStorage.setItem('wheel_last_list_id', list.id);
        setShowListsModal(false);
        setIsSpinning(false);
        setWinner(null);
        setIsRouletteMode(false);
    };

    const loadFromCatalog = (list: CatalogList, icon: string) => {
        const applyReplace = () => {
            setItems(list.items);
            setCurrentListName(list.name);
            setCurrentListId(null);
            setCenterImage(icon);
            // Apply theme if it exists in the catalog item
            if (list.theme) {
                setCurrentTheme(list.theme);
            }
            setShowCatalog(false);
            setIsSpinning(false);
            setWinner(null);
            setIsRouletteMode(false);
        };

        const applyMerge = () => {
            setItems(prev => [...prev, ...list.items]);
            setShowCatalog(false);
        };

        if (items.length > 0) {
            setDecision({
                isOpen: true,
                title: "Список не пуст",
                message: `Ваш текущий список содержит ${items.length} вариантов. Что сделать с новым списком "${list.name}"?`,
                actions: [
                    { label: "Заменить текущий", onClick: applyReplace, type: 'primary' },
                    { label: "Добавить к текущему", onClick: applyMerge, type: 'secondary' }
                ]
            });
        } else {
            applyReplace();
        }
    };

    const handleShare = () => {
        const shareData = {
            n: currentListName,
            i: items,
            c: (centerImage && !centerImage.startsWith('data:')) ? centerImage : undefined,
            t: currentTheme
        };
        
        try {
            const jsonStr = JSON.stringify(shareData);
            const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
            const url = `${window.location.origin}${window.location.pathname}?data=${encoded}`;
            
            // Clipboard logic
            if (navigator.clipboard && window.isSecureContext) {
                 navigator.clipboard.writeText(url).then(() => {
                    alert(centerImage && centerImage.startsWith('data:') 
                    ? "Короткая ссылка скопирована! (Картинка-файл не сохранилась в ссылке)" 
                    : "Короткая ссылка скопирована в буфер обмена!");
                 }).catch(() => {
                    prompt("Скопируйте ссылку:", url);
                 });
            } else {
                 prompt("Скопируйте ссылку:", url);
            }
        } catch (e) {
            alert("Ошибка при создании ссылки");
        }
    };

    const handleAddItem = () => {
        if (inputValue.trim()) {
            setItems(prev => [...prev, inputValue.trim()]);
            setInputValue("");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleAddItem(); };

    const handleDecreaseItem = (textToRemove: string) => {
        setItems(prev => {
            const index = prev.lastIndexOf(textToRemove);
            if (index > -1) {
                const newItems = [...prev];
                newItems.splice(index, 1);
                return newItems;
            }
            return prev;
        });
    };

    const handleIncreaseItem = (textToAdd: string) => { setItems(prev => [...prev, textToAdd]); };
    const handleDeleteGroup = (textToRemove: string) => { setItems(prev => prev.filter(i => i !== textToRemove)); };

    const startEditing = (text: string) => {
        setEditingItem(text);
        setEditingText(text);
    };

    const cancelEditing = () => {
        setEditingItem(null);
        setEditingText("");
    };

    const saveEditing = () => {
        if (editingText.trim() === "" || editingText.trim() === editingItem) {
            cancelEditing();
            return;
        }
        const newValue = editingText.trim();
        setItems(prev => prev.map(item => item === editingItem ? newValue : item));
        setEditingItem(null);
        setEditingText("");
    };

    const handleEditKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') saveEditing();
        if (e.key === 'Escape') cancelEditing();
    };

    const handleSpinClick = () => {
        if (items.length < 2) return;
        
        if (isSpinning) {
            setStopTrigger(prev => prev + 1);
        } else {
            if (editingItem) cancelEditing();
            setWinner(null);
            setIsSpinning(true);
            setSpinTrigger(prev => prev + 1);
        }
    };

    const handleSpinEnd = (winnerText: string) => {
        setIsSpinning(false);
        setWinner(winnerText);
        setHistory(prev => [winnerText, ...prev]);
        // REMOVED: if (!isHistoryOpen) setIsHistoryOpen(true); // User requested manual control only
        
        // Russian Roulette Logic
        if (isRouletteMode) {
            if (winnerText.includes('БАХ')) {
                playGunshot();
                // Replace the hit "BANG" with a "CLICK" for future spins
                setItems(prev => {
                    const newItems = [...prev];
                    const hitIndex = newItems.indexOf(winnerText); // find the first match of the exact string
                    if (hitIndex !== -1) {
                        newItems[hitIndex] = 'ЩЕЛК 😅'; // Spent
                    }
                    return newItems;
                });
            } else {
                playChamberClick();
            }
            return; // Do NOT process removeAfterSpin logic
        }

        // Standard Logic
        if (removeAfterSpin) {
            setTimeout(() => { handleDecreaseItem(winnerText); }, 2000);
        }
    };

    const handleClearList = () => {
        if (items.length > 0) {
            setConfirmation({
                isOpen: true,
                message: "Вы действительно хотите очистить текущий список?",
                onConfirm: () => setItems([])
            });
        }
    };

    const handleClearHistory = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (history.length > 0) {
            setConfirmation({
                isOpen: true,
                message: "Очистить историю вращений?",
                onConfirm: () => setHistory([])
            });
        }
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (text) {
                const newItems = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
                if (newItems.length > 0) {
                    const name = file.name.replace(/\.[^/.]+$/, "");
                    
                    setDecision({
                        isOpen: true,
                        title: "Файл загружен",
                        message: `Файл "${file.name}" содержит ${newItems.length} вариантов. Что сделать?`,
                        actions: [
                            { 
                                label: "Открыть сейчас (заменит текущий)", 
                                type: 'primary',
                                onClick: () => {
                                    setItems(newItems);
                                    setCurrentListName(name);
                                    setCurrentListId(null);
                                    setCenterImage(undefined);
                                    setIsSpinning(false);
                                    setWinner(null);
                                    setShowListsModal(false);
                                    setIsRouletteMode(false);
                                }
                            },
                            { 
                                label: "Сохранить в Мои списки", 
                                type: 'secondary',
                                onClick: () => {
                                    saveListInternal(name, newItems, undefined, 'rainbow', null);
                                    setShowListsModal(true); // Ensure user sees it happened
                                }
                            }
                        ]
                    });
                }
            }
        };
        reader.readAsText(file);
        e.target.value = ''; 
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            if (result) {
                setImageToCrop(result);
            }
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleCropSave = (croppedImageUrl: string) => {
        setCenterImage(croppedImageUrl);
        setImageToCrop(null);
    };

    const startRussianRoulette = (bullets: number) => {
        const emptyChambers = 6 - bullets;
        // Create array with distinct identifiers for visual difference or identical for suspense. 
        // For distinct visual segments in SpinWheel with disableGrouping, we need unique items in logic 
        // OR rely on the fact that disableGrouping maps index 1:1.
        
        // We will just use strings. Shuffle them.
        const chamber = [
            ...Array(bullets).fill('БАХ 💥'),
            ...Array(emptyChambers).fill('ЩЕЛК 😅')
        ];
        
        // Fisher-Yates Shuffle
        for (let i = chamber.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [chamber[i], chamber[j]] = [chamber[j], chamber[i]];
        }

        setItems(chamber);
        setCurrentListName("Русская Рулетка");
        setCurrentTheme('revolver');
        setCenterImage('💀'); 
        setIsRouletteMode(true);
        setCurrentListId(null);
        setWinner(null);
    };

    const getThemePreviewStyle = (themeKey: string) => {
        if (themeKey === 'rainbow') {
            return { background: 'conic-gradient(from 0deg, red, orange, yellow, green, blue, indigo, violet, red)' };
        }
        const colors = THEMES[themeKey];
        if (!colors || colors.length === 0) return { background: '#ccc' };
        
        const stops = colors.map((color, index) => {
            const start = (index / colors.length) * 100;
            const end = ((index + 1) / colors.length) * 100;
            return `${color} ${start}% ${end}%`;
        }).join(', ');
        
        return { background: `conic-gradient(${stops})` };
    };

    return (
        <div className={`min-h-screen transition-colors duration-300 overflow-x-hidden ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
            {/* Added BackgroundEffect component. Pass isDark to adjust colors. */}
            <BackgroundEffect isDark={isDark} />

            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt" className="hidden" />
            <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

            {imageToCrop && (
                <ImageCropper 
                    imageUrl={imageToCrop} 
                    onCancel={() => setImageToCrop(null)} 
                    onSave={handleCropSave} 
                    isDark={isDark}
                />
            )}
            
            <ConfirmationModal 
                isOpen={confirmation.isOpen}
                message={confirmation.message}
                onConfirm={confirmation.onConfirm}
                onCancel={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
                isDark={isDark}
            />

            <DecisionModal
                isOpen={decision.isOpen}
                title={decision.title}
                message={decision.message}
                actions={decision.actions}
                onCancel={() => setDecision(prev => ({ ...prev, isOpen: false }))}
                isDark={isDark}
            />

            <RouletteSetupModal 
                isOpen={showRouletteModal}
                onClose={() => setShowRouletteModal(false)}
                onStart={startRussianRoulette}
                isDark={isDark}
            />

            {/* Added relative and z-10 to nav to ensure it sits ABOVE the background */}
            <nav className="w-full px-4 sm:px-6 py-4 flex justify-between items-center max-w-7xl mx-auto relative z-10">
                <div className="flex items-center gap-4">
                    <div className="font-extrabold text-2xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-600 hidden sm:block select-none cursor-default">
                    Let's go G..Choose
                    </div>
                    <button onClick={() => setShowListsModal(true)} className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 shadow-slate-900/50' : 'bg-white text-slate-700 shadow-sm hover:bg-slate-100 border border-slate-200'} shadow-lg active:scale-95 text-sm sm:text-base`}>
                        <span className="hidden sm:inline">Мои списки</span>
                        <span className="sm:hidden">Списки</span>
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleShare} className={`p-2 rounded-full transition-colors ${isDark ? 'text-indigo-400 hover:bg-slate-800' : 'text-indigo-600 hover:bg-indigo-50'}`} title="Поделиться списком">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    </button>
                    <button 
                        onClick={() => setShowRouletteModal(true)} 
                        className={`p-2 rounded-full transition-colors ${isDark ? 'bg-slate-800 text-red-500 hover:bg-slate-700 shadow-slate-900/50' : 'bg-white text-red-600 shadow-sm hover:bg-slate-100 border border-slate-200'} shadow-lg active:scale-95`} 
                        title="Русская Рулетка"
                    >
                        🔫
                    </button>
                    <button onClick={() => setIsDark(!isDark)} className={`p-2 rounded-full transition-colors ${isDark ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700 shadow-slate-900/50' : 'bg-white text-slate-800 shadow-sm hover:bg-slate-100 border border-slate-200'} shadow-lg active:scale-95`}>
                        {isDark ? "☀️" : "🌙"}
                    </button>
                    {/* TOGGLE SIDEBAR BUTTON */}
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                        className={`p-2 rounded-full transition-colors ${isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 shadow-slate-900/50' : 'bg-white text-slate-700 shadow-sm hover:bg-slate-100 border border-slate-200'} shadow-lg active:scale-95`}
                        title={isSidebarOpen ? "Скрыть панель" : "Показать панель"}
                    >
                        {isSidebarOpen ? (
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                           </svg>
                        ) : (
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                           </svg>
                        )}
                    </button>
                </div>
            </nav>

            {/* Main Content: Conditional Grid/Flex based on Sidebar Visibility */}
            <main className={`max-w-7xl mx-auto px-4 pb-12 pt-4 transition-all duration-500 ease-in-out relative z-10 ${isSidebarOpen ? 'grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start' : 'flex flex-col items-center justify-center min-h-[80vh]'}`}>
                <div className={`flex flex-col items-center transition-all duration-500 ${isSidebarOpen ? 'lg:col-span-7 w-full' : 'w-full max-w-4xl scale-110'}`}>
                   <div className="w-full flex flex-col items-center">
                      <div className="flex items-center justify-center w-full mb-4 px-4">
                          <textarea value={currentListName} onChange={(e) => setCurrentListName(e.target.value)} maxLength={50} rows={currentListName.length > 20 ? 2 : 1} className={`text-center text-2xl sm:text-3xl font-bold bg-transparent border-b-2 border-transparent focus:border-indigo-500 outline-none transition-all w-full max-w-md resize-none overflow-hidden ${isDark ? 'text-white' : 'text-slate-800'}`} placeholder="Название списка" style={{ lineHeight: '1.2' }} />
                      </div>
                      <p className={`text-center mb-8 text-sm flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{groupedItems.length} вариантов</p>
                      {items.length < 2 ? (
                        <div className="w-64 h-64 rounded-full border-4 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 p-6 text-center animate-pulse">Добавьте хотя бы 2 варианта в список справа 👉</div>
                      ) : (
                        <div className="w-full flex justify-center transform transition-transform hover:scale-[1.02] duration-500">
                            <SpinWheel 
                                segments={items} 
                                isSpinning={isSpinning} 
                                onSpinEnd={handleSpinEnd} 
                                spinTrigger={spinTrigger} 
                                stopTrigger={stopTrigger} 
                                centerImage={centerImage} 
                                onCenterClick={() => imageInputRef.current?.click()} 
                                theme={currentTheme} 
                                size={wheelSize} 
                                spinCenterImage={spinCenterImage}
                                disableGrouping={isRouletteMode}
                                hideText={isRouletteMode || hideWheelText}
                                disableWinSound={isRouletteMode}
                            />
                        </div>
                      )}
                      <button onClick={handleSpinClick} disabled={items.length < 2} className={`mt-6 px-16 py-5 rounded-2xl text-xl font-bold shadow-xl transition-all ${items.length < 2 ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed scale-95' : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:scale-105 hover:shadow-indigo-500/30 active:scale-95'}`}>{isSpinning ? 'Пропустить' : 'Крутить Колесо!'}</button>
                   </div>
                </div>

                {isSidebarOpen && (
                    <div className="lg:col-span-5 w-full flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
                        <div className={`rounded-3xl p-6 lg:p-8 shadow-xl border transition-colors ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'}`}>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Варианты</h3>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button onClick={handleClearList} disabled={items.length === 0 || isSpinning} className={`h-8 px-3 flex-1 sm:flex-none text-xs font-medium text-red-500 hover:text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed`}>Очистить</button>
                                    <button onClick={saveCurrentList} className={`h-8 w-8 flex-none flex items-center justify-center rounded-xl transition-colors ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} title="Сохранить список">💾</button>
                                    <button onClick={() => setShowCatalog(true)} className="h-8 px-3 flex-1 sm:flex-none text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 rounded-xl hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-colors flex items-center justify-center gap-1 shadow-sm whitespace-nowrap">📚 Каталог</button>
                                </div>
                            </div>
                            <div className="flex gap-2 mb-6">
                                <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder="Добавить вариант..." disabled={isSpinning} className={`flex-1 px-4 py-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-indigo-500/50 ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500 placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 focus:bg-white'}`} />
                                <button onClick={handleAddItem} disabled={!inputValue.trim() || isSpinning} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/30 active:scale-95">+</button>
                            </div>
                            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                {items.length === 0 && <div className={`text-center py-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Список пуст. Добавьте что-нибудь!</div>}
                                {groupedItems.map((itemObj, idx) => (
                                <div key={`${itemObj.text}-${idx}`} className={`group flex justify-between items-center p-3 rounded-xl border transition-all ${isDark ? 'bg-slate-700/30 border-slate-700 text-slate-200 hover:bg-slate-700/50 hover:border-slate-600' : 'bg-white border-slate-100 text-slate-700 shadow-sm hover:border-indigo-200 hover:shadow-md'}`}>
                                    
                                    {editingItem === itemObj.text ? (
                                        <div className="flex flex-1 gap-2 items-center w-full">
                                            <input 
                                                autoFocus
                                                type="text" 
                                                value={editingText}
                                                onChange={(e) => setEditingText(e.target.value)}
                                                onKeyDown={handleEditKeyDown}
                                                onBlur={saveEditing}
                                                className={`flex-1 px-2 py-1 rounded text-sm outline-none border focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-800'}`}
                                            />
                                            <button onClick={saveEditing} className="text-green-500 hover:text-green-600 p-1">✔</button>
                                            <button onClick={cancelEditing} className="text-red-400 hover:text-red-500 p-1">✕</button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className={`flex items-center gap-2 overflow-hidden mr-2 flex-1 cursor-pointer transition-all rounded-md ${isRouletteMode ? 'bg-slate-300 dark:bg-slate-600 text-transparent animate-pulse select-none px-2' : ''}`} onClick={() => !isSpinning && !isRouletteMode && startEditing(itemObj.text)} title={isRouletteMode ? 'Секретная информация' : 'Нажми, чтобы изменить текст'}>
                                                <span className={`font-medium truncate ${isRouletteMode ? '' : 'select-none'}`}>{itemObj.text}</span>
                                                {!isRouletteMode && itemObj.count > 1 && <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-indigo-500 text-white shadow-sm shrink-0">x{itemObj.count}</span>}
                                            </div>
                                            <div className="flex items-center gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleDecreaseItem(itemObj.text)} disabled={isSpinning} className={`p-1 w-7 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>-</button>
                                                <button onClick={() => handleIncreaseItem(itemObj.text)} disabled={isSpinning} className={`p-1 w-7 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>+</button>
                                                <button onClick={() => handleDeleteGroup(itemObj.text)} disabled={isSpinning} className="p-1.5 ml-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">🗑️</button>
                                            </div>
                                        </>
                                    )}
                                </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className={`rounded-2xl border overflow-hidden transition-colors ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <div 
                                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                                className={`p-4 font-bold border-b ${isDark ? 'border-slate-700 text-slate-200 hover:bg-slate-700/50' : 'border-slate-100 text-slate-800 hover:bg-slate-50'} flex justify-between items-center cursor-pointer select-none transition-colors`}
                            >
                                <span>История ({history.length})</span>
                                <div className="flex items-center gap-4">
                                    {history.length > 0 && <button onClick={handleClearHistory} className="text-xs text-red-400 hover:text-red-500 underline z-10 mr-2">Очистить</button>}
                                    <svg className={`w-5 h-5 transform transition-transform duration-200 ${isHistoryOpen ? 'rotate-180' : ''} opacity-50`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                            {isHistoryOpen && (
                                <div className="p-4 max-h-40 overflow-y-auto custom-scrollbar animate-[fadeIn_0.2s_ease-out]">
                                    {history.length > 0 ? (
                                    <ul className="space-y-1">
                                        {history.map((h, i) => (
                                            <li key={i} className={`text-sm py-1 border-b last:border-0 ${isDark ? 'text-slate-400 border-slate-700' : 'text-slate-600 border-slate-100'}`}>
                                                <span className="opacity-50 mr-2">#{history.length - i}</span> {h}
                                            </li>
                                        ))}
                                    </ul>
                                    ) : (
                                        <div className="text-sm text-slate-500 py-2">История пуста</div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className={`rounded-2xl border overflow-hidden transition-colors ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <details className="group">
                                <summary className={`flex justify-between items-center p-4 cursor-pointer font-bold text-lg select-none transition-colors ${isDark ? 'text-slate-200 hover:bg-slate-800/50' : 'text-slate-800 hover:bg-slate-50'}`}>
                                    <span>Настройки</span>
                                    <svg className="w-5 h-5 transform group-open:rotate-180 transition-transform opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </summary>
                                <div className={`p-6 pt-0 border-t transition-colors ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                                    
                                    <div className={`flex flex-col p-3 rounded-xl mb-4 mt-4 border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Размер колеса</span>
                                            <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{wheelSize}px</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="300" 
                                            max="900" 
                                            step="10"
                                            value={wheelSize} 
                                            onChange={(e) => setWheelSize(Number(e.target.value))} 
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-indigo-600"
                                        />
                                    </div>

                                    <div className={`flex items-center justify-between p-3 rounded-xl mb-3 border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                        <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Удалять выпавший вариант</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={removeAfterSpin} onChange={(e) => setRemoveAfterSpin(e.target.checked)} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>

                                    <div className={`flex items-center justify-between p-3 rounded-xl mb-3 border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                        <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Крутящаяся картинка</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={spinCenterImage} onChange={(e) => setSpinCenterImage(e.target.checked)} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>

                                    <div className={`flex items-center justify-between p-3 rounded-xl mb-6 border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                        <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Скрывать текст на колесе</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={hideWheelText} onChange={(e) => setHideWheelText(e.target.checked)} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>

                                    <div>
                                        <span className={`text-sm font-medium block mb-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Стиль колеса</span>
                                        <div className="grid grid-cols-4 gap-2 mb-2">
                                            {Object.keys(THEMES).slice(0, showAllThemes ? undefined : 4).map((themeKey) => (
                                                <button key={themeKey} onClick={() => setCurrentTheme(themeKey)} className={`w-full aspect-square rounded-lg border-2 flex items-center justify-center overflow-hidden transition-all hover:scale-105 ${currentTheme === themeKey ? 'border-indigo-500 ring-2 ring-indigo-500/30 scale-105' : 'border-transparent hover:border-slate-400'}`} title={THEME_NAMES[themeKey] || themeKey}>
                                                    <div className="w-full h-full relative rounded-md" style={getThemePreviewStyle(themeKey)}></div>
                                                </button>
                                            ))}
                                        </div>
                                        {!showAllThemes ? (
                                            <button 
                                                onClick={() => setShowAllThemes(true)} 
                                                className={`text-xs w-full py-2 rounded-lg border border-dashed transition-colors ${isDark ? 'border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500' : 'border-slate-300 text-slate-500 hover:text-slate-700 hover:border-slate-400'}`}
                                            >
                                                Показать все темы ({Object.keys(THEMES).length - 4})
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => setShowAllThemes(false)} 
                                                className={`text-xs w-full py-2 rounded-lg border border-dashed transition-colors ${isDark ? 'border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500' : 'border-slate-300 text-slate-500 hover:text-slate-700 hover:border-slate-400'}`}
                                            >
                                                Свернуть
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </details>
                        </div>
                    </div>
                )}
            </main>

            {winner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <div className={`p-10 rounded-[2rem] text-center max-w-md w-full shadow-2xl transform scale-100 relative overflow-hidden ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white'}`}>
                     <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"></div>
                    <h3 className="text-xl text-indigo-500 font-bold mb-4 uppercase tracking-widest">Выпало:</h3>
                    <div className={`text-4xl md:text-5xl font-extrabold mb-10 break-words leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{winner}</div>
                    <button onClick={() => setWinner(null)} className="bg-indigo-600 text-white px-10 py-3 rounded-full font-bold hover:bg-indigo-700 transition-all w-full shadow-lg hover:shadow-indigo-500/40">Отлично!</button>
                  </div>
                </div>
            )}

            {showCatalog && (
                <CatalogModal 
                    isDark={isDark} 
                    onClose={() => setShowCatalog(false)} 
                    onLoadList={loadFromCatalog} 
                />
            )}
            
            {showListsModal && (
                <SavedListsModal 
                    isDark={isDark}
                    savedLists={savedLists}
                    currentListId={currentListId}
                    onClose={() => setShowListsModal(false)}
                    onLoadList={loadList}
                    onDeleteList={deleteSavedList}
                    onCreateNew={() => { setItems([]); setCurrentListName("Новый список"); setCurrentListId(null); setCenterImage(undefined); setCurrentTheme('rainbow'); setShowListsModal(false); localStorage.removeItem('wheel_last_list_id'); setIsRouletteMode(false); }}
                    onUploadTxt={triggerFileUpload}
                />
            )}
        </div>
    );
};

export default App;