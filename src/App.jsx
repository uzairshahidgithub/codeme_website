import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

const App = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  return (
    <div className="app-layout">
      {/* Top Navbar */}
      <Navbar />

      {/* Content area: Sidebar + Main */}
      <div className="content-wrapper">
        <Sidebar
          expanded={sidebarExpanded}
          onToggle={() => setSidebarExpanded(!sidebarExpanded)}
        />

        {/* Main content area */}
        <main className="main-content" id="main-content">
          {/* Content will go here — currently empty as per the home page design */}
        </main>
      </div>
    </div>
  );
};

export default App;
