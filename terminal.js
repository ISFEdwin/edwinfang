/**
 * Terminal.js - Terminal-style About Me with typewriter effect
 * Displays personal information in a command-line interface style
 */

const TerminalAbout = (() => {
  // Personal data to display (in English, will be translated by i18n)
  const aboutData = {
    en: [
      { label: 'Name', value: 'Edwin Fang (方一舟)' },
      { label: 'Program', value: 'GEB @ HKU' },
      { label: 'Year', value: 'Sophomore' },
      { label: 'Degrees', value: 'BEng (CompEng) + BBA (Finance)' },
      { label: 'Interests', value: 'Building, AI workflows, startups' },
      { label: 'Location', value: 'Hong Kong / Beijing' },
      { label: 'Email', value: 'fyzedwin@gmail.com' }
    ],
    'zh-TW': [
      { label: '姓名', value: 'Edwin Fang (方一舟)' },
      { label: '學程', value: '港大 GEB' },
      { label: '年級', value: '二年級' },
      { label: '學位', value: '工學士 (電腦工程) + 商學士 (金融)' },
      { label: '興趣', value: '實作、AI 工作流、新創' },
      { label: '地點', value: '香港 / 北京' },
      { label: '電郵', value: 'fyzedwin@gmail.com' }
    ],
    'zh-CN': [
      { label: '姓名', value: 'Edwin Fang (方一舟)' },
      { label: '学程', value: '港大 GEB' },
      { label: '年级', value: '二年级' },
      { label: '学位', value: '工学士 (计算机工程) + 商学士 (金融)' },
      { label: '兴趣', value: '实作、AI 工作流、新创' },
      { label: '地点', value: '香港 / 北京' },
      { label: '电邮', value: 'fyzedwin@gmail.com' }
    ]
  };

  const TYPING_SPEED = 35;
  const LINE_DELAY = 300;
  const COMMAND_DELAY = 800;

  let currentLine = 0;
  let isTyping = false;
  let timeouts = []; // Track all timeouts to clear them

  // Clear all pending timeouts
  const clearAllTimeouts = () => {
    timeouts.forEach(id => clearTimeout(id));
    timeouts = [];
  };

  const init = () => {
    const outputEl = document.getElementById('typewriter-output');
    const cursorEl = document.getElementById('terminal-cursor');
    
    if (!outputEl) {
      console.warn('[Terminal] typewriter-output element not found');
      return;
    }

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
          clearAllTimeouts();
          outputEl.innerHTML = '';
          currentLine = 0;
          isTyping = false;
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

  const startTyping = () => {
    clearAllTimeouts(); // Clear any pending timeouts
    const outputEl = document.getElementById('typewriter-output');
    if (!outputEl) return;

    outputEl.innerHTML = '';
    currentLine = 0;
    isTyping = true;

    timeouts.push(setTimeout(typeNextLine, COMMAND_DELAY));
  };

  const typeNextLine = () => {
    const lang = window.I18n ? window.I18n.getCurrentLang() : 'en';
    const data = aboutData[lang] || aboutData['en'];
    
    if (currentLine >= data.length) {
      isTyping = false;
      const cursorEl = document.getElementById('terminal-cursor');
      if (cursorEl) {
        cursorEl.style.display = 'inline';
      }
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

    // Type the value with animation
    let charIndex = 0;
    const typeChar = () => {
      if (charIndex < line.value.length) {
        valueEl.textContent += line.value[charIndex];
        charIndex++;
        const timeoutId = setTimeout(typeChar, TYPING_SPEED + Math.random() * 20);
        timeouts.push(timeoutId);
      } else {
        currentLine++;
        const timeoutId = setTimeout(typeNextLine, LINE_DELAY);
        timeouts.push(timeoutId);
      }
    };

    const startTimeoutId = setTimeout(typeChar, COMMAND_DELAY);
    timeouts.push(startTimeoutId);
  };

  // Public API
  return {
    init,
    restart: startTyping
  };
})();

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => TerminalAbout.init());
} else {
  TerminalAbout.init();
}

window.TerminalAbout = TerminalAbout;
