// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';

// Import Bootstrap CSS first (if not already in public/index.html or App.js)
// Assuming Bootstrap is linked in public/index.html as per previous batches.
// If you prefer importing it here:
// import 'bootstrap/dist/css/bootstrap.min.css';

import './index.css'; // Default Create React App styles (can be customized or removed)
import './styles/global.css'; // Your custom global styles
// Import component-specific styles if you prefer them globally, otherwise import in components
// import './styles/components/forms.css'; 
// import './styles/components/buttons.css';
// import './styles/components/cards.css';
// import './styles/components/tables.css';

import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
