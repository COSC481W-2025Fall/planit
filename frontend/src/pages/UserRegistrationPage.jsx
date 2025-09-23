/* 
Page for testing the createUsername, modifyUser, readUser, and deleteUser endpoints
This page is just a test page so it is not linked to anywhere in the app(unless your account username is "NULL"), 
so to access it, manually change the URL to http://localhost:5173/registration when running locally.
Only the createUsername functionality should be kept for this page.
The other endpoint usage should be moved to a new page called UserSettingsPage.jsx or something similar.
*/
import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import {LOCAL_BACKEND_URL, VITE_BACKEND_URL} from "../../../Constants.js";

export default function UserRegistrationPage() {
    const [user, setUser] = useState(null); // store logged-in user

    // Store state information for creating username
    const [createUsername, setCreateUsername] = useState("");

    //Need to store state information for modifying user info. This won't be needed once we move this functionality to a separate settings page.
    const [firstname, setFirstname] = useState(user?.first_name || "");
    const [lastname, setLastname] = useState(user?.last_name || "");
    const [modifyUsername, setModifyUsername] = useState(user?.username || "");
    const [email, setEmail] = useState(user?.email || "");

    // run this code when the component first loads
    // useEffect hook to fetch user info to see if user is logged in
    useEffect(() => {
        // make a request to the backend and include cookies for authentication
        fetch((import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) + "/auth/login/details", { credentials: "include" })
        .then((res) => res.json())

        // convert the server response into a javascript object
        .then((data) => {
            // once the data is ready, check if the user is logged in

            // if not logged in, stop here and do nothing
            if (data.loggedIn === false) return;

            // if logged in, save user info in state so the component can use it
            setUser(data);
        });
    }, []);
    // the empty array means this effect only runs once when the component loads

    // Function to send requests to the backend
    const sendRequest = async (endpoint, method, body = null) => {
        const options = { method, credentials: "include", headers: {} };

        if (body && method !== "GET") {
            options.headers["Content-Type"] = "application/json";
            options.body = JSON.stringify(body);
        }

        const response = await fetch((import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) + `/user/${endpoint}`, options)
        const data = await response.json();

        if (data.user) setUser(data.user);
            return data;
    };

    // If user data is not yet loaded, show a loading message. Page will often crash without this.
    if (!user) {
        return <p>Loading...</p>;
    }

  return (
    <div>
        <h2>Username Testing</h2>

        {/* Create username */}
        <div>
            <strong>Create Username Here</strong>
            <div><input type="text" placeholder="Enter username" value={createUsername} onChange={(e) => setCreateUsername(e.target.value)}/></div>
            <div><button onClick={async() => await sendRequest("create", "POST", { userId: user.user_id, createUsername })}>Create</button></div>
        </div>
        {/* Modify first name */}
        <div>
            <strong>Modify First Name Here</strong>
            <div><input type="text" placeholder="Modify first name" value={firstname} onChange={(e) => setFirstname(e.target.value)}/></div>
            <div><button onClick={async() => await sendRequest("update", "PUT", { userId: user.user_id, field: "first_name", value: firstname })}>Modify first name</button></div>
        </div>

        {/* Modify last name */}
        <div>
            <strong>Modify Last Name Here</strong>
            <div><input type="text" placeholder="Modify last name" value={lastname} onChange={(e) => setLastname(e.target.value)}/></div>
            <div><button onClick={async() => await sendRequest("update", "PUT", { userId: user.user_id, field: "last_name", value: lastname })}>Modify last name</button></div>
        </div>

        {/* Modify username*/}
        <div>
            <strong>Modify Username Here</strong>
            <div><input type="text" placeholder="Modify username" value={modifyUsername} onChange={(e) => setModifyUsername(e.target.value)}/></div>
            <div><button onClick={async() => await sendRequest("update", "PUT", { userId: user.user_id, field: "username", value: modifyUsername })}>Modify username</button></div>
        </div>

        {/* Modify email */}
        <div>
            <strong>Modify Email Here</strong>
            <div><input type="text" placeholder="Modify email" value={email} onChange={(e) => setEmail(e.target.value)}/></div>
            <div><button onClick={async() => await sendRequest("update", "PUT", { userId: user.user_id, field: "email", value: email })}>Modify email</button></div>
        </div>

        {/* Read user info*/}
        <div>
            <strong>Read User Info</strong>
            <div><button onClick={async() => await sendRequest("read", "GET")}>Read</button></div>

            <div>
                <h2>User Info</h2>
                <p><strong>First Name:</strong> {user.first_name}</p>
                <p><strong>Last Name:</strong> {user.last_name}</p>
                <p><strong>Username:</strong> {user.username}</p>
                <p><strong>Email:</strong> {user.email}</p>
            </div>
        </div>

        {/* Delete user */}
        <div>
            <strong>Delete User</strong>
            <div><button onClick={async() => await sendRequest("delete", "DELETE", { userId: user.user_id })}>Delete</button></div>
        </div>
    </div>
  );
}