import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import React from "react";
import './index.css'
import "./css/Global.css";
import "./css/TripPage.css";
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { ToastContainer, Flip, Bounce , Zoom } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider } from "./theme/ThemeProvider.jsx";
import axios from "axios";
import { toast } from "react-toastify";

axios.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.error;

    if (msg === "Profanity detected.") {
      toast.error("Profanity detected.");
      return Promise.reject(err);
    }

    if (msg) toast.error(msg);

    return Promise.reject(err);
  }
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
        <ToastContainer
          position="top-right"
          autoClose={2000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          theme="light"
          draggable={false}
          transition={Zoom}
          pauseOnHover
        />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);