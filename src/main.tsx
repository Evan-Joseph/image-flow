import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n";
import { ThemeProvider } from "./contexts/ThemeContext";
import { initPerformanceMonitoring } from "./utils/performance";
import { initGoogleAnalytics, initSearchConsole } from "./utils/analytics";

// 初始化 Google Analytics
initGoogleAnalytics({
  gaId: import.meta.env.VITE_GA_MEASUREMENT_ID,
  enableDebug: import.meta.env.DEV,
  enableEcommerce: true,
  enableEnhancedMeasurement: true
});

// 初始化 Search Console
initSearchConsole(import.meta.env.VITE_GSC_VERIFICATION_CODE);

// 初始化性能监控
initPerformanceMonitoring({
  enableAnalytics: true,
  enableConsoleLog: import.meta.env.DEV,
  enableBeacon: import.meta.env.PROD
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);
