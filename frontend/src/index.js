import React from 'react';
import ReactDOM from 'react-dom/client';

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <p>This is a placeholder index.js. The main application entry point is main.jsx.</p>
    </React.StrictMode>
  );
} else {
  console.error(
    "Failed to find the root element. Ensure your index.html has <div id='root'></div>."
  );
}
