import React, {useEffect, useState} from "react";
import {NavLink} from "react-router-dom";
import "../css/NavBar.css";
import {Map, Settings, Binoculars, Users, Dot} from "lucide-react";
import { LOCAL_BACKEND_URL, VITE_BACKEND_URL } from "../../../Constants.js";

export default function NavBar({isOpen}) {
    const [hasUnseen, setHasUnseen] = useState(false);
    useEffect(() => {
        async function check() {
            const unseen = await handleCheckSeen();
            setHasUnseen(unseen);
        }
        check();
    }, []);

    async function handleCheckSeen() {
        try {
            const res = await fetch(`${import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL}/shared/checkTrips`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );

            //true if unseen exists, false otherwise
            const data = await res.json();
            return data.unseen;
        } catch (err) {
            toast.error("There was a problem checking seen trips")
        }
    }

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
                    <span className="share-nav-icon">
                        Shared With Me
                        {hasUnseen && (
                            <span className="unseen-trip-indicator"></span>
                        )}
                    </span>
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
