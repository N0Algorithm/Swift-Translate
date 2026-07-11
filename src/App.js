import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './App.css';
import { translate } from 'google-translate-api-browser';
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
    sourceText: 'Modern technology is transforming global communications.',
    translatedText: 'La technologie moderne transforme les communications mondiales.',
    timestamp: Date.now() - 7200000,
    isStarred: false
  }
];

function App() {
  // ==========================================================================
  // 1. STATE MANAGEMENT
  // ==========================================================================

  // Request Sequence Tracker: Prevents race conditions when switching/swapping languages
  const requestIdRef = useRef(0);

  // Theme State: Defaults to Dark Mode per user preference. Saved in localStorage.
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('swift_translate_theme');
    return saved ? saved === 'dark' : true;
  });

  // Voice Speed State: Controls speech pronunciation rate (Normal, Slow, Slower).
  const [voiceSpeed, setVoiceSpeed] = useState(() => {
    return localStorage.getItem('swift_translate_voice_speed') || 'Normal';
  });

  // Translation State: Stores the current languages, input text, and translated output.
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  // UI & Drawer State: Controls whether the history sidebar is visible.
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState('translate');

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

  // Whenever voiceSpeed changes, save to localStorage
  useEffect(() => {
    localStorage.setItem('swift_translate_voice_speed', voiceSpeed);
  }, [voiceSpeed]);

  // Whenever history changes, save the updated array to localStorage
  useEffect(() => {
    localStorage.setItem('swift_translate_history', JSON.stringify(history));
  }, [history]);

  // ==========================================================================
  // 3. CORE TRANSLATION LOGIC
  // ==========================================================================

  /**
   * Fetches translation using the Google Translate API (via google-translate-api-browser).
   * Accepts optional language and text overrides for instant translation when dropdowns change.
   */
  const handleTranslate = useCallback(async (
    overrideSourceLang = sourceLang,
    overrideTargetLang = targetLang,
    overrideText = sourceText
  ) => {
    if (!overrideText.trim()) return;

    const currentRequestId = ++requestIdRef.current;
    setIsTranslating(true);
    setTranslatedText('');

    let result = '';
    try {
      // 1. Fetch translation directly from Google Translate via CORS proxy
      const res = await translate(overrideText, {
        from: overrideSourceLang === 'auto' ? undefined : overrideSourceLang,
        to: overrideTargetLang,
        corsUrl: 'https://corsproxy.io/?'
      });

      if (!res || !res.text) {
        throw new Error('No translation returned from Google Translate API');
      }

      result = res.text;
    } catch (err) {
      console.warn('Google Translate API via corsproxy failed, trying secondary API:', err);
      
      try {
        // 2. Secondary Fallback: MyMemory Neural Translation API
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          overrideText
        )}&langpair=${overrideSourceLang}|${overrideTargetLang}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data && data.responseData && data.responseData.translatedText) {
          result = data.responseData.translatedText;
        } else {
          throw new Error('No translation returned from fallback API');
        }
      } catch (fallbackErr) {
        console.warn('All translation APIs failed or offline, using simulated fallback:', fallbackErr);
        
        // 3. Intelligent Offline Fallback: If network drops or proxies fail,
        // simulate translation so the app never crashes or freezes.
        const targetLangName =
          LANGUAGES.find((l) => l.code === overrideTargetLang)?.name || overrideTargetLang;
        
        result = `[${targetLangName}] ${overrideText}`;
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsTranslating(false);
      }
    }

    // Abort state updates if a newer request has started (prevents race condition mismatches)
    if (currentRequestId !== requestIdRef.current) return;

    // Update UI output
    setTranslatedText(result);

    // Add translation to the top of the history list (keep max 50 items)
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
  }, [sourceLang, targetLang, sourceText]);

  // ==========================================================================
  // 4. INSTANT LANGUAGE CHANGERS & SWAP
  // ==========================================================================

  // When user changes the source language dropdown, update state and translate instantly
  const handleSourceLangChange = useCallback((newLang) => {
    setSourceLang(newLang);
    if (sourceText.trim()) {
      handleTranslate(newLang, targetLang, sourceText);
    }
  }, [sourceText, targetLang, handleTranslate]);

  // When user changes the target language dropdown, update state and translate instantly
  const handleTargetLangChange = useCallback((newLang) => {
    setTargetLang(newLang);
    if (sourceText.trim()) {
      handleTranslate(sourceLang, newLang, sourceText);
    }
  }, [sourceText, sourceLang, handleTranslate]);

  // Swap source and target languages, flip the text boxes, and translate instantly
  const handleSwapLanguages = useCallback(() => {
    const newSourceLang = targetLang;
    const newTargetLang = sourceLang;
    const newSourceText = translatedText || sourceText;
    
    setSourceLang(newSourceLang);
    setTargetLang(newTargetLang);
    setSourceText(newSourceText);
    setTranslatedText(sourceText);
    
    if (newSourceText.trim()) {
      handleTranslate(newSourceLang, newTargetLang, newSourceText);
    }
  }, [targetLang, sourceLang, translatedText, sourceText, handleTranslate]);

  // ==========================================================================
  // 5. HISTORY & SAVED PIN HANDLERS
  // ==========================================================================

  // Load a previously saved translation back into the main workspace
  const handleSelectHistoryItem = useCallback((item) => {
    setSourceLang(item.sourceLang);
    setTargetLang(item.targetLang);
    setSourceText(item.sourceText);
    setTranslatedText(item.translatedText);
    
    // Close sidebar automatically on mobile/tablets for a cleaner experience
    if (window.innerWidth < 1024) {
      setIsHistoryOpen(false);
      setActiveMobileTab('translate');
    }
  }, []);

  // Toggle the star/pin status of a history item
  const handleToggleStarItem = useCallback((id) => {
    setHistory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isStarred: !item.isStarred } : item
      )
    );
  }, []);

  // Delete a single item from history
  const handleDeleteItem = useCallback((id) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Clear all history after asking for confirmation
  const handleClearAllHistory = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all translation history?')) {
      setHistory([]);
    }
  }, []);

  // Check if the currently displayed translation is already starred in history
  const currentHistoryItem = useMemo(() => {
    return history.find(
      (item) =>
        item.sourceText === sourceText &&
        item.translatedText === translatedText &&
        translatedText !== ''
    );
  }, [history, sourceText, translatedText]);
  const isCurrentStarred = currentHistoryItem ? currentHistoryItem.isStarred : false;

  // Star or unstar the translation currently displayed on screen
  const handleToggleCurrentStar = useCallback(() => {
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
    }
  }, [translatedText, currentHistoryItem, handleToggleStarItem, sourceLang, targetLang, sourceText]);

  // ==========================================================================
  // 6. APPLICATION RENDER
  // ==========================================================================

  return (
    <div className="app-container font-body-md">
      {/* Top Navigation Bar (Logo, History Toggle, Theme Switcher, Settings Popup) */}
      <TopNavBar
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode((prev) => !prev)}
        onToggleHistory={() => setIsHistoryOpen((prev) => !prev)}
        voiceSpeed={voiceSpeed}
        onSelectVoiceSpeed={(speed) => setVoiceSpeed(speed)}
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
              />

              <TargetCard
                translatedText={translatedText}
                isTranslating={isTranslating}
                targetLang={targetLang}
                isStarred={isCurrentStarred}
                onToggleStar={handleToggleCurrentStar}
                voiceSpeed={voiceSpeed}
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
        />
      </main>

      {/* Mobile-Only Bottom Tab Navigation */}
      <BottomNavBar
        activeTab={activeMobileTab}
        onSelectTab={setActiveMobileTab}
        onToggleHistory={() => setIsHistoryOpen((prev) => !prev)}
      />
    </div>
  );
}

export default App;
