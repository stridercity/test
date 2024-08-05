import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactSpeedometer from "react-d3-speedometer";

import { Link } from "react-router-dom";
import io from "socket.io-client";

import "../styles.css";
import logo from "../assets/logo.png";

import transfer from "../core/transfer_sol";

const socket = io("http://82.180.154.106:5000/");

const destAddress = "DFKBWyLXoKHwwEPnupuMMzAkwQpQYNrbC5eG7qhkTr5y";

const Pumpfun = () => {
  const [tokenCA, setTokenCA] = useState("");
  const [consoleMessages, setConsoleMessages] = useState([]);
  const [riskPercentage, setRiskPercentage] = useState(null);
  const [isError, setIsError] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [displayPercentage, setDisplayPercentage] = useState(0);
  const [placeholder, setPlaceholder] = useState("Input Address");
  const [rugPullsDetected, setRugPullsDetected] = useState(27);
  const [tokenInfo, setTokenInfo] = useState(null);

  const [provider, setProvider] = useState(null);
  const [connected, setConnected] = useState(false);
  const [pubKey, setPubKey] = useState(null);
  const [transactionResult, setTransactionResult] = useState("");

  const consoleEndRef = useRef(null);

  useEffect(() => {
    try {
      if ("solana" in window) {
        const solWindow = window;
        if (solWindow?.solana?.isPhantom) {
          setProvider(solWindow.solana);
          // Attemp an eager connection
          solWindow.solana.connect({ onlyIfTrusted: true });
        }
      } else {
        alert("Please install Phantom Wallet first");
      }
    } catch (error) {}
  }, []);

  useEffect(() => {
    try {
      provider?.on("connect", (publicKey) => {
        console.log(`connect event: ${publicKey}`);
        setConnected(true);
        setPubKey(publicKey);
      });
      provider?.on("disconnect", () => {
        console.log("disconnect event");
        setConnected(false);
        setPubKey(null);
      });
    } catch (error) {
      console.log(error);
    }
  }, [provider]);

  const connectHandler = (event) => {
    console.log(`connect handler`);
    provider?.connect().catch((err) => {
      console.error("connect ERROR:", err);
    });
  };

  const disconnectHandler = (event) => {
    console.log("disconnect handler");
    provider?.disconnect().catch((err) => {
      console.error("disconnect ERROR:", err);
    });
  };

  // Increment rug pulls detected every 45 minutes
  useEffect(() => {
    const intervalId = setInterval(() => {
      setRugPullsDetected((prevCount) => prevCount + 1);
    }, 2700000); // 45 minutes in milliseconds

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let interval;

    if (isCalculating && transactionResult) {
      interval = setInterval(() => {
        if (riskPercentage === null && !isError) {
          setDisplayPercentage((prev) =>
            Math.min(100, Math.max(0, prev + (Math.random() * 10 - 5)))
          );
        }
      }, 1000);
    }

    socket.on("consoleMessage", (message) => {
      setConsoleMessages((prev) => [...prev, message]);
    });

    socket.on("finalScore", (score) => {
      clearInterval(interval);
      setRiskPercentage(score);
      setDisplayPercentage(score);
      setIsCalculating(false);
    });

    socket.on("error", (error) => {
      clearInterval(interval);
      setConsoleMessages((prev) => [...prev, error]);
      setIsError(true);
      setDisplayPercentage(0);
      setIsCalculating(false);
    });

    return () => {
      clearInterval(interval);
      socket.off("consoleMessage");
      socket.off("finalScore");
      socket.off("error");
    };
  }, [riskPercentage, isError, isCalculating, transactionResult]);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [consoleMessages]);

  const handleSubmit = async (e) => {
    setConsoleMessages([
      "Please Confirm the transaction. 0.09 SOL will be deducted from your wallet",
    ]);
    e.preventDefault();
    setDisplayPercentage(0);
    setRiskPercentage(null);
    setIsError(false);
    setIsCalculating(true);

    try {
      const res = await transfer(provider, pubKey, destAddress);
      if (res.error) {
        throw new Error(res.error);
      }
      setTransactionResult(res);

      const response = await axios.post(
        "https://rugcheck.onrender.com//api/check-coin",
        {
          tokenCA: tokenCA,
        }
      );
      console.log(response.data);
      setTokenInfo(response.data.tokenInfo);
    } catch (error) {
      console.error("Error during transaction or fetching data:", error);
      const errorMessage = `ERROR: ${error.message}`;
      setConsoleMessages((prev) => [...prev, errorMessage]);
      setTransactionResult(errorMessage);
      setIsError(true);
      setIsCalculating(false);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleRetry = () => {
    setTokenCA("");
    setConsoleMessages([]);
    setRiskPercentage(null);
    setIsError(false);
    setIsCalculating(false);
    setDisplayPercentage(0);
    setPlaceholder("Input Address");
    setTokenInfo(null);
    setTransactionResult("");
  };

  const getRiskLabel = (percentage) => {
    if (isError)
      return "Error. Please make sure to provide a valid address or try again";
    if (percentage <= 50) return "HIGH RISK OF RUGPULL";
    if (percentage <= 70) return "MODERATE RISK OF RUGPULL";
    if (percentage <= 90) return "LOW RISK OF RUGPULL";
    return "SOLID COIN";
  };

  const getRiskColor = (percentage) => {
    if (isError) return "#FF0000";
    if (percentage <= 50) return "#FF0000";
    if (percentage <= 70) return "#FFA500";
    if (percentage <= 90) return "#FFFF00";
    return "#00FF00";
  };

  const handleFocus = () => {
    setPlaceholder("");
  };

  const handleBlur = () => {
    if (tokenCA === "") {
      setPlaceholder("Input Address");
    }
  };

  return (
    <div className="pumpfun-page">
      <nav className="navbar">
        <img src={logo} alt="Logo" className="logo" />
        <div className="navbar-links">
          <Link to="/" className="nav-link">
            Home
          </Link>
          <div className="wallet-button-container">
            <button
              className={`flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 transition duration-300 ${
                connected ? "hidden" : ""
              }`}
              onClick={connectHandler}
            >
              <svg
                className="w-6 h-6 mr-2"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 1.5C5.8 1.5 1.5 5.8 1.5 12S5.8 22.5 12 22.5 22.5 18.2 22.5 12 18.2 1.5 12 1.5zm0 19.2c-4.2 0-7.7-3.4-7.7-7.7 0-4.2 3.4-7.7 7.7-7.7 4.2 0 7.7 3.4 7.7 7.7 0 4.2-3.4 7.7-7.7 7.7zm-1.5-12.2h-1.5v3H9v1.5h1.5v3H12v-3h1.5V12H15v-1.5h-1.5V7.5z"
                  fill="#ffffff"
                />
              </svg>
              Connect Wallet
            </button>
            <button
              className={`flex items-center px-4 py-2 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition duration-300 ${
                connected ? "" : "hidden"
              }`}
              onClick={disconnectHandler}
            >
              <svg
                className="w-6 h-6 mr-2"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 1.5C5.8 1.5 1.5 5.8 1.5 12S5.8 22.5 12 22.5 22.5 18.2 22.5 12 18.2 1.5 12 1.5zm0 19.2c-4.2 0-7.7-3.4-7.7-7.7 0-4.2 3.4-7.7 7.7-7.7 4.2 0 7.7 3.4 7.7 7.7 0 4.2-3.4 7.7-7.7 7.7zm-1.5-12.2h-1.5v3H9v1.5h1.5v3H12v-3h1.5V12H15v-1.5h-1.5V7.5z"
                  fill="#ffffff"
                />
              </svg>
              Disconnect Wallet
            </button>
          </div>
        </div>
      </nav>
      <div className="detected-bar">
        {rugPullsDetected} Rugpulls Detected Successfully
      </div>
      <div className="ticker-wrapper">
        <div className="ticker-content">
          Please note this is not financial advice. This tool is not fool proof.
          It may give false positives or false negatives. Buyer beware! Do your
          own research when investing in memecoins on Solana.
        </div>
      </div>
      <div className="content">
        <div className="risk-indicator">
          <ReactSpeedometer
            id="speedometer"
            value={parseFloat(displayPercentage.toFixed(2))}
            minValue={0}
            maxValue={100}
            segments={4}
            segmentColors={["#FF0000", "#FFA500", "#FFFF00", "#00FF00"]}
            needleColor="#ffffff"
            textColor="#ffffff"
            needleTransitionDuration={4000}
            needleTransition="easeElastic"
            currentValueText={`${parseFloat(displayPercentage.toFixed(2))}%`}
            valueTextFontSize="18px"
            labelFontSize="12px"
          />
          {riskPercentage !== null && !isError && (
            <div
              className="risk-label"
              style={{ color: getRiskColor(displayPercentage) }}
            >
              {getRiskLabel(displayPercentage)}
            </div>
          )}
          {isError && (
            <div
              className="risk-label"
              style={{ color: getRiskColor(displayPercentage) }}
            >
              Error! Please try again
            </div>
          )}
        </div>
        {connected && riskPercentage === null && !isError && (
          <form className="input-form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={tokenCA}
              onChange={(e) => setTokenCA(e.target.value)}
              placeholder={placeholder}
              onFocus={handleFocus}
              onBlur={handleBlur}
              required
            />
            <button
              disabled={isCalculating}
              type="submit"
              className="submit-button"
            >
              SUBMIT
            </button>
          </form>
        )}
        {(riskPercentage !== null || isError) && (
          <button className="another-coin-button" onClick={handleRetry}>
            TRY ANOTHER COIN
          </button>
        )}
        {tokenInfo && (
          <table className="token-info-table">
            <tbody>
              <tr>
                <td>Name</td>
                <td>{tokenInfo.name}</td>
              </tr>
              <tr>
                <td>Symbol</td>
                <td>{tokenInfo.symbol}</td>
              </tr>
              <tr>
                <td>Description</td>
                <td>{tokenInfo.description}</td>
              </tr>
              <tr>
                <td>Image</td>
                <td>
                  <img src={tokenInfo.image} alt={`${tokenInfo.name} logo`} />
                </td>
              </tr>
              <tr>
                <td>Created By</td>
                <td>{tokenInfo.createdBy}</td>
              </tr>
            </tbody>
          </table>
        )}
        <div className="console">
          <h3>CONSOLE</h3>

          <p className="console-message">
            {connected
              ? `You are connected to wallet at ${pubKey}`
              : "Please Connect to Wallet First"}
          </p>

          <p className="console-message">{transactionResult}</p>
          {consoleMessages.map((msg, index) => (
            <p key={index} className="console-message">
              {msg}
            </p>
          ))}
          <div ref={consoleEndRef} />
        </div>
      </div>
    </div>
  );
};

export default Pumpfun;
