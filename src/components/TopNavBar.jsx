import React, { useState } from 'react';

const TopNavBar = ({
  isDarkMode,
  onToggleTheme,
  onToggleHistory,
  voiceSpeed,
  onSelectVoiceSpeed
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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
                    Voice Settings
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
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default React.memo(TopNavBar);
