import React from "react";
import ReactDOM from "react-dom/client";
import "bootstrap/dist/css/bootstrap-utilities.min.css";
import "@/styles/legacy.css";
import "@/styles/globals.css";
import App from "./App";

async function prepare() {
  if (import.meta.env.VITE_USE_MSW === "true") {
    const { worker } = await import("./mocks/browser");
    await worker.start({
      onUnhandledRequest: "bypass",
      serviceWorker: { url: "/mockServiceWorker.js" },
    });
  }
}

prepare().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
