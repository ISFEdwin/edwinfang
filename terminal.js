/**
 * Terminal.js - Terminal-style About Me with typewriter effect
 * Displays personal information in a command-line interface style
 * Features: Pause/resume when out of view, language switching, smooth line animations
 */

const TerminalAbout = (() => {
  // Personal data to display
  const aboutData = {
    en: [
      { label: 'Name', value: 'Edwin Fang' },
      { label: 'Program', value: 'GEBP @ HKU' },
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
  let lineElements = [];
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

  // Create a line element with smooth entrance animation
  const createLineElement = (line, lineIndex) => {
    const lineEl = document.createElement('div');
    lineEl.className = 'line line-entering';

    const labelEl = document.createElement('span');
    labelEl.className = 'line-label';
    labelEl.textContent = line.label + ':';

    const valueEl = document.createElement('span');
    valueEl.className = 'line-value';
    valueEl.textContent = '';

    lineEl.appendChild(labelEl);
    lineEl.appendChild(valueEl);

    const outputEl = document.getElementById('typewriter-output');
    outputEl.appendChild(lineEl);

    // Trigger smooth entrance animation on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        lineEl.classList.remove('line-entering');
        lineEl.classList.add('line-visible');
      });
    });

    lineElements[lineIndex] = lineEl;
    return { lineEl, valueEl };
  };

  // Get existing line element or create a new one
  const getOrCreateLine = (lineIndex) => {
    const line = getCurrentData()[lineIndex];
    const outputEl = document.getElementById('typewriter-output');

    if (lineElements[lineIndex]) {
      // Reuse existing element
      const lineEl = lineElements[lineIndex];
      const valueEl = lineEl.querySelector('.line-value');
      lineEl.classList.remove('line-visible');
      lineEl.classList.add('line-entering');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          lineEl.classList.remove('line-entering');
          lineEl.classList.add('line-visible');
        });
      });
      return { lineEl, valueEl };
    } else {
      return createLineElement(line, lineIndex);
    }
  };

  // Type a single character
  const typeChar = (line, valueEl) => {
    if (currentCharIndex < line.value.length) {
      valueEl.textContent += line.value[currentCharIndex];
      currentLineText += line.value[currentCharIndex];
      currentCharIndex++;
      const timeoutId = setTimeout(() => typeChar(line, valueEl), TYPING_SPEED + Math.random() * 20);
      timeouts.push(timeoutId);
    } else {
      // Current line complete — move to next line
      currentLine++;
      currentCharIndex = 0;
      currentLineText = '';

      if (currentLine < getCurrentData().length) {
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

  // Type the next line
  const typeNextLine = () => {
    const data = getCurrentData();

    if (currentLine >= data.length) {
      isTyping = false;
      const cursorEl = document.getElementById('terminal-cursor');
      if (cursorEl) cursorEl.style.display = 'inline';
      return;
    }

    const line = data[currentLine];
    const { valueEl } = getOrCreateLine(currentLine);

    // Start typing characters
    const timeoutId = setTimeout(() => typeChar(line, valueEl), COMMAND_DELAY);
    timeouts.push(timeoutId);
  };

  // Setup Intersection Observer to pause/resume when out of view
  const setupObserver = () => {
    const terminalEl = document.querySelector('.terminal-window') ||
                         document.getElementById('about');
    if (!terminalEl || !('IntersectionObserver' in window)) return;

    if (observer) {
      observer.disconnect();
    }

    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const wasInView = isInView;
        isInView = entry.isIntersecting;

        if (wasInView && !isInView) {
          clearAllTimeouts();
        } else if (!wasInView && isInView) {
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
      isTyping = false;
      const cursorEl = document.getElementById('terminal-cursor');
      if (cursorEl) cursorEl.style.display = 'inline';
      return;
    }

    const line = data[currentLine];
    const { valueEl } = getOrCreateLine(currentLine);

    // Continue typing current line
    typeChar(line, valueEl);
  };

  // Start typing from scratch
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
