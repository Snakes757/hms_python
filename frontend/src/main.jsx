// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // Global styles - Ensure this file exists in src/

// If you have a main Tailwind CSS file (e.g., output from a build process or a global import)
// import './styles/tailwind.css'; // Or your specific path to Tailwind's main CSS

const rootElement = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error(
    "Failed to find the root element. Ensure your index.html has <div id='root'></div>."
  );
}
