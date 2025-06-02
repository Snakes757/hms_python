import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";
import AppRoutes from "./routes/AppRoutes";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { UserProvider } from "./context/UserContext"; // Import UserProvider

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <UserProvider> {/* Wrap with UserProvider */}
            <div className="flex flex-col min-h-screen bg-slate-100 text-slate-900">
              <Header />
              <main className="flex-grow w-full"> {/* Changed flex-1 to flex-grow */}
                <AppRoutes />
              </main>
              <Footer />
            </div>
          </UserProvider>
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
