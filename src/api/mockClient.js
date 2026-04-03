/**
 * Mock API Client - Nahrazuje Base44 DB objekt
 * Poskytuje stejné API rozhraní pro zachování kompatibility
 */

// Mock databáze pro vývoj
const mockData = {
  users: [],
  entities: {},
  settings: {}
};

// Hlavní DB objekt - nahrazuje globalThis.__B44_DB__
export const db = {
  auth: {
    /**
     * Zkontroluje, zda je uživatel autentizován
     */
    isAuthenticated: async () => {
      const token = localStorage.getItem('auth_token');
      return !!token;
    },

    /**
     * Vrátí aktuálního uživatele
     */
    me: async () => {
      const userData = localStorage.getItem('user_data');
      if (!userData) {
        throw new Error('User not authenticated');
      }
      return JSON.parse(userData);
    },

    /**
     * Přihlášení uživatele
     */
    login: async (credentials) => {
      // Mock login - v produkci by se volalo na backend
      const mockUser = {
        id: 'user_123',
        email: credentials?.email || 'user@example.com',
        name: 'Demo User',
        role: 'user'
      };
      
      localStorage.setItem('auth_token', 'mock_jwt_token');
      localStorage.setItem('user_data', JSON.stringify(mockUser));
      
      return mockUser;
    },

    /**
     * Odhlášení uživatele
     */
    logout: (redirectUrl = null) => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    },

    /**
     * Přesměrování na přihlášení
     */
    redirectToLogin: (returnUrl = window.location.href) => {
      window.location.href = `/login?return=${encodeURIComponent(returnUrl)}`;
    }
  },

  entities: new Proxy({}, {
    get: (target, entityName) => {
      // Vrátí mock entity handler
      return {
        /**
         * Filtrování entit
         */
        filter: async (query = {}) => {
          console.log(`[Mock] Filter entities: ${entityName}`, query);
          return [];
        },

        /**
         * Získání entity podle ID
         */
        get: async (id) => {
          console.log(`[Mock] Get entity: ${entityName}/${id}`);
          return null;
        },

        /**
         * Vytvoření nové entity
         */
        create: async (data) => {
          console.log(`[Mock] Create entity: ${entityName}`, data);
          const id = `mock_${Date.now()}`;
          return { id, ...data };
        },

        /**
         * Aktualizace entity
         */
        update: async (id, data) => {
          console.log(`[Mock] Update entity: ${entityName}/${id}`, data);
          return { id, ...data };
        },

        /**
         * Smazání entity
         */
        delete: async (id) => {
          console.log(`[Mock] Delete entity: ${entityName}/${id}`);
          return { success: true };
        }
      };
    }
  }),

  integrations: {
    Core: {
      /**
       * Nahrání souboru
       */
      UploadFile: async (file) => {
        console.log('[Mock] Upload file:', file.name);
        // Vrátí mock URL
        return { 
          file_url: `https://mock-cdn.example.com/files/${Date.now()}_${file.name}`,
          file_id: `file_${Date.now()}`
        };
      }
    }
  }
};

// Pro zpětnou kompatibilitu
export const base44 = db;
export default db;