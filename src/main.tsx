import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";

// Toggle between themes:
// - For scrapbook UI: import "./index.scrapbook.css" and App from "./App.scrapbook"
// - For modern UI: import "./index.modern.css" and App from "./App.modern"
// - For brutalist UI: import "./index.css" and App from "./App"
import "./index.scrapbook.css";
import App from "./App.scrapbook";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <App />
    </ConvexAuthProvider>
  </StrictMode>,
);