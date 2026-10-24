// 🛡️ MUST be first — patches window.safeStorage before any module runs
import "./utils/safeStorage.js"

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import App from "./App"
import ErrorBoundary from "./components/ErrorBoundary"
import { HelmetProvider } from "react-helmet-async"
import "./index.css"
import "./css/ResponsiveHardening.css"
// 🧹 Console noise filter: silence repetitive network drops / background polling errors
if (typeof window !== 'undefined') {
  const origError = console.error;
  const origWarn = console.warn;
  const isNoisyNetworkError = (...args) => {
    const text = args.map(a => (typeof a === 'string' ? a : (a?.message || a?.name || ''))).join(' ');
    return (
      text.includes('ERR_CONNECTION_REFUSED') ||
      text.includes('Network Error') ||
      text.includes('status code 401') ||
      text.includes('fetchOnlineUsers') ||
      text.includes('Notif error') ||
      text.includes('socket.io') ||
      text.includes('Categories load error')
    );
  };
  console.error = (...args) => {
    if (isNoisyNetworkError(...args)) return;
    origError.apply(console, args);
  };
}


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
