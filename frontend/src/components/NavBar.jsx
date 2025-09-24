import React from "react";
import { NavLink } from "react-router-dom";
import "../css/NavBar.css"; //
import { Map, Settings } from "lucide-react";

// Sidebar navigation component
export default function NavBar() {
    return (
        <aside className="sidebar">
            <nav className="nav_list">

                <NavLink
                    to="/trip"
                    end
                    className={({ isActive }) =>
                        "nav_item" + (isActive ? " active" : "")
                    }
                >
                    <Map className="nav_icon" size={20} />
                    <span>My Trips</span>
                </NavLink>

                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        "nav_item" + (isActive ? " active" : "")
                    }
                >
                    <Settings className="nav_icon" size={20} />
                    <span>Settings</span>
                </NavLink>

            </nav>
        </aside>
    );
}
