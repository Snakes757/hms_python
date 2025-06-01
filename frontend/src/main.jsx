import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // Global styles
// If you have a main Tailwind CSS file (e.g., output from a build process or a global import)
// import './styles/tailwind.css'; // Or your specific path to Tailwind's main CSS

// Ensure the root element exists in your index.html
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
