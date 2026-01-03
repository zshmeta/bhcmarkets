import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeManager } from "@repo/ui";
import { App } from "./app/App";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element with id 'root' was not found");
}

if (import.meta.env.VITE_API_BASE) {
  (window as unknown as { __API_BASE?: string }).__API_BASE = import.meta.env.VITE_API_BASE;
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ThemeManager>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeManager>
  </React.StrictMode>
);
