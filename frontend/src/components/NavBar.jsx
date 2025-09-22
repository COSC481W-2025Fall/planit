import React from "react";
import { NavLink } from "react-router-dom"; // For navigation with active link highlighting
import "../css/NavBar.css"; // Styles for the sidebar and nav items
import { Map, Settings } from "lucide-react"; // Icon components

// Sidebar navigation component
export default function NavBar() {
    return (
        <aside className="sidebar"> {/* Sidebar container */}
            <nav className="nav_list"> {/* Navigation list container */}

                {/* Link to Trip page */}
                <NavLink
                    to="/trip"
                    end // Makes this exact path match (avoids matching nested routes like /trip/something)
                    className={({ isActive }) =>
                        "nav_item" + (isActive ? " active" : "")
                    } // Add "active" class if current URL matches
                >
                    <Map className="nav_icon" size={20} /> {/* Trip icon */}
                    <span>My Trips</span>
                </NavLink>

                {/* Link to Settings page */}
                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        "nav_item" + (isActive ? " active" : "")
                    }
                >
                    <Settings className="nav_icon" size={20} /> {/* Settings icon */}
                    <span>Settings</span>
                </NavLink>

            </nav>
        </aside>
    );
}
