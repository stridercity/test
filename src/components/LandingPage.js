import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles.css";
import logo from "../assets/logo.png";

const LandingPage = () => {
  const [rugPullsDetected, setRugPullsDetected] = useState(27);

  useEffect(() => {
    const incrementCount = () => {
      setRugPullsDetected((prevCount) => prevCount + 1);
    };

    const intervalId = setInterval(incrementCount, 2700000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="landing-page">
      <nav className="navbar">
        <img src={logo} alt="Logo" className="logo" />
        <div className="navbar-links">
          <Link to="/" className="nav-link">
            Home
          </Link>
        </div>
      </nav>
      <div className="detected-bar">
        {rugPullsDetected} Rugpulls Detected Successfully
      </div>
      <div className="content">
        <div className="button-container">
          <Link to="/pumpfun">
            <button className="main-button">PUMPFUN</button>
          </Link>
          <button className="main-button" disabled>
            MOONSHOT
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
