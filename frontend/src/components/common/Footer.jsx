import React from 'react';
import { Link } from 'react-router-dom'; // Assuming Link is used for navigation

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-slate-100 text-slate-700 text-center lg:text-left mt-auto border-t border-slate-300">
      {/* Main container for footer content */}
      <div className="container mx-auto p-6">
        {/* Grid layout for footer sections */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Hospital Management System section */}
          <div className="lg:col-span-1 mb-6 md:mb-0">
            <h5 className="uppercase font-semibold mb-2.5 text-slate-800">Hospital Management System</h5>
            <p className="text-sm text-slate-600">
              Providing quality healthcare services with dedication and advanced technology.
              Your health is our priority.
            </p>
          </div>

          {/* Quick Links section */}
          <div className="lg:col-span-1 mb-6 md:mb-0">
            <h5 className="uppercase font-semibold mb-2.5 text-slate-800">Quick Links</h5>
            <ul className="list-none mb-0">
              <li className="mb-1">
                <Link to="/" className="text-slate-600 hover:text-sky-600 transition-colors duration-200">Home</Link>
              </li>
              <li className="mb-1">
                <Link to="/appointments" className="text-slate-600 hover:text-sky-600 transition-colors duration-200">Appointments</Link>
              </li>
              <li>
                <Link to="/contact-us" className="text-slate-600 hover:text-sky-600 transition-colors duration-200">Contact Us</Link>
              </li>
              {/* Add other relevant quick links here if needed */}
            </ul>
          </div>

          {/* Contact section */}
          <div className="lg:col-span-1 mb-6 md:mb-0">
            <h5 className="uppercase font-semibold mb-2.5 text-slate-800">Contact</h5>
            <ul className="list-none mb-0 text-sm">
              <li className="mb-1">
                <p className="text-slate-600">02 Middle Str,Polokwane</p>
              </li>
              <li className="mb-1">
                <a href="mailto:info@hms-example.com" className="text-slate-600 hover:text-sky-600 transition-colors duration-200">admin@hms.example.com</a>
              </li>
              <li>
                <a href="tel:+27762360798" className="text-slate-600 hover:text-sky-600 transition-colors duration-200">+27762360798</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright section */}
      <div className="text-center p-4 text-sm bg-slate-200 text-slate-600">
        © {currentYear} Hospital Management System. All Rights Reserved.
        {/* Optional: Add a link to privacy policy or terms of service if needed */}
        {/* <a href="/privacy" className="text-slate-600 hover:text-sky-600 ml-4">Privacy Policy</a> */}
      </div>
    </footer>
  );
};

export default Footer;
