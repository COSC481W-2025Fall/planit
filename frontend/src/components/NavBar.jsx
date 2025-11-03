import React from "react";
import {NavLink} from "react-router-dom";
import "../css/NavBar.css";
import {Map, Settings, Users} from "lucide-react";

export default function NavBar({isOpen}) {
    return (
        <aside className={`sidebar ${isOpen ? "open" : ""}`}>
            <nav className="nav-list">
                <NavLink
                    to="/trip"
                    end
                    className={({isActive}) =>
                        "nav-item" + (isActive ? " active" : "")
                    }
                >
                    <Map className="nav-icon" size={20}/>
                    <span>My Trips</span>
                </NavLink>
                <NavLink
                    to ="/sharedTrips"
                    className={({isActive}) =>
                        "nav-item" + (isActive ? " active" : "")
                    }
                >
                    <Users className="nav-icon" size={20}/>
                    <span>Shared With Me</span>
                </NavLink>

                <NavLink
                    to="/settings"
                    className={({isActive}) =>
                        "nav-item" + (isActive ? " active" : "")
                    }
                >
                    <Settings className="nav-icon" size={20}/>
                    <span>Settings</span>
                </NavLink>
            </nav>
        </aside>
    );
}
