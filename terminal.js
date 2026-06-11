/**
 * Terminal.js - Terminal-style About Me with typewriter effect
 * Displays personal information in a command-line interface style
 * Features: Pause/resume when out of view, language switching
 */

const TerminalAbout = (() => {
  // Personal data to display (in English, will be translated by i18n)
  // Note: Email is intentionally omitted to prevent scraping (available via contact form/footer)
  const aboutData = {
    en: [
      { label: 'Name', value: 'Edwin Fang' },
      { label: 'Program', value: 'GEB @ HKU' },
      { label: 'Year', value: 'Sophomore' },
      { label: 'Degrees', value: 'BEng (CompEng) + BBA (Finance)' },
      { label: 'Interests', value: 'Building, AI workflows, startups' },
      { label: 'Location', value: 'Hong Kong / Beijing' }
    ],
    'zh-TW': [
      { label: '姓名', value: '方一舟' },
      { label: '學程', value: '港大 GEB' },
      { label: '年級', value: '二年級' },
      { label: '學位', value: '工學士 (電腦工程) + 商學士 (金融)' },
      { label: '興趣', value: '實作、AI 工作流、新創' },
      { label: '地點', value: '香港 / 北京' }
    ],
    'zh-CN': [
      { label: '姓名', value: '方一舟' },
      { label: '学程', value: '港大 GEB' },
      { label: '年级', value: '二年级' },
      { label: '学位', value: '工学士 (计算机工程) + 商学士 (金融)' },
      { label: '兴趣', value: '实作、AI 工作流、新创' },
      { label: '地点', value: '香港 / 北京' }
    ]
  };

  const TYPING_SPEED = 35;
  const LINE_DELAY = 300;
  const COMMAND_DELAY = 800;

  // State
  let currentLine = 0;
  let currentCharIndex = 0;
  let currentLineText = '';
  let isTyping = false;
  let timeouts = [];
  let isInView = true;
  let lineElements = []; // Track created DOM elements
  let observer = null;
  
  const getCurrentLang = () => window.I18n ? window.I18n.getCurrentLang() : 'en';
  const getCurrentData = () => {
    const lang = getCurrentLang();
    return aboutData[lang] || aboutData['en'];
  };

  // Clear all pending timeouts
  const clearAllTimeouts = () => {
    timeouts.forEach(id => clearTimeout(id));
    timeouts = [];
  };

  // Setup Intersection Observer to pause/resume when out of view
  const setupObserver = () => {
    const terminalEl = document.querySelector('.terminal-window') || 
                        document.getElementById('about');
    if (!terminalEl || !('IntersectionObserver' in window)) return;
    
    // Cleanup previous observer
    if (observer) {
      observer.disconnect();
    }
    
    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const wasInView = isInView;
        isInView = entry.isIntersecting;
        
        if (wasInView && !isInView) {
          // Went out of view - pause animation
          clearAllTimeouts();
        } else if (!wasInView && isInView) {
          // Came back into view - resume animation
          if (isTyping && currentLine < getCurrentData().length) {
            resumeTyping();
          }
        }
      });
    }, { threshold: 0.1 });
    
    observer.observe(terminalEl);
  };

  // Resume typing from current state
  const resumeTyping = () => {
    const data = getCurrentData();
    
    if (currentLine >= data.length) {
      // All done
      isTyping = false;
      const cursorEl = document.getElementById('terminal-cursor');
      if (cursorEl) cursorEl.style.display = 'inline';
      return;
    }

    const line = data[currentLine];
    const outputEl = document.getElementById('typewriter-output');
    
    // Get or create line element
    let lineEl, valueEl;
    
    if (lineElements[currentLine]) {
      // Line element exists
      lineEl = lineElements[currentLine];
      valueEl = lineEl.querySelector('.line-value');
    } else {
      // Create new line element with smooth entrance animation
      lineEl = document.createElement('div');
      lineEl.className = 'line line-entering';
      
      const labelEl = document.createElement('span');
      labelEl.className = 'line-label';
      labelEl.textContent = line.label + ':';
      
      valueEl = document.createElement('span');
      valueEl.className = 'line-value';
      valueEl.textContent = currentLineText;
      
      lineEl.appendChild(labelEl);
      lineEl.appendChild(valueEl);
      outputEl.appendChild(lineEl);
      
      // Trigger smooth entrance animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          lineEl.classList.remove('line-entering');
          lineEl.classList.add('line-visible');
        });
      });
      
      lineElements[currentLine] = lineEl;
    }
    
    // Continue typing current line
    const typeChar = () => {
      if (currentCharIndex < line.value.length) {
        valueEl.textContent += line.value[currentCharIndex];
        currentLineText += line.value[currentCharIndex];
        currentCharIndex++;
        const timeoutId = setTimeout(typeChar, TYPING_SPEED + Math.random() * 20);
        timeouts.push(timeoutId);
      } else {
        // Current line complete
        currentLine++;
        currentCharIndex = 0;
        currentLineText = '';
        
        if (currentLine < data.length) {
          const timeoutId = setTimeout(typeNextLine, LINE_DELAY);
          timeouts.push(timeoutId);
        } else {
          // All done
          isTyping = false;
          const cursorEl = document.getElementById('terminal-cursor');
          if (cursorEl) cursorEl.style.display = 'inline';
        }
      }
    };
    
    const timeoutId = setTimeout(typeChar, TYPING_SPEED);
    timeouts.push(timeoutId);
  };

  // Type next line (when starting fresh or moving to next line)
  const typeNextLine = () => {
    const data = getCurrentData();
    
    if (currentLine >= data.length) {
      isTyping = false;
      const cursorEl = document.getElementById('terminal-cursor');
      if (cursorEl) cursorEl.style.display = 'inline';
      return;
    }

    const line = data[currentLine];
    const outputEl = document.getElementById('typewriter-output');
    
    // Create line element
    const lineEl = document.createElement('div');
    lineEl.className = 'line';
    
    const labelEl = document.createElement('span');
    labelEl.className = 'line-label';
    labelEl.textContent = line.label + ':';
    
    const valueEl = document.createElement('span');
    valueEl.className = 'line-value';
    
    lineEl.appendChild(labelEl);
    lineEl.appendChild(valueEl);
    outputEl.appendChild(lineEl);
    
    lineElements[currentLine] = lineEl;

    // Type the value with animation
    const typeChar = () => {
      if (currentCharIndex < line.value.length) {
        valueEl.textContent += line.value[currentCharIndex];
        currentLineText = valueEl.textContent;
        currentCharIndex++;
        const timeoutId = setTimeout(typeChar, TYPING_SPEED + Math.random() * 20);
        timeouts.push(timeoutId);
      } else {
        currentLine++;
        currentCharIndex = 0;
        currentLineText = '';
        
        if (currentLine < data.length) {
          const timeoutId = setTimeout(typeNextLine, LINE_DELAY);
          timeouts.push(timeoutId);
        } else {
          isTyping = false;
          const cursorEl = document.getElementById('terminal-cursor');
          if (cursorEl) cursorEl.style.display = 'inline';
        }
      }
    };

    const startTimeoutId = setTimeout(typeChar, COMMAND_DELAY);
    timeouts.push(startTimeoutId);
  };

  const startTyping = () => {
    clearAllTimeouts();
    const outputEl = document.getElementById('typewriter-output');
    if (!outputEl) return;

    outputEl.innerHTML = '';
    currentLine = 0;
    currentCharIndex = 0;
    currentLineText = '';
    lineElements = [];
    isTyping = true;

    // Only start if in view
    if (isInView) {
      timeouts.push(setTimeout(typeNextLine, COMMAND_DELAY));
    }
  };

  const init = () => {
    const outputEl = document.getElementById('typewriter-output');
    
    if (!outputEl) {
      console.warn('[Terminal] typewriter-output element not found');
      return;
    }

    // Setup intersection observer
    setupObserver();

    // Remove previous event listener if exists
    if (window._terminalLangChangeHandler) {
      window.removeEventListener('languageChanged', window._terminalLangChangeHandler);
    }

    // Wait for i18n to be ready
    const checkI18n = setInterval(() => {
      if (window.I18n && window.I18n.isInitialized()) {
        clearInterval(checkI18n);
        startTyping();
        
        // Re-type on language change (only add once)
        window._terminalLangChangeHandler = () => {
          startTyping();
        };
        window.addEventListener('languageChanged', window._terminalLangChangeHandler);
      }
    }, 100);

    // Fallback: start after 2s if i18n fails
    timeouts.push(setTimeout(() => {
      if (!isTyping) {
        startTyping();
      }
    }, 2000));
  };

  // Public API
  return {
    init,
    restart: startTyping,
    setupObserver
  };
})();

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => TerminalAbout.init());
} else {
  TerminalAbout.init();
}

window.TerminalAbout = TerminalAbout;
