import React from "react";
import { NavLink } from "react-router-dom";
import "../css/NavBar.css";
import { Map, Settings, Binoculars } from "lucide-react";

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
                    to="/explore"
                    end
                    className={({ isActive }) =>
                        "nav-item" + (isActive ? " active" : "")
                    }
                >
                    <Binoculars className="nav-icon" size={20} />
                    <span>Explore</span>
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
                
            </nav>
        </aside>
    );
}
