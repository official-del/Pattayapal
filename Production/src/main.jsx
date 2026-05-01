import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

// 🛡️ Safe Storage Wrappers to prevent SecurityError in In-App Browsers (LINE, FB, IG)
window.safeStorage = {
  getItem: (k) => { try { return localStorage.getItem(k); } catch(e) { return null; } },
  setItem: (k, v) => { try { localStorage.setItem(k, v); } catch(e) {} },
  removeItem: (k) => { try { localStorage.removeItem(k); } catch(e) {} },
  clear: () => { try { localStorage.clear(); } catch(e) {} }
};

window.safeSessionStorage = {
  getItem: (k) => { try { return sessionStorage.getItem(k); } catch(e) { return null; } },
  setItem: (k, v) => { try { sessionStorage.setItem(k, v); } catch(e) {} },
  removeItem: (k) => { try { sessionStorage.removeItem(k); } catch(e) {} },
  clear: () => { try { sessionStorage.clear(); } catch(e) {} }
};
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
