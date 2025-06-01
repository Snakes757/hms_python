import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";
import AppRoutes from "./routes/AppRoutes";
import ErrorBoundary from "./components/common/ErrorBoundary";

// Assuming index.css or a similar global file handles Tailwind CSS setup and global styles.
// If src/styles/global.css contains essential global styles beyond Tailwind's scope,
// it should be imported in main.jsx or index.css.
// For this component, we rely on Tailwind classes and the global setup.

function App() {
  return (
    <AuthProvider>
      <Router>
        <ErrorBoundary>
          <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800">
            {" "}
            {/* Tailwind for main page background and text color */}
            <Header />
            {/* The main content area where AppRoutes will render pages.
                PageWithSidebar component (used by AppRoutes for specific pages)
                will handle its own sidebar and content layout. */}
            <div className="flex-1 w-full">
              {" "}
              {/* This container allows AppRoutes to manage layout (e.g. full-width or with sidebar via PageWithSidebar) */}
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
