import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import Pumpfun from "./components/Pumpfun";
import Moonshot from "./components/Moonshot";

import "./styles.css";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/pumpfun" element={<Pumpfun />} />
        <Route path="/moonshot" element={<Moonshot />} />
      </Routes>
    </Router>
  );
};

export default App;
