// src/components/common/Footer.jsx
import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-light text-center text-lg-start mt-auto border-top">
      <div className="container p-3">
        <div className="row">
          <div className="col-lg-6 col-md-12 mb-4 mb-md-0">
            <h5 className="text-uppercase">Hospital Management System</h5>
            <p>
              Providing quality healthcare services with dedication and advanced technology.
              Your health is our priority.
            </p>
          </div>
          <div className="col-lg-3 col-md-6 mb-4 mb-md-0">
            <h5 className="text-uppercase">Quick Links</h5>
            <ul className="list-unstyled mb-0">
              <li>
                <a href="/home" className="text-dark text-decoration-none">Home</a>
              </li>
              <li>
                <a href="/appointments" className="text-dark text-decoration-none">Appointments</a>
              </li>
              <li>
                <a href="/contact-us" className="text-dark text-decoration-none">Contact Us</a>
              </li>
              {/* Add more relevant links */}
            </ul>
          </div>
          <div className="col-lg-3 col-md-6 mb-4 mb-md-0">
            <h5 className="text-uppercase">Contact</h5>
            <ul className="list-unstyled mb-0">
              <li>
                <p className="text-dark mb-1">123 Health St, Wellness City, HC 45678</p>
              </li>
              <li>
                <p className="text-dark mb-1">info@hms-example.com</p>
              </li>
              <li>
                <p className="text-dark mb-1">+01 234 567 89</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="text-center p-3" style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
        © {currentYear} Hospital Management System. All Rights Reserved.
        {/* <a className="text-dark" href="https://yourdomain.com/">HMS.com</a> */}
      </div>
    </footer>
  );
};

export default Footer;
