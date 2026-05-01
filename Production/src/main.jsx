import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

// 🛡️ Global Storage Fallback for In-App Browsers (LINE, FB, IG)
function setupSafeStorage() {
  const createMemoryStorage = () => {
    const data = new Map();
    return {
      getItem: (key) => data.get(key) || null,
      setItem: (key, val) => data.set(key, String(val)),
      removeItem: (key) => data.delete(key),
      clear: () => data.clear(),
      key: (i) => Array.from(data.keys())[i] || null,
      get length() { return data.size; }
    };
  };

  const testStorage = (storageType) => {
    try {
      const storage = window[storageType];
      const x = '__storage_test__';
      storage.setItem(x, x);
      storage.removeItem(x);
      return true;
    } catch (e) {
      return false;
    }
  };

  if (!testStorage('localStorage')) {
    console.warn('localStorage is blocked. Falling back to memory storage.');
    try {
      Object.defineProperty(window, 'localStorage', {
        value: createMemoryStorage(),
        writable: true,
        enumerable: true,
        configurable: true
      });
    } catch (e) {
      console.error('Failed to override localStorage', e);
    }
  }

  if (!testStorage('sessionStorage')) {
    console.warn('sessionStorage is blocked. Falling back to memory storage.');
    try {
      Object.defineProperty(window, 'sessionStorage', {
        value: createMemoryStorage(),
        writable: true,
        enumerable: true,
        configurable: true
      });
    } catch (e) {
      console.error('Failed to override sessionStorage', e);
    }
  }
}

setupSafeStorage();
import { BrowserRouter } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import App from "./App"
import ErrorBoundary from "./components/ErrorBoundary"
import { HelmetProvider } from "react-helmet-async"
import "./index.css"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </HelmetProvider>
  </StrictMode>
)
