import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeManager } from "@repo/ui";
import "./index.css";
import App from "./App";

// Validate environment early so misconfigurations fail fast.
import "./utils/.env";

// We support an API base override so the Auth app can run
// against different environments without rebuilds.
if (import.meta.env.VITE_API_BASE) {
  (window as unknown as { __API_BASE?: string }).__API_BASE = import.meta.env.VITE_API_BASE;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeManager>
      <App />
    </ThemeManager>
  </StrictMode>,
);
