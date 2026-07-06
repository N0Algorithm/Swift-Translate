import React, { useState, useEffect } from 'react';
import './App.css';
import TopNavBar from './components/TopNavBar';
import HeroSection from './components/HeroSection';
import LanguageBar, { LANGUAGES } from './components/LanguageBar';
import SourceCard from './components/SourceCard';
import TargetCard from './components/TargetCard';
import HistorySidebar from './components/HistorySidebar';
import BottomNavBar from './components/BottomNavBar';

const INITIAL_HISTORY = [
  {
    id: 'demo-1',
    sourceLang: 'en',
    targetLang: 'es',
    sourceText: 'Hello, how can I help you today?',
    translatedText: 'Hola, ¿cómo puedo ayudarte hoy?',
    timestamp: Date.now() - 3600000,
    isStarred: true
  },
  {
    id: 'demo-2',
    sourceLang: 'en',
    targetLang: 'fr',
    sourceText: 'Artificial intelligence is transforming global communications.',
    translatedText: "L'intelligence artificielle transforme les communications mondiales.",
    timestamp: Date.now() - 7200000,
    isStarred: false
  }
];

function App() {
  // Theme state: Default to DARK MODE per user request
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('swift_translate_theme');
    return saved ? saved === 'dark' : true;
  });

  // Translation state
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  // UI Drawer state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState('translate');
  const [toastMessage, setToastMessage] = useState(null);

  // History state
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('swift_translate_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_HISTORY;
      }
    }
    return INITIAL_HISTORY;
  });

  // Sync dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('swift_translate_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('swift_translate_theme', 'light');
    }
  }, [isDarkMode]);

  // Sync history to localStorage
  useEffect(() => {
    localStorage.setItem('swift_translate_history', JSON.stringify(history));
  }, [history]);

  // Toast auto-hide
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  // Translation Handler (accepts overrides for immediate translation on dropdown change)
  const handleTranslate = async (
    overrideSourceLang = sourceLang,
    overrideTargetLang = targetLang,
    overrideText = sourceText
  ) => {
    if (!overrideText.trim()) return;

    setIsTranslating(true);
    setTranslatedText('');

    try {
      // Live MyMemory API call
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        overrideText
      )}&langpair=${overrideSourceLang}|${overrideTargetLang}`;
      
      const response = await fetch(url);
      const data = await response.json();

      let result = '';
      if (data && data.responseData && data.responseData.translatedText) {
        result = data.responseData.translatedText;
      } else {
        throw new Error('No translation returned');
      }

      setTranslatedText(result);

      // Add to history
      const newItem = {
        id: `trans-${Date.now()}`,
        sourceLang: overrideSourceLang,
        targetLang: overrideTargetLang,
        sourceText: overrideText,
        translatedText: result,
        timestamp: Date.now(),
        isStarred: false
      };

      setHistory((prev) => [newItem, ...prev.slice(0, 49)]);
    } catch (err) {
      console.warn('API fallback triggered:', err);
      // Intelligent fallback for offline or rate limits
      const targetLangName =
        LANGUAGES.find((l) => l.code === overrideTargetLang)?.name || overrideTargetLang;
      
      const simulatedResult = `[${targetLangName}] ${overrideText}`;
      setTranslatedText(simulatedResult);

      const newItem = {
        id: `trans-${Date.now()}`,
        sourceLang: overrideSourceLang,
        targetLang: overrideTargetLang,
        sourceText: overrideText,
        translatedText: simulatedResult,
        timestamp: Date.now(),
        isStarred: false
      };
      setHistory((prev) => [newItem, ...prev.slice(0, 49)]);
      showToast('Translated (Offline / Fallback Mode)');
    } finally {
      setIsTranslating(false);
    }
  };

  // Language Dropdown Changes with Instant Translation
  const handleSourceLangChange = (newLang) => {
    setSourceLang(newLang);
    if (sourceText.trim()) {
      handleTranslate(newLang, targetLang, sourceText);
    }
  };

  const handleTargetLangChange = (newLang) => {
    setTargetLang(newLang);
    if (sourceText.trim()) {
      handleTranslate(sourceLang, newLang, sourceText);
    }
  };

  // Language Swap with Instant Translation
  const handleSwapLanguages = () => {
    const newSourceLang = targetLang;
    const newTargetLang = sourceLang;
    const newSourceText = translatedText || sourceText;
    
    setSourceLang(newSourceLang);
    setTargetLang(newTargetLang);
    setSourceText(newSourceText);
    setTranslatedText(sourceText);

    showToast('Swapped languages');
    
    if (newSourceText.trim()) {
      handleTranslate(newSourceLang, newTargetLang, newSourceText);
    }
  };

  // History item actions
  const handleSelectHistoryItem = (item) => {
    setSourceLang(item.sourceLang);
    setTargetLang(item.targetLang);
    setSourceText(item.sourceText);
    setTranslatedText(item.translatedText);
    if (window.innerWidth < 1024) {
      setIsHistoryOpen(false);
      setActiveMobileTab('translate');
    }
  };

  const handleToggleStarItem = (id) => {
    setHistory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isStarred: !item.isStarred } : item
      )
    );
    showToast('Updated Pinned translations');
  };

  const handleDeleteItem = (id) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    showToast('Removed translation from history');
  };

  const handleClearAllHistory = () => {
    if (window.confirm('Are you sure you want to clear all translation history?')) {
      setHistory([]);
      showToast('Cleared all history');
    }
  };

  // Current translation star check
  const currentHistoryItem = history.find(
    (item) =>
      item.sourceText === sourceText &&
      item.translatedText === translatedText &&
      translatedText !== ''
  );
  const isCurrentStarred = currentHistoryItem ? currentHistoryItem.isStarred : false;

  const handleToggleCurrentStar = () => {
    if (!translatedText) return;
    if (currentHistoryItem) {
      handleToggleStarItem(currentHistoryItem.id);
    } else {
      // Save current as starred
      const newItem = {
        id: `trans-${Date.now()}`,
        sourceLang,
        targetLang,
        sourceText,
        translatedText,
        timestamp: Date.now(),
        isStarred: true
      };
      setHistory((prev) => [newItem, ...prev]);
      showToast('Pinned translation');
    }
  };

  return (
    <div className="app-container font-body-md">
      {/* Top Navigation Bar */}
      <TopNavBar
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode((prev) => !prev)}
        onToggleHistory={() => setIsHistoryOpen((prev) => !prev)}
        onShowToast={showToast}
      />

      {/* Main Workspace Area (No scroll, 1366x768 optimized) */}
      <main className="main-workspace">
        <div className="center-canvas">
          {/* Hero Section */}
          <HeroSection />

          {/* Translation Interaction Area */}
          <section className="workspace-section animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <LanguageBar
              sourceLang={sourceLang}
              targetLang={targetLang}
              onSourceChange={handleSourceLangChange}
              onTargetChange={handleTargetLangChange}
              onSwap={handleSwapLanguages}
            />

            {/* Input/Output Bento Grid */}
            <div className="bento-grid">
              <SourceCard
                sourceText={sourceText}
                onSourceTextChange={setSourceText}
                onTranslate={() => handleTranslate(sourceLang, targetLang, sourceText)}
                onClear={() => {
                  setSourceText('');
                  setTranslatedText('');
                }}
                isTranslating={isTranslating}
                sourceLang={sourceLang}
                onShowToast={showToast}
              />

              <TargetCard
                translatedText={translatedText}
                isTranslating={isTranslating}
                targetLang={targetLang}
                isStarred={isCurrentStarred}
                onToggleStar={handleToggleCurrentStar}
                onShowToast={showToast}
              />
            </div>
          </section>
        </div>

        {/* Desktop History Sidebar (Smooth transition without unmounting) */}
        <HistorySidebar
          isOpen={isHistoryOpen || activeMobileTab === 'history' || activeMobileTab === 'starred'}
          onClose={() => {
            setIsHistoryOpen(false);
            setActiveMobileTab('translate');
          }}
          history={history}
          onSelectHistoryItem={handleSelectHistoryItem}
          onToggleStarItem={handleToggleStarItem}
          onDeleteItem={handleDeleteItem}
          onClearAll={handleClearAllHistory}
          onShowToast={showToast}
        />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNavBar
        activeTab={activeMobileTab}
        onSelectTab={setActiveMobileTab}
        onToggleHistory={() => setIsHistoryOpen((prev) => !prev)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-popup">
          <span className="material-symbols-outlined text-[20px] text-primary">info</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
