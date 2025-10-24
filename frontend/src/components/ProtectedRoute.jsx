import React, {useEffect, useState} from "react";
import {Navigate} from "react-router-dom";
import {LOCAL_BACKEND_URL, VITE_BACKEND_URL} from "../../../Constants.js";
import LoadingSpinner from "./LoadingSpinner.jsx";

export default function ProtectedRoute({children}) {
    const [loading, setLoading] = useState(true);
    const [loggedIn, setLoggedIn] = useState(false);

    useEffect(() => {
        fetch(
            (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) + "/auth/user",
            {credentials: "include"}
        )
            .then((res) => res.json())
            .then((data) => {
                setLoggedIn(data.loggedIn);
                setLoading(false);
            });
    }, []);


    if (loading) return <LoadingSpinner/>;
    if (!loggedIn) return <Navigate to="/"/>;

    return children;
}
