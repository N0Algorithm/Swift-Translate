import React, { useState, useEffect } from 'react';

const SourceCard = ({
  sourceText,
  onSourceTextChange,
  onTranslate,
  onClear,
  isTranslating,
  sourceLang
}) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [copied, setCopied] = useState(false);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = true;
      
      recog.onstart = () => {
        setIsListening(true);
      };

      recog.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        onSourceTextChange(sourceText + ' ' + transcript);
      };

      recog.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      setRecognition(recog);
    }
  }, [sourceText, onSourceTextChange]);

  const toggleSpeechRecognition = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      recognition.lang = sourceLang;
      try {
        recognition.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  const handleCopySource = async () => {
    if (!sourceText) return;
    try {
      await navigator.clipboard.writeText(sourceText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (sourceText.trim() && !isTranslating) {
        onTranslate();
      }
    }
  };

  return (
    <div className="bento-card source-card glass-panel">
      <div className="card-content">
        <textarea
          value={sourceText}
          onChange={(e) => onSourceTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type, paste, or speak your text..."
          className="source-textarea font-headline-md"
          maxLength={5000}
          aria-label="Source text to translate"
        />
      </div>

      {/* Bottom Toolbar */}
      <div className="card-toolbar">
        <div className="toolbar-left">
          <button
            onClick={toggleSpeechRecognition}
            className={`icon-btn ${isListening ? 'listening active' : ''}`}
            title={isListening ? 'Stop listening' : 'Speak voice input'}
            aria-label="Voice input"
          >
            <span className={`material-symbols-outlined ${isListening ? 'filled animate-pulse' : ''}`}>
              mic
            </span>
          </button>

          <button
            onClick={handleCopySource}
            disabled={!sourceText}
            className={`icon-btn ${copied ? 'text-primary' : ''}`}
            title="Copy source text"
            aria-label="Copy source text"
          >
            <span className="material-symbols-outlined">
              {copied ? 'check' : 'content_copy'}
            </span>
          </button>

          {sourceText.length > 0 && (
            <button
              onClick={onClear}
              className="icon-btn clear-btn"
              title="Clear text"
              aria-label="Clear text"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        <div className="toolbar-right">
          <span className="char-counter font-mono-label">
            {sourceText.length} / 5000
          </span>
          <button
            onClick={onTranslate}
            disabled={!sourceText.trim() || isTranslating}
            className="btn-primary"
            aria-label="Translate text"
          >
            {isTranslating ? (
              <>
                <span className="material-symbols-outlined animate-spin">refresh</span>
                <span>Translating...</span>
              </>
            ) : (
              <>
                <span>Translate</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SourceCard;
