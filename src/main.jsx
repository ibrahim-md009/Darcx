import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppProvider } from "./context.jsx";
import App from "./App.jsx";
import "./styles/styles.css";
import { Analytics } from "@vercel/analytics/react";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AppProvider>
      <App />
      <Analytics />
    </AppProvider>
  </BrowserRouter>,
);
