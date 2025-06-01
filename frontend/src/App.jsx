// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar'; // Placeholder
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import './App.css'; // General app styles
// You might want to create a global.css in src/styles and import it here
// import './styles/global.css'; 

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="d-flex flex-column min-vh-100">
          <Header />
          <div className="d-flex flex-grow-1">
            {/* Sidebar can be conditionally rendered based on route or auth state */}
            {/* For now, let's assume it's always there for logged-in areas,
                but we need to implement logic for that.
                A simple way is to check localStorage for token in Sidebar itself,
                or better, use AuthContext.
            */}
            {/* <Sidebar /> */} {/* We'll integrate sidebar more deeply later */}
            <main className="container-fluid p-0 flex-grow-1"> 
              {/* The main content area.
                Using container-fluid to allow full-width content if needed.
                p-0 to remove default padding if pages/components manage their own.
              */}
              <AppRoutes />
            </main>
          </div>
          {/* Footer can be added here if needed */}
          {/* <Footer /> */}
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
