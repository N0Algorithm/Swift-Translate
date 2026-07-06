import React, { useState } from 'react';

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'ko', name: 'Korean' },
  { code: 'ru', name: 'Russian' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'nl', name: 'Dutch' },
  { code: 'tr', name: 'Turkish' },
  { code: 'vi', name: 'Vietnamese' }
];

const LanguageBar = ({ sourceLang, targetLang, onSourceChange, onTargetChange, onSwap }) => {
  const [isSwapping, setIsSwapping] = useState(false);

  const handleSwapClick = () => {
    setIsSwapping(true);
    onSwap();
    setTimeout(() => setIsSwapping(false), 300);
  };

  return (
    <div className="language-bar glass-panel-low">
      {/* Source Language Dropdown */}
      <div className="lang-select-wrapper">
        <select
          value={sourceLang}
          onChange={(e) => onSourceChange(e.target.value)}
          className="lang-select source-select font-label-md"
          aria-label="Select source language"
        >
          {LANGUAGES.map((lang) => (
            <option key={`src-${lang.code}`} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined select-icon">expand_more</span>
      </div>

      {/* Swap Button */}
      <button
        onClick={handleSwapClick}
        className={`swap-btn ${isSwapping ? 'swapping' : ''}`}
        title="Swap languages"
        aria-label="Swap languages"
      >
        <span className="material-symbols-outlined">sync_alt</span>
      </button>

      {/* Target Language Dropdown */}
      <div className="lang-select-wrapper">
        <select
          value={targetLang}
          onChange={(e) => onTargetChange(e.target.value)}
          className="lang-select target-select font-label-md"
          aria-label="Select target language"
        >
          {LANGUAGES.map((lang) => (
            <option key={`tgt-${lang.code}`} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined select-icon">expand_more</span>
      </div>
    </div>
  );
};

export default LanguageBar;
