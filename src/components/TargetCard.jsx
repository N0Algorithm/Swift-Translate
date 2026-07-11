import React, { useState } from 'react';

const TargetCard = ({
  translatedText,
  isTranslating,
  targetLang,
  isStarred,
  onToggleStar,
  voiceSpeed = 'Normal'
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!translatedText) return;
    try {
      await navigator.clipboard.writeText(translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleSpeak = () => {
    if (!translatedText) return;
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(translatedText);
    utterance.lang = targetLang;

    // Map voice speed setting to Web Speech API rate
    const rateMap = {
      'Normal': 1.0,
      'Slow': 0.8,
      'Slower': 0.6
    };
    utterance.rate = rateMap[voiceSpeed] || 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleShare = async () => {
    if (!translatedText) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Translation',
          text: translatedText
        });
      } catch (err) {
        if (err && err.name !== 'AbortError') {
          console.warn('Share failed:', err);
        }
      }
    } else {
      handleCopy();
    }
  };

  const hasContent = Boolean(translatedText && !isTranslating);

  return (
    <div className="bento-card target-card glass-panel">
      <div className="card-content">
        {isTranslating ? (
          /* Dynamic Loading Animation in Target Text-Area */
          <div className="translation-loading animate-fade-in">
            <div className="loading-spinner-row">
              <div className="spinner-ring"></div>
              <span className="loading-label font-label-md">Translating...</span>
            </div>
            <div className="skeleton-container w-full">
              <div className="skeleton-shimmer skeleton-line w-full h-6 mb-3"></div>
              <div className="skeleton-shimmer skeleton-line w-11/12 h-6 mb-3"></div>
              <div className="skeleton-shimmer skeleton-line w-4/5 h-6 mb-3"></div>
              <div className="skeleton-shimmer skeleton-line w-1/2 h-6"></div>
            </div>
          </div>
        ) : translatedText ? (
          /* Translated Content */
          <div className="output-content font-headline-md animate-fade-in">
            {translatedText}
          </div>
        ) : (
          /* Empty State Placeholder */
          <div className="output-placeholder font-headline-md">
            Translation appears here...
          </div>
        )}
      </div>

      {/* Bottom Toolbar */}
      <div className={`card-toolbar ${!hasContent ? 'toolbar-disabled' : ''}`}>
        <div className="toolbar-left">
          <button
            onClick={handleCopy}
            disabled={!hasContent}
            className={`icon-btn ${copied ? 'text-primary' : ''}`}
            title="Copy translation"
            aria-label="Copy translation"
          >
            <span className="material-symbols-outlined">
              {copied ? 'check' : 'content_copy'}
            </span>
          </button>

          <button
            onClick={handleSpeak}
            disabled={!hasContent}
            className={`icon-btn ${isSpeaking ? 'active animate-pulse' : ''}`}
            title={`Listen to translation (${voiceSpeed} speed)`}
            aria-label="Listen to translation"
          >
            <span className={`material-symbols-outlined ${isSpeaking ? 'filled' : ''}`}>
              {isSpeaking ? 'stop' : 'volume_up'}
            </span>
          </button>
        </div>

        <div className="toolbar-right">
          <button
            onClick={handleShare}
            disabled={!hasContent}
            className="icon-btn"
            title="Share translation"
            aria-label="Share translation"
          >
            <span className="material-symbols-outlined">share</span>
          </button>

          <button
            onClick={onToggleStar}
            disabled={!hasContent}
            className={`icon-btn star-btn ${isStarred ? 'starred' : ''}`}
            title={isStarred ? 'Remove from Pinned' : 'Pin translation'}
            aria-label="Pin translation"
          >
            <span className={`material-symbols-outlined ${isStarred ? 'filled' : ''}`}>
              star
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

const MemoizedTargetCard = React.memo(TargetCard);
export default MemoizedTargetCard;
