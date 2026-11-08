import { useState } from "react";

//stores the password info, username, and server reponse
function Login({ onLoginSuccess }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage("");

        try {
            const response = await fetch("http://localhost:9000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message || "Login failed");
                return;
            }

            const usersResponse = await fetch("http://localhost:9000/users");

            if (!usersResponse.ok) {
                setMessage("Login succeeded, but the user profile could not be loaded");
                return;
            }

            const users = await usersResponse.json();
            const loggedInUser = users.find(
                (user) => user.username === username
            );

            if (!loggedInUser) {
                setMessage("Could not find your user profile");
                return;
            }

            setMessage("Login successful");

            if (onLoginSuccess) {
                onLoginSuccess(loggedInUser);
            }
        } catch (error) {
            console.error(error);
            setMessage("Could not connect to the server");
        }
    };

    return (
        <div className="login-container">
            <h2>Log In</h2>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                />

                <button type="submit">Log In</button>
            </form>

            {message && <p>{message}</p>}
        </div>
    );
}

export default Login;