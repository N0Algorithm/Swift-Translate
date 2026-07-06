import React from 'react';

const TopNavBar = ({
  isDarkMode,
  onToggleTheme,
  onToggleHistory,
  onShowToast
}) => {
  const logoUrl =
    'https://lh3.googleusercontent.com/aida/AP1WRLsEGNSUWlPHD-E5zMl3MJpSS8N4jUm_jGsx1hIwTbfMNW4741PaH2v4EwPQl2Z6A66sm06dBdQpCrC8OgLGSYtgPGjw27dryRWNzOGfQwa23BSN-v2n6SKAQJ1QbHNRfuF7mg8OUxjqri0OohgWlJNZfnTvzLRge2D9_J5Dd8TvRnUDUHpMxa94V4XltP_DMYX9__VsTzr29n-Riq_FmiNaEkDiOyKQJl--V2SReq7zzCyiGOpmF83DZ88';

  const avatarUrl =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDA-17f3oJp2kaMrQv1ci3Ax6mOAlm3xsCQjqR5xQc3ZfyUWQxDyZH-573ufbPscy4_450PqftfCVo_WS7gRI9mxoKjtxD0dQ7PQU9qDtkAaxwUvwdI75j-SRlBZvfBDG4RlgA2--O1NwvzFlhHqY8AmCN3HpJsLLHshZnDtveOscKHsgtA1wfFf_b6BeMhGw_QVdTrQcn2M3Lqd5qfygblO7sduoPtREy5DpSxjxh3cQJTOOo2QKsMH772OYkZeSfyF0Lcwcz_JoU';

  return (
    <header className="top-navbar glass-panel">
      <div className="navbar-container">
        {/* Brand Logo & Name */}
        <div className="navbar-brand">
          <img
            src={logoUrl}
            alt="Translate Logo"
            className="brand-logo"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <span className="brand-title font-headline-md">Swift Translate</span>
        </div>

        {/* Actions Toolbar */}
        <div className="navbar-actions">
          <button
            className="icon-btn hidden-on-mobile"
            onClick={onToggleHistory}
            title="History & Saved"
            aria-label="Toggle History"
          >
            <span className="material-symbols-outlined">history</span>
          </button>

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

          <div className="navbar-divider"></div>

          {/* User Profile Avatar */}
          <button
            className="user-avatar-btn"
            onClick={() => onShowToast('Signed in as Pro User')}
            title="User Profile"
          >
            <img
              src={avatarUrl}
              alt="User Avatar"
              className="user-avatar"
              onError={(e) => {
                e.target.src = 'https://ui-avatars.com/api/?name=Pro+User&background=2563eb&color=fff';
              }}
            />
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopNavBar;
