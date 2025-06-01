// src/routes/PageWithSidebar.jsx
import React from 'react';
import Sidebar from '../components/common/Sidebar';
import ErrorBoundary from '../components/common/ErrorBoundary';

const PageWithSidebar = ({ children, title }) => (
  <ErrorBoundary>
    <div className="d-flex">
        <Sidebar />
        <div className="container-fluid py-3 px-4 flex-grow-1"> {/* Added some default padding */}
            {title && <h1 className="h3 mb-3 text-gray-800">{title}</h1>} {/* Adjusted title styling */}
            {children}
        </div>
    </div>
  </ErrorBoundary>
);

export default PageWithSidebar;
