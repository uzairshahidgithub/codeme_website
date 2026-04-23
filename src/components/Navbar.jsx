import React, { useState, useRef, useEffect } from 'react';

const Navbar = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('signup');
  const searchInputRef = useRef(null);
  const signupRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (signupRef.current && !signupRef.current.contains(e.target)) {
        setSignupOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="navbar" id="navbar">
      {/* Left — Logo */}
      <div className="navbar__left">
        <svg 
          className="navbar__logo" 
          width="33.3" 
          height="32.9" 
          viewBox="0 0 34 33" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="33.3" height="32.9" rx="8" fill="#2563FF"/>
          <path d="M15 11L10 16.5L15 22M19 11L24 16.5L19 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="navbar__brand">Codemo</span>
      </div>

      {/* Right — Nav Links + Search + Sign Up */}
      <div className="navbar__right">
        {/* Nav Links */}
        <div className="navbar__center">
          <a href="#join" className="navbar__link" id="nav-join">Join Us</a>
          <a href="#donate" className="navbar__link" id="nav-donate">Donate</a>
          <a href="#contact" className="navbar__link" id="nav-contact">Contact</a>
        </div>

        {/* Search */}
        <div className="navbar__search-wrapper" ref={searchRef}>
          {!searchOpen ? (
            <button
              className="navbar__search-btn"
              id="search-toggle"
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b0b0b0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
          ) : (
            <div className="navbar__search-expanded">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search"
                id="search-input"
                onKeyDown={(e) => { if (e.key === 'Escape') setSearchOpen(false); }}
              />
              <div onClick={() => setSearchOpen(false)} style={{ cursor: 'pointer' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b0b0b0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Sign Up */}
        <div className="navbar__signup-wrapper" ref={signupRef}>
          <button
            className="navbar__signup-btn"
            id="signup-toggle"
            onClick={() => setSignupOpen(!signupOpen)}
          >
            <span>Sign Up</span>
            <div className="navbar__signup-avatar">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b0b0b0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
          </button>

          {signupOpen && (
            <div className="navbar__signup-dropdown" id="signup-dropdown">
              <div className="navbar__signup-tabs">
                <button
                  className={`navbar__signup-tab ${activeTab === 'signup' ? 'navbar__signup-tab--active' : ''}`}
                  onClick={() => setActiveTab('signup')}
                  id="tab-signup"
                >Sign up</button>
                <button
                  className={`navbar__signup-tab ${activeTab === 'login' ? 'navbar__signup-tab--active' : ''}`}
                  onClick={() => setActiveTab('login')}
                  id="tab-login"
                >Login</button>
              </div>
              <div className="navbar__signup-divider">
                <div className="navbar__signup-divider-line" />
                <span className="navbar__signup-divider-text">or Continue via</span>
                <div className="navbar__signup-divider-line" />
              </div>
              <div className="navbar__signup-socials">
                <button className="navbar__signup-social" id="auth-google" aria-label="Google sign in">
                  <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                </button>
                <button className="navbar__signup-social" id="auth-apple" aria-label="Apple sign in">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                </button>
                <button className="navbar__signup-social" id="auth-microsoft" aria-label="Microsoft sign in">
                  <svg width="20" height="20" viewBox="0 0 24 24"><rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="13" y="1" width="10" height="10" fill="#7FBA00"/><rect x="1" y="13" width="10" height="10" fill="#00A4EF"/><rect x="13" y="13" width="10" height="10" fill="#FFB900"/></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
