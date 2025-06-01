// src/App.jsx
import React from "react";
import { BrowserRouter as Router } from "react-router-dom"; // Ensure react-router-dom is installed
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";
import AppRoutes from "./routes/AppRoutes";
import ErrorBoundary from "./components/common/ErrorBoundary";

function App() {
  return (
    <AuthProvider>
      <Router>
        <ErrorBoundary>
          <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800">
            {" "}
            {/* Tailwind class for background and text */}
            <Header />
            {/* Main content area that grows to fill space */}
            <div className="flex-1 w-full">
              {" "}
              {/* Ensures AppRoutes takes available space */}
              <AppRoutes />
            </div>
            <Footer />
          </div>
        </ErrorBoundary>
      </Router>
    </AuthProvider>
  );
}

export default App;
