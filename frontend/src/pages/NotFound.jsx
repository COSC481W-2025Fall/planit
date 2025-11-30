import React from "react";
import "../css/NotFound.css";
import planeImage from "../assets/plane.png";

export default function NotFound() {
  return (
    <div className="notfound-container">
      <img src={planeImage} alt="Airplane" className="plane" />
      <div className="text-box">
        <h1>Oops!</h1>
        <p>
          The page you were looking for<br />
          could not be found.
        </p>
        <a href="/" className="home-btn">
          Back To Home
        </a>
      </div>
    </div>
  );
}
