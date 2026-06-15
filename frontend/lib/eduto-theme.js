export function initEdutoTheme() {
  const containerId = 'eduto-root';
  let container = document.getElementById(containerId);

  // 1. Detection & Theme Configuration
  const rootStyle = getComputedStyle(document.body);
  
  // Try to detect variables, fallback to specified default dark palette
  const primaryColor = rootStyle.getPropertyValue('--blue').trim() || '#00b4d8';
  const bgColor = rootStyle.getPropertyValue('--bg').trim() || '#0f172a';
  const surfaceColor = rootStyle.getPropertyValue('--card-glass').trim() || '#1e293b';
  const textPrimary = rootStyle.getPropertyValue('--text1').trim() || '#f8fafc';
  const textMuted = rootStyle.getPropertyValue('--text3').trim() || '#94a3b8';
  const borderColor = rootStyle.getPropertyValue('--border').trim() || '#334155';
  const fontFamily = rootStyle.getPropertyValue('--font-poppins').trim() || 'sans-serif';

  const styleId = 'eduto-huashu-theme-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Scoping: All Huashu styles applied only inside #eduto-root */
      #${containerId} {
        /* Map detected Codemo colors to Huashu semantic tokens */
        --hu-color-primary: var(--blue, ${primaryColor});
        --hu-color-bg: var(--bg, ${bgColor});
        --hu-color-surface: var(--card-glass, ${surfaceColor});
        --hu-color-text: var(--text1, ${textPrimary});
        --hu-color-text-muted: var(--text3, ${textMuted});
        --hu-color-border: var(--border, ${borderColor});
        --hu-font-family: ${fontFamily};
        
        /* Enforce sharp/flat variant */
        --hu-radius: 0px;
        --hu-radius-sm: 0px;
        --hu-radius-md: 0px;
        --hu-radius-lg: 0px;
        --hu-radius-full: 0px;
        
        background-color: var(--hu-color-bg);
        color: var(--hu-color-text);
        font-family: var(--hu-font-family);
      }
      
      /* Avoid leaking styles */
      #${containerId} * {
        box-sizing: border-box;
      }
    `;
    document.head.appendChild(style);
  }

  // 2. Dark Mode Synchronization
  function updateThemeMode() {
    container = document.getElementById(containerId);
    if (!container) return;

    // Check DOM for Codemo's dark mode toggle (class or data-theme)
    const isDarkClass = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
    const isDarkAttr = document.documentElement.getAttribute('data-theme') === 'dark';
    
    // Check OS preference
    const isDarkPref = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const isDark = isDarkClass || isDarkAttr || isDarkPref;
    
    if (isDark) {
      container.setAttribute('data-hu-theme', 'dark');
      container.classList.add('hu-dark');
      container.classList.remove('hu-light');
    } else {
      container.setAttribute('data-hu-theme', 'light');
      container.classList.add('hu-light');
      container.classList.remove('hu-dark');
    }
  }

  // Initial Sync
  updateThemeMode();

  // Watch for class or attribute changes on <html> and <body>
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.attributeName === 'class' || mutation.attributeName === 'data-theme') {
        updateThemeMode();
      }
    }
  });

  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });

  // Watch for system preference changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateThemeMode);
  }

  // Fallback: intercept clicks on generic theme toggle buttons
  document.addEventListener('click', (e) => {
    const target = e.target;
    const isToggleBtn = target.closest('button') && 
      (target.closest('button').innerHTML.toLowerCase().includes('dark') || 
       target.closest('button').innerHTML.toLowerCase().includes('theme') ||
       target.closest('button').innerHTML.toLowerCase().includes('sun') ||
       target.closest('button').innerHTML.toLowerCase().includes('moon'));
       
    if (isToggleBtn) {
      // Delay slightly to let the site's click handler mutate the DOM first
      setTimeout(updateThemeMode, 50);
    }
  });
}
