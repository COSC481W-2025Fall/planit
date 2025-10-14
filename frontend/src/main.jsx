import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import React from "react";
import './index.css'
import "./css/Global.css";
import "./css/TripPage.css";
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    <App />
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable={false}
        pauseOnHover
      />
    </BrowserRouter>
  </StrictMode>,
)
