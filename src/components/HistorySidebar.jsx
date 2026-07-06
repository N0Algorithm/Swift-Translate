import React, { useState } from 'react';
import { LANGUAGES } from './LanguageBar';

const HistorySidebar = ({
  isOpen,
  onClose,
  history,
  onSelectHistoryItem,
  onToggleStarItem,
  onDeleteItem,
  onClearAll,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState('recent'); // 'recent' | 'pinned'

  const getLangName = (code) => {
    const found = LANGUAGES.find((l) => l.code === code);
    return found ? found.name : code.toUpperCase();
  };

  const displayedItems =
    activeTab === 'recent'
      ? history
      : history.filter((item) => item.isStarred);

  return (
    <aside className={`history-sidebar glass-panel ${isOpen ? 'open' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div>
          <h2 className="font-headline-md font-bold text-on-surface">History</h2>
          <p className="font-label-md text-on-surface-variant">Your recent translations</p>
        </div>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={onClearAll}
              className="clear-all-btn font-label-md"
              title="Clear all history"
            >
              Clear All
            </button>
          )}
          <button
            onClick={onClose}
            className="icon-btn close-sidebar-btn"
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="sidebar-tabs">
        <button
          onClick={() => setActiveTab('recent')}
          className={`tab-btn font-label-md ${activeTab === 'recent' ? 'active' : ''}`}
        >
          <span className="material-symbols-outlined text-[16px]">history</span>
          <span>Recent ({history.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('pinned')}
          className={`tab-btn font-label-md ${activeTab === 'pinned' ? 'active' : ''}`}
        >
          <span className="material-symbols-outlined text-[16px]">push_pin</span>
          <span>Pinned ({history.filter((i) => i.isStarred).length})</span>
        </button>
      </div>

      {/* List Area */}
      <div className="sidebar-list">
        {displayedItems.length === 0 ? (
          <div className="empty-state animate-fade-in">
            <div className="empty-icon-circle">
              <span className="material-symbols-outlined">
                {activeTab === 'recent' ? 'history' : 'star'}
              </span>
            </div>
            <h3 className="font-headline-md text-[16px] font-bold text-on-surface mb-1">
              {activeTab === 'recent' ? 'No translations yet' : 'No pinned translations'}
            </h3>
            <p className="font-body-sm text-on-surface-variant max-w-[200px] mx-auto text-center">
              {activeTab === 'recent'
                ? 'Your recent translations will appear here.'
                : 'Star a translation to save it here.'}
            </p>
          </div>
        ) : (
          displayedItems.map((item) => (
            <div
              key={item.id}
              className="history-item glass-panel-low animate-fade-in"
              onClick={() => {
                onSelectHistoryItem(item);
                onShowToast('Loaded translation into workspace');
              }}
            >
              <div className="item-header">
                <span className="item-langs font-mono-label">
                  {getLangName(item.sourceLang)} → {getLangName(item.targetLang)}
                </span>
                <div className="item-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onToggleStarItem(item.id)}
                    className={`icon-btn item-star-btn ${item.isStarred ? 'starred' : ''}`}
                    title={item.isStarred ? 'Unpin' : 'Pin'}
                  >
                    <span className={`material-symbols-outlined text-[18px] ${item.isStarred ? 'filled' : ''}`}>
                      star
                    </span>
                  </button>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="icon-btn item-delete-btn"
                    title="Delete"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
              <p className="item-source font-body-sm text-on-surface line-clamp-1">
                {item.sourceText}
              </p>
              <p className="item-target font-body-sm text-primary line-clamp-2 font-medium">
                {item.translatedText}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Footer Links */}
      <div className="sidebar-footer">
        <button
          className="footer-link font-body-sm"
          onClick={() => onShowToast('Help center documentation coming soon!')}
        >
          <span className="material-symbols-outlined">help</span>
          <span>Help Center</span>
        </button>
        <button
          className="footer-link font-body-sm"
          onClick={() => onShowToast('Thank you! Please share your feedback.')}
        >
          <span className="material-symbols-outlined">feedback</span>
          <span>Send Feedback</span>
        </button>
      </div>
    </aside>
  );
};

export default HistorySidebar;
