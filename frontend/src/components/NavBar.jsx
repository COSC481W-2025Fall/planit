import React from "react";
import { NavLink } from "react-router-dom";
import "../css/NavBar.css";
import { Map, Settings } from "lucide-react";

export default function NavBar() {
    return (
        <aside className="sidebar">
            <nav className="nav-list">

                <NavLink
                    to="/trip"
                    end
                    className={({ isActive }) =>
                        "nav-item" + (isActive ? " active" : "")
                    }
                >
                    <Map className="nav-icon" size={20} />
                    <span>My Trips</span>
                </NavLink>

                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        "nav-item" + (isActive ? " active" : "")
                    }
                >
                    <Settings className="nav-icon" size={20} />
                    <span>Settings</span>
                </NavLink>

                <NavLink
                    to="/days"
                    className={({ isActive }) =>
                        "nav-item" + (isActive ? " active" : "")
                    }
                >
                    <Settings className="nav-icon" size={20} />
                    <span>Days</span>
                </NavLink>

            </nav>
        </aside>
    );
}
