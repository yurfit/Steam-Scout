import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/responsive.css";
import { registerServiceWorker } from "./lib/service-worker-registration";

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for offline capabilities
registerServiceWorker({
  onSuccess: (registration) => {
    console.log('Service worker registered successfully');
  },
  onUpdate: (registration) => {
    console.log('New service worker available');
  },
});
