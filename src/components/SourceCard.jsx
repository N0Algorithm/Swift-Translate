import React, { useState, useEffect } from 'react';

const SourceCard = ({
  sourceText,
  onSourceTextChange,
  onTranslate,
  onClear,
  isTranslating,
  sourceLang,
  onShowToast
}) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = true;
      
      recog.onstart = () => {
        setIsListening(true);
        onShowToast('Listening... Speak into your microphone');
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
        onShowToast(`Speech error: ${event.error}`);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      setRecognition(recog);
    }
  }, [sourceText, onSourceTextChange, onShowToast]);

  const toggleSpeechRecognition = () => {
    if (!recognition) {
      onShowToast('Speech recognition is not supported in this browser.');
      return;
    }

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

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onSourceTextChange(sourceText + (sourceText ? ' ' : '') + text);
        onShowToast('Pasted from clipboard');
      }
    } catch (err) {
      onShowToast('Please grant clipboard access to paste text');
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
            onClick={handlePaste}
            className="icon-btn"
            title="Paste from clipboard"
            aria-label="Paste text"
          >
            <span className="material-symbols-outlined">content_paste</span>
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
