/**
 * Konfigurace aplikace - nahrazuje Base44 app-params
 */

const isNode = typeof window === 'undefined';
const windowObj = isNode ? { localStorage: new Map() } : window;
const storage = windowObj.localStorage;

/**
 * Získá hodnotu parametru z URL nebo localStorage
 */
const getParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
  if (isNode) {
    return defaultValue;
  }
  
  const storageKey = `app_${paramName.toLowerCase()}`;
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get(paramName);
  
  // Odstranit z URL pokud je požadováno
  if (removeFromUrl && searchParam) {
    urlParams.delete(paramName);
    const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""}${window.location.hash}`;
    window.history.replaceState({}, document.title, newUrl);
  }
  
  // Prioritizace: URL > localStorage > defaultValue
  if (searchParam) {
    storage.setItem(storageKey, searchParam);
    return searchParam;
  }
  
  if (defaultValue !== undefined) {
    storage.setItem(storageKey, defaultValue);
    return defaultValue;
  }
  
  const storedValue = storage.getItem(storageKey);
  if (storedValue) {
    return storedValue;
  }
  
  return null;
};

/**
 * Vyčistí auth tokeny
 */
const clearAuthTokens = () => {
  if (isNode) return;
  
  if (getParamValue("clear_access_token") === 'true') {
    storage.removeItem('app_access_token');
    storage.removeItem('auth_token');
    storage.removeItem('user_data');
  }
};

/**
 * Získá konfigurační parametry aplikace
 */
const getAppConfig = () => {
  clearAuthTokens();
  
  return {
    // Základní konfigurace
    appId: getParamValue("app_id", { defaultValue: import.meta.env.VITE_APP_ID || 'yo-app' }),
    
    // Auth token (pokud existuje)
    token: getParamValue("access_token", { removeFromUrl: true }),
    
    // URL odkud přišel uživatel
    fromUrl: getParamValue("from_url", { defaultValue: window.location.href }),
    
    // API base URL (pro budoucí integraci)
    apiBaseUrl: getParamValue("api_base_url", { 
      defaultValue: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
    }),
    
    // Režim aplikace (development/production)
    mode: import.meta.env.MODE || 'development',
    
    // Feature flags
    features: {
      mockAuth: import.meta.env.VITE_USE_MOCK_AUTH !== 'false',
      walletConnect: import.meta.env.VITE_ENABLE_WALLET_CONNECT === 'true'
    }
  };
};

export const appConfig = {
  ...getAppConfig()
};

// Pro zpětnou kompatibilitu
export const appParams = appConfig;
