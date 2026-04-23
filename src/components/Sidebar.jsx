import React, { useState } from 'react';

const navItems = [
  { id: 'home', label: 'Home', icon: '/icons/Home (Default).svg', w: 36, h: 33, active: true },
  { id: 'team', label: 'Team', icon: '/icons/Teams (Default).svg', w: 28, h: 32 },
  { id: 'events', label: 'Events', icon: '/icons/Events (Default).svg', w: 32, h: 30 },
  { id: 'articles', label: 'Articles', icon: '/icons/Articles (Default).svg', w: 27, h: 28 },
  { id: 'elearn', label: 'eLearn', icon: '/icons/eLearn (Default).svg', w: 28, h: 30 },
  { id: 'projects', label: 'Projects', icon: '/icons/Projects (Default).svg', w: 33, h: 31 },
];

const Sidebar = ({ expanded, onToggle }) => {
  const [activeItem, setActiveItem] = useState('home');

  return (
    <aside className={`sidebar ${expanded ? 'sidebar--expanded' : ''}`} id="sidebar">
      {/* Main sidebar panel */}
      <div className="sidebar__main">
        {/* Navigation Items */}
        <nav className="sidebar__nav">
          {navItems.map((item) => (
            <div
              key={item.id}
              className={`sidebar__nav-item ${activeItem === item.id ? 'sidebar__nav-item--active' : ''}`}
              id={`nav-${item.id}`}
              onClick={() => setActiveItem(item.id)}
            >
              <div className="sidebar__nav-icon">
                <img
                  src={item.icon}
                  alt={item.label}
                  width={item.w}
                  height={item.h}
                  className={`sidebar__icon-img ${activeItem === item.id ? 'sidebar__icon-img--active' : ''}`}
                />
              </div>
              <span className="sidebar__nav-label">{item.label}</span>
              {!expanded && <span className="tooltip">{item.label}</span>}
            </div>
          ))}
        </nav>

        {/* Spacer */}
        <div className="sidebar__spacer" />

        {/* Bottom controls */}
        <div className="sidebar__bottom">
          {expanded ? (
            <div className="sidebar__bottom-row">
              <div className="sidebar__bottom-item" id="sidebar-collapse" onClick={onToggle}>
                <div className="sidebar__bottom-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a3a3a4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </div>
              </div>
              <div className="sidebar__bottom-item" id="sidebar-theme">
                <div className="sidebar__bottom-icon">
                  <img src="/icons/Light Mode (Default).svg" alt="Theme" width={30.3} height={30.3} className="sidebar__icon-img" />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="sidebar__bottom-item" id="sidebar-theme">
                <div className="sidebar__bottom-icon">
                  <img src="/icons/Light Mode (Default).svg" alt="Theme" width={30.3} height={30.3} className="sidebar__icon-img" />
                </div>
                {!expanded && <span className="tooltip">Theme</span>}
              </div>
              <div className="sidebar__bottom-item" id="sidebar-expand" onClick={onToggle}>
                <div className="sidebar__bottom-icon">
                  <img src="/icons/Expand Dock (Default).svg" alt="Menu" width={30.3} height={26.4} className="sidebar__icon-img" />
                </div>
                {!expanded && <span className="tooltip">Expand</span>}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Jams Bot — outside sidebar panel (replaces old logout) */}
      <div className="sidebar__logout" id="sidebar-jamsbot">
        <div
          className="sidebar__logout-icon"
          style={{
            backgroundImage: "url('/icons/Jams Bot (Default).svg')",
            backgroundSize: '280%',
            backgroundPosition: '50% 42%',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <span className="sidebar__logout-label">Jams Bot</span>
      </div>
    </aside>
  );
};

export default Sidebar;
