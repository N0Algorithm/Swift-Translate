import React, { useState, useEffect } from 'react';
import './App.css';
import TopNavBar from './components/TopNavBar';
import HeroSection from './components/HeroSection';
import LanguageBar, { LANGUAGES } from './components/LanguageBar';
import SourceCard from './components/SourceCard';
import TargetCard from './components/TargetCard';
import HistorySidebar from './components/HistorySidebar';
import BottomNavBar from './components/BottomNavBar';

// Default demonstration history shown when a user first opens the app
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
  // ==========================================================================
  // 1. STATE MANAGEMENT
  // ==========================================================================

  // Theme State: Defaults to Dark Mode per user preference. Saved in localStorage.
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('swift_translate_theme');
    return saved ? saved === 'dark' : true;
  });

  // Translation State: Stores the current languages, input text, and AI output.
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  // UI & Drawer State: Controls whether the history sidebar and toast notifications are visible.
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState('translate');
  const [toastMessage, setToastMessage] = useState(null);

  // History State: Stores recent translations and pinned items. Loaded from localStorage.
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('swift_translate_history');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return INITIAL_HISTORY; }
    }
    return INITIAL_HISTORY;
  });

  // ==========================================================================
  // 2. SIDE EFFECTS (LOCAL STORAGE & THEME SYNC)
  // ==========================================================================

  // Whenever isDarkMode changes, update the <html class="dark"> tag and save to localStorage
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('swift_translate_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('swift_translate_theme', 'light');
    }
  }, [isDarkMode]);

  // Whenever history changes, save the updated array to localStorage
  useEffect(() => {
    localStorage.setItem('swift_translate_history', JSON.stringify(history));
  }, [history]);

  // Helper function to show a temporary popup message at the bottom of the screen
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  // ==========================================================================
  // 3. CORE TRANSLATION LOGIC
  // ==========================================================================

  /**
   * Fetches translation from the MyMemory API.
   * Accepts optional language and text overrides so we can translate instantly
   * when the user selects a new dropdown option or clicks the Swap button.
   */
  const handleTranslate = async (
    overrideSourceLang = sourceLang,
    overrideTargetLang = targetLang,
    overrideText = sourceText
  ) => {
    if (!overrideText.trim()) return;

    setIsTranslating(true);
    setTranslatedText('');

    try {
      // Call the live MyMemory Translation API
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

      // Add successful translation to the top of the history list (keep max 50 items)
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
      
      // Intelligent Offline Fallback: If network drops or API rate limit is hit,
      // simulate translation so the app never crashes or freezes.
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

  // ==========================================================================
  // 4. INSTANT LANGUAGE CHANGERS & SWAP
  // ==========================================================================

  // When user changes the source language dropdown, update state and translate instantly
  const handleSourceLangChange = (newLang) => {
    setSourceLang(newLang);
    if (sourceText.trim()) {
      handleTranslate(newLang, targetLang, sourceText);
    }
  };

  // When user changes the target language dropdown, update state and translate instantly
  const handleTargetLangChange = (newLang) => {
    setTargetLang(newLang);
    if (sourceText.trim()) {
      handleTranslate(sourceLang, newLang, sourceText);
    }
  };

  // Swap source and target languages, flip the text boxes, and translate instantly
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

  // ==========================================================================
  // 5. HISTORY & SAVED PIN HANDLERS
  // ==========================================================================

  // Load a previously saved translation back into the main workspace
  const handleSelectHistoryItem = (item) => {
    setSourceLang(item.sourceLang);
    setTargetLang(item.targetLang);
    setSourceText(item.sourceText);
    setTranslatedText(item.translatedText);
    
    // Close sidebar automatically on mobile/tablets for a cleaner experience
    if (window.innerWidth < 1024) {
      setIsHistoryOpen(false);
      setActiveMobileTab('translate');
    }
  };

  // Toggle the star/pin status of a history item
  const handleToggleStarItem = (id) => {
    setHistory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isStarred: !item.isStarred } : item
      )
    );
    showToast('Updated Pinned translations');
  };

  // Delete a single item from history
  const handleDeleteItem = (id) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    showToast('Removed translation from history');
  };

  // Clear all history after asking for confirmation
  const handleClearAllHistory = () => {
    if (window.confirm('Are you sure you want to clear all translation history?')) {
      setHistory([]);
      showToast('Cleared all history');
    }
  };

  // Check if the currently displayed translation is already starred in history
  const currentHistoryItem = history.find(
    (item) =>
      item.sourceText === sourceText &&
      item.translatedText === translatedText &&
      translatedText !== ''
  );
  const isCurrentStarred = currentHistoryItem ? currentHistoryItem.isStarred : false;

  // Star or unstar the translation currently displayed on screen
  const handleToggleCurrentStar = () => {
    if (!translatedText) return;
    if (currentHistoryItem) {
      handleToggleStarItem(currentHistoryItem.id);
    } else {
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

  // ==========================================================================
  // 6. APPLICATION RENDER
  // ==========================================================================

  return (
    <div className="app-container font-body-md">
      {/* Top Navigation Bar (Logo, History Toggle, Theme Switcher) */}
      <TopNavBar
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode((prev) => !prev)}
        onToggleHistory={() => setIsHistoryOpen((prev) => !prev)}
        onShowToast={showToast}
      />

      {/* Main Workspace Area (1366x768 zero-scroll desktop layout) */}
      <main className="main-workspace">
        <div className="center-canvas">
          <HeroSection />

          <section className="workspace-section animate-fade-in" style={{ animationDelay: '0.15s' }}>
            {/* Language Selection Dropdowns & Swap Button */}
            <LanguageBar
              sourceLang={sourceLang}
              targetLang={targetLang}
              onSourceChange={handleSourceLangChange}
              onTargetChange={handleTargetLangChange}
              onSwap={handleSwapLanguages}
            />

            {/* Input (Source) and Output (Target) Bento Grid Cards */}
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

        {/* Slide-In History & Pinned Drawer */}
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

      {/* Mobile-Only Bottom Tab Navigation */}
      <BottomNavBar
        activeTab={activeMobileTab}
        onSelectTab={setActiveMobileTab}
        onToggleHistory={() => setIsHistoryOpen((prev) => !prev)}
      />

      {/* Temporary Toast Popup Notification */}
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
