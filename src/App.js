import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './App.css';
import { translate } from 'google-translate-api-browser';
import { translateWithGemini } from './services/geminiService';
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

  // Gemini API Key State: Loaded from process.env or localStorage
  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    return localStorage.getItem('swift_translate_gemini_api_key') || process.env.REACT_APP_GEMINI_API_KEY || '';
  });

  // Track the detected language if sourceLang is 'auto'
  const [detectedLang, setDetectedLang] = useState('');

  // Voice Speed State: Controls speech pronunciation rate (Normal, Slow, Slower).
  const [voiceSpeed, setVoiceSpeed] = useState(() => {
    return localStorage.getItem('swift_translate_voice_speed') || 'Normal';
  });

  // Translation State: Stores the current languages, input text, and translated output.
  const [sourceLang, setSourceLang] = useState('auto'); // Default to Detect Language
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

  // Sync Gemini API Key to localStorage
  useEffect(() => {
    localStorage.setItem('swift_translate_gemini_api_key', geminiApiKey);
  }, [geminiApiKey]);

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
    setDetectedLang(''); // Reset detected language before translation

    let result = '';
    let detected = '';

    // If source language matches target language, return original text instantly
    if (overrideSourceLang !== 'auto' && overrideSourceLang === overrideTargetLang) {
      if (currentRequestId === requestIdRef.current) {
        setIsTranslating(false);
        setTranslatedText(overrideText);
      }
      
      const newItem = {
        id: `trans-${Date.now()}`,
        sourceLang: overrideSourceLang,
        targetLang: overrideTargetLang,
        sourceText: overrideText,
        translatedText: overrideText,
        timestamp: Date.now(),
        isStarred: false
      };
      setHistory((prev) => [newItem, ...prev.slice(0, 49)]);
      return;
    }

    try {
      if (geminiApiKey && geminiApiKey.trim()) {
        try {
          // 1. Primary Engine: Google Gemini LLM API
          const geminiRes = await translateWithGemini(
            overrideText,
            overrideSourceLang,
            overrideTargetLang,
            geminiApiKey
          );
          result = geminiRes.translatedText;
          if (geminiRes.detectedLanguage) {
            detected = geminiRes.detectedLanguage;
          }
        } catch (geminiErr) {
          console.warn('Gemini LLM API failed. Falling back to scraper APIs:', geminiErr);
          throw geminiErr;
        }
      } else {
        console.warn('No Gemini API Key provided. Using scraper API as fallback.');
        throw new Error('Gemini API key not configured');
      }
    } catch (primaryErr) {
      try {
        // 2. Secondary Scraper: google-translate-api-browser via CORS proxy
        const res = await translate(overrideText, {
          from: overrideSourceLang === 'auto' ? undefined : overrideSourceLang,
          to: overrideTargetLang,
          corsUrl: 'https://corsproxy.io/?'
        });

        if (!res || !res.text) {
          throw new Error('No translation returned from Google Translate API');
        }

        result = res.text;
        if (res.from && res.from.language && res.from.language.iso) {
          detected = res.from.language.iso;
        }
      } catch (err) {
        console.warn('Google Translate API via corsproxy failed, trying tertiary API:', err);
        
        try {
          // 3. Tertiary Fallback: MyMemory Neural Translation API
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
          
          // 4. Intelligent Offline Fallback
          const targetLangName =
            LANGUAGES.find((l) => l.code === overrideTargetLang)?.name || overrideTargetLang;
          
          result = `[${targetLangName}] ${overrideText}`;
        }
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
    if (detected) {
      setDetectedLang(detected);
    }

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
  }, [sourceLang, targetLang, sourceText, geminiApiKey]);

  // ==========================================================================
  // 4. INSTANT LANGUAGE CHANGERS & SWAP
  // ==========================================================================

  // When user changes the source language dropdown, update state and translate instantly
  const handleSourceLangChange = useCallback((newLang) => {
    setSourceLang(newLang);
    setDetectedLang(''); // Reset detected language on manual source change
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
    const newTargetLang = sourceLang === 'auto' && detectedLang ? detectedLang : sourceLang;
    const newSourceText = translatedText || sourceText;
    
    setSourceLang(newSourceLang);
    setTargetLang(newTargetLang);
    setSourceText(newSourceText);
    setTranslatedText(sourceText);
    setDetectedLang(''); // Reset detected language on swap
    
    if (newSourceText.trim()) {
      handleTranslate(newSourceLang, newTargetLang, newSourceText);
    }
  }, [targetLang, sourceLang, detectedLang, translatedText, sourceText, handleTranslate]);

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
        geminiApiKey={geminiApiKey}
        onChangeGeminiApiKey={setGeminiApiKey}
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
              detectedLang={detectedLang}
            />

            {/* Input (Source) and Output (Target) Bento Grid Cards */}
            <div className="bento-grid">
              <SourceCard
                sourceText={sourceText}
                onSourceTextChange={(text) => {
                  setSourceText(text);
                  if (!text.trim()) {
                    setTranslatedText('');
                    setDetectedLang('');
                  }
                }}
                onTranslate={() => handleTranslate(sourceLang, targetLang, sourceText)}
                onClear={() => {
                  setSourceText('');
                  setTranslatedText('');
                  setDetectedLang('');
                }}
                isTranslating={isTranslating}
                sourceLang={sourceLang === 'auto' ? (detectedLang || 'en') : sourceLang}
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
