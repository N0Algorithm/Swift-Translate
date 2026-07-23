import React, { useState } from 'react';

const TopNavBar = ({
  isDarkMode,
  onToggleTheme,
  onToggleHistory,
  voiceSpeed,
  onSelectVoiceSpeed,
  geminiApiKey,
  onChangeGeminiApiKey
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const logoUrl = '/translate.jpg';

  return (
    <header className="top-navbar glass-panel">
      <div className="navbar-container">
        {/* Brand Logo & Name */}
        <div className="navbar-brand">
          <img
            src={logoUrl}
            alt="Swift Translate Logo"
            className="brand-logo"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <span className="brand-title font-headline-md">Swift Translate</span>
        </div>

        {/* Actions Toolbar: History -> Theme -> Settings */}
        <div className="navbar-actions">
          {/* 1. History Button */}
          <button
            className="icon-btn hidden-on-mobile"
            onClick={onToggleHistory}
            title="History & Saved"
            aria-label="Toggle History"
          >
            <span className="material-symbols-outlined">history</span>
          </button>

          {/* 2. Light/Dark Mode Button */}
          <button
            className="icon-btn"
            onClick={onToggleTheme}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            <span className="material-symbols-outlined">
              {isDarkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* 3. Settings Button & Side Pop-up Box */}
          <div style={{ position: 'relative' }}>
            <button
              className={`icon-btn ${isSettingsOpen ? 'active' : ''}`}
              onClick={() => setIsSettingsOpen((prev) => !prev)}
              title="Settings"
              aria-label="Toggle Settings"
            >
              <span className="material-symbols-outlined">settings</span>
            </button>

            {/* Side Pop-up Box for Voice Settings */}
            {isSettingsOpen && (
              <div className="settings-popup glass-panel animate-fade-in">
                <div className="settings-header">
                  <span className="font-label-md uppercase text-primary font-bold">
                    Settings
                  </span>
                  <button
                    className="icon-btn"
                    style={{ padding: '2px' }}
                    onClick={() => setIsSettingsOpen(false)}
                    title="Close settings"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>

                <div className="settings-body">
                  <label className="font-body-sm font-semibold mb-2 block text-on-surface">
                    Voice Speed
                  </label>
                  <div className="speed-options">
                    {['Normal', 'Slow', 'Slower'].map((speed) => (
                      <button
                        key={speed}
                        className={`speed-option-btn ${
                          voiceSpeed === speed ? 'selected' : ''
                        }`}
                        onClick={() => {
                          onSelectVoiceSpeed(speed);
                          setIsSettingsOpen(false);
                        }}
                      >
                        <span>{speed}</span>
                        {voiceSpeed === speed && (
                          <span className="material-symbols-outlined text-[16px]">
                            check
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Gemini API Key Configuration Section */}
                  <div className="settings-input-group">
                    <label className="font-body-sm font-semibold mb-2 block text-on-surface">
                      Gemini API Key
                    </label>
                    <div className="settings-input-wrapper">
                      <input
                        type={showKey ? 'text' : 'password'}
                        value={geminiApiKey}
                        onChange={(e) => onChangeGeminiApiKey(e.target.value)}
                        placeholder="Enter API Key..."
                        className="settings-input font-body-sm"
                        title="Your API key is stored locally in your browser."
                      />
                      <button
                        type="button"
                        className="settings-input-icon-btn"
                        onClick={() => setShowKey((prev) => !prev)}
                        title={showKey ? 'Hide key' : 'Show key'}
                        aria-label={showKey ? 'Hide Gemini API Key' : 'Show Gemini API Key'}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showKey ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                    <p className="settings-help-text">
                      Required for high-fidelity LLM translation. Falls back to proxy scraper if blank.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

const MemoizedTopNavBar = React.memo(TopNavBar);
export default MemoizedTopNavBar;
