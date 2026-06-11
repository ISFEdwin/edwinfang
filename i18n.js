/**
 * i18n - Multilingual Support System
 * Supports: English (en), Traditional Chinese (zh-TW), Simplified Chinese (zh-CN)
 * Features: IP-based auto-detection, language switcher, localStorage persistence
 */

const I18n = (() => {
  const SUPPORTED_LANGS = ['en', 'zh-TW', 'zh-CN'];
  const DEFAULT_LANG = 'en';
  const STORAGE_KEY = 'preferred_language';
  
  let currentLang = DEFAULT_LANG;
  let translations = {};
  let isInitialized = false;

  // Get user's country from IP (using free geolocation API)
  const detectCountryFromIP = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/', {
        signal: AbortSignal.timeout(3000) // 3s timeout
      });
      const data = await response.json();
      return data.country_code || 'US';
    } catch (error) {
      console.warn('[i18n] IP detection failed, using default language:', error);
      return 'US';
    }
  };

  // Map country to language
  const getLangFromCountry = (countryCode) => {
    const countryToLang = {
      'TW': 'zh-TW',  // Taiwan -> Traditional Chinese
      'HK': 'zh-TW',  // Hong Kong -> Traditional Chinese
      'MO': 'zh-TW',  // Macau -> Traditional Chinese
      'CN': 'zh-CN',  // China -> Simplified Chinese
      'SG': 'zh-CN',  // Singapore -> Simplified Chinese (could be zh-TW too)
      'MY': 'zh-CN',  // Malaysia -> Simplified Chinese
    };
    
    return countryToLang[countryCode] || DEFAULT_LANG;
  };

  // Load translation file
  const loadTranslations = async (lang) => {
    try {
      const response = await fetch(`./i18n/${lang}.json`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      translations[lang] = await response.json();
      return translations[lang];
    } catch (error) {
      console.error(`[i18n] Failed to load ${lang}.json:`, error);
      return null;
    }
  };

  // Get nested value from object using dot notation
  const getNestedValue = (obj, key) => {
    return key.split('.').reduce((o, k) => (o || {})[k], obj);
  };

  // Update all elements with data-i18n attribute
  const updateContent = () => {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = getNestedValue(translations[currentLang], key);
      
      if (translation) {
        // Handle different element types
        if (element.tagName === 'INPUT' && element.type === 'placeholder') {
          element.placeholder = translation;
        } else if (element.hasAttribute('data-i18n-html')) {
          element.innerHTML = translation;
        } else {
          element.textContent = translation;
        }
      } else {
        console.warn(`[i18n] Missing translation for key: ${key} in ${currentLang}`);
      }
    });

    // Update placeholder attributes
    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderElements.forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      const translation = getNestedValue(translations[currentLang], key);
      
      if (translation) {
        element.placeholder = translation;
      }
    });

    // Update meta tags
    const metaDescription = document.querySelector('meta[name="description"]');
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    
    if (metaDescription) {
      const desc = getNestedValue(translations[currentLang], 'meta.description');
      if (desc) metaDescription.setAttribute('content', desc);
    }
    
    if (metaKeywords) {
      const keywords = getNestedValue(translations[currentLang], 'meta.keywords');
      if (keywords) metaKeywords.setAttribute('content', keywords);
    }

    // Update HTML lang attribute
    document.documentElement.lang = currentLang;
  };

  // Switch language
  const switchLanguage = async (lang) => {
    if (!SUPPORTED_LANGS.includes(lang)) {
      console.error(`[i18n] Unsupported language: ${lang}`);
      return;
    }

    // Load translation if not already loaded
    if (!translations[lang]) {
      await loadTranslations(lang);
    }

    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    
    // Update UI
    updateContent();
    
    // Update language switcher buttons
    const buttons = document.querySelectorAll('.lang-btn');
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Dispatch event for other scripts
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
    
    console.log(`[i18n] Language switched to: ${lang}`);
  };

  // Initialize i18n system
  const init = async () => {
    if (isInitialized) return;

    // Determine initial language
    let initialLang = localStorage.getItem(STORAGE_KEY);

    if (!initialLang) {
      // First visit - detect from IP
      const country = await detectCountryFromIP();
      initialLang = getLangFromCountry(country);
      console.log(`[i18n] Auto-detected language based on country ${country}: ${initialLang}`);
    } else {
      console.log(`[i18n] Using saved language preference: ${initialLang}`);
    }

    // Validate stored/inital language
    if (!SUPPORTED_LANGS.includes(initialLang)) {
      initialLang = DEFAULT_LANG;
    }

    // Load default + initial language translations
    await Promise.all([
      loadTranslations(DEFAULT_LANG),
      loadTranslations(initialLang)
    ]);

    // Switch to initial language
    await switchLanguage(initialLang);
    
    isInitialized = true;
    
    // Setup language switcher event listeners
    setupLanguageSwitcher();
  };

  // Setup language switcher buttons
  const setupLanguageSwitcher = () => {
    const buttons = document.querySelectorAll('.lang-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        switchLanguage(lang);
      });
    });
  };

  // Public API
  return {
    init,
    switchLanguage,
    getCurrentLang: () => currentLang,
    getTranslation: (key) => getNestedValue(translations[currentLang], key),
    isInitialized: () => isInitialized
  };
})();

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => I18n.init());
} else {
  I18n.init();
}

// Export for use in other scripts
window.I18n = I18n;
