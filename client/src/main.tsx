import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { HelmetProvider } from "react-helmet-async";

// Google Analytics 4 - Measurement ID: G-EBK5BTE9E0
// Initialize GA4 as backup/redundancy to ensure data collection
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

if (!window.gtag) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', 'G-EBK5BTE9E0', {
    page_path: window.location.pathname,
    page_title: document.title,
  });
}

// Let the first render and its critical assets start before downloading
// analytics. Events are queued above and sent when gtag loads during idle time.
const loadGoogleAnalytics = () => {
  if (document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=G-EBK5BTE9E0";
  document.head.appendChild(script);
};

const idleWindow = window as Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
};
if (idleWindow.requestIdleCallback) {
  idleWindow.requestIdleCallback(loadGoogleAnalytics, { timeout: 2500 });
} else {
  window.setTimeout(loadGoogleAnalytics, 1500);
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
