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
  const requestIdRef = useRef(0);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('swift_translate_theme');
    return saved ? saved === 'dark' : true;
  });

  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    return (
      localStorage.getItem('swift_translate_gemini_api_key') ||
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
      ''
    );
  });

  const [detectedLang, setDetectedLang] = useState('');
  const [voiceSpeed, setVoiceSpeed] = useState(() => {
    return localStorage.getItem('swift_translate_voice_speed') || 'Normal';
  });

  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('es');
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState('translate');

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('swift_translate_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_HISTORY;
      }
    }
    return INITIAL_HISTORY;
  });

  useEffect(() => {
    localStorage.setItem('swift_translate_gemini_api_key', geminiApiKey);
  }, [geminiApiKey]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('swift_translate_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('swift_translate_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('swift_translate_voice_speed', voiceSpeed);
  }, [voiceSpeed]);

  useEffect(() => {
    localStorage.setItem('swift_translate_history', JSON.stringify(history));
  }, [history]);

  const handleTranslate = useCallback(
    async (
      overrideSourceLang = sourceLang,
      overrideTargetLang = targetLang,
      overrideText = sourceText
    ) => {
      if (!overrideText.trim()) return;

      const currentRequestId = ++requestIdRef.current;
      setIsTranslating(true);
      setTranslatedText('');
      setDetectedLang('');

      let result = '';
      let detected = '';

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
        } else {
          throw new Error('No API key provided, falling back');
        }
      } catch {
        try {
          const res = await translate(overrideText, {
            from: overrideSourceLang === 'auto' ? undefined : overrideSourceLang,
            to: overrideTargetLang,
            corsUrl: 'https://corsproxy.io/?'
          });

          if (!res || !res.text) {
            throw new Error('Google Translate failed');
          }

          result = res.text;
          if (res.from?.language?.iso) {
            detected = res.from.language.iso;
          }
        } catch {
          try {
            const sourcePair =
              overrideSourceLang === 'auto'
                ? overrideTargetLang === 'en'
                  ? 'es'
                  : 'en'
                : overrideSourceLang;

            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
              overrideText
            )}&langpair=${sourcePair}|${overrideTargetLang}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data?.responseData?.translatedText) {
              result = data.responseData.translatedText;
            } else {
              throw new Error('Fallback failed');
            }
          } catch {
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

      if (currentRequestId !== requestIdRef.current) return;

      setTranslatedText(result);
      if (detected) {
        setDetectedLang(detected);
      }

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
    },
    [sourceLang, targetLang, sourceText, geminiApiKey]
  );

  const handleSourceLangChange = useCallback(
    (newLang) => {
      setSourceLang(newLang);
      setDetectedLang('');
      if (sourceText.trim()) {
        handleTranslate(newLang, targetLang, sourceText);
      }
    },
    [sourceText, targetLang, handleTranslate]
  );

  const handleTargetLangChange = useCallback(
    (newLang) => {
      setTargetLang(newLang);
      if (sourceText.trim()) {
        handleTranslate(sourceLang, newLang, sourceText);
      }
    },
    [sourceText, sourceLang, handleTranslate]
  );

  const handleSwapLanguages = useCallback(() => {
    const newSourceLang = targetLang;
    const newTargetLang = sourceLang === 'auto' && detectedLang ? detectedLang : sourceLang;
    const newSourceText = translatedText || sourceText;

    setSourceLang(newSourceLang);
    setTargetLang(newTargetLang);
    setSourceText(newSourceText);
    setTranslatedText(sourceText);
    setDetectedLang('');

    if (newSourceText.trim()) {
      handleTranslate(newSourceLang, newTargetLang, newSourceText);
    }
  }, [targetLang, sourceLang, detectedLang, translatedText, sourceText, handleTranslate]);

  const handleSelectHistoryItem = useCallback((item) => {
    setSourceLang(item.sourceLang);
    setTargetLang(item.targetLang);
    setSourceText(item.sourceText);
    setTranslatedText(item.translatedText);

    if (window.innerWidth < 1024) {
      setIsHistoryOpen(false);
      setActiveMobileTab('translate');
    }
  }, []);

  const handleToggleStarItem = useCallback((id) => {
    setHistory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isStarred: !item.isStarred } : item
      )
    );
  }, []);

  const handleDeleteItem = useCallback((id) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleClearAllHistory = useCallback(() => {
    if (window.confirm('Clear all translation history?')) {
      setHistory([]);
    }
  }, []);

  const currentHistoryItem = useMemo(() => {
    return history.find(
      (item) =>
        item.sourceText === sourceText &&
        item.translatedText === translatedText &&
        translatedText !== ''
    );
  }, [history, sourceText, translatedText]);

  const isCurrentStarred = currentHistoryItem ? currentHistoryItem.isStarred : false;

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

  return (
    <div className="app-container font-body-md">
      <TopNavBar
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode((prev) => !prev)}
        onToggleHistory={() => setIsHistoryOpen((prev) => !prev)}
        voiceSpeed={voiceSpeed}
        onSelectVoiceSpeed={(speed) => setVoiceSpeed(speed)}
        geminiApiKey={geminiApiKey}
        onChangeGeminiApiKey={setGeminiApiKey}
      />

      <main className="main-workspace">
        <div className="center-canvas">
          <HeroSection />

          <section className="workspace-section animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <LanguageBar
              sourceLang={sourceLang}
              targetLang={targetLang}
              onSourceChange={handleSourceLangChange}
              onTargetChange={handleTargetLangChange}
              onSwap={handleSwapLanguages}
              detectedLang={detectedLang}
            />

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

      <BottomNavBar
        activeTab={activeMobileTab}
        onSelectTab={setActiveMobileTab}
        onToggleHistory={() => setIsHistoryOpen((prev) => !prev)}
      />
    </div>
  );
}

export default App;
