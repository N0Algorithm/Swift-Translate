import React from 'react';

const BottomNavBar = ({
  activeTab,
  onSelectTab,
  onToggleHistory
}) => {
  return (
    <nav className="bottom-navbar glass-panel">
      <div className="bottom-nav-container">
        {/* Translate Tab */}
        <button
          onClick={() => onSelectTab('translate')}
          className={`nav-item ${activeTab === 'translate' ? 'active' : ''}`}
        >
          <span className="material-symbols-outlined filled">translate</span>
          <span className="font-label-md">Translate</span>
        </button>

        {/* History Tab */}
        <button
          onClick={() => {
            onSelectTab('history');
            onToggleHistory();
          }}
          className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
        >
          <span className="material-symbols-outlined">history</span>
          <span className="font-label-md">History</span>
        </button>

        {/* Starred Tab */}
        <button
          onClick={() => {
            onSelectTab('starred');
            onToggleHistory();
          }}
          className={`nav-item ${activeTab === 'starred' ? 'active' : ''}`}
        >
          <span className="material-symbols-outlined">star</span>
          <span className="font-label-md">Starred</span>
        </button>
      </div>
    </nav>
  );
};

export default React.memo(BottomNavBar);
