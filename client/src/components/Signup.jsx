import { useState } from "react";

function Signup() {
    const [formData, setFormData] = useState({
        f_name: "",
        l_name: "",
        username: "",
        password: ""
    });

    const [message, setMessage] = useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            const response = await fetch("http://localhost:9000/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            setMessage(data.message);

            if (response.ok) {
                setFormData({
                    f_name: "",
                    l_name: "",
                    username: "",
                    password: ""
                });
            }
        } catch (error) {
            console.error(error);
            setMessage("Could not connect to the server");
        }
    };

    return (
        <div className="signup-container">
            <h2>Sign Up</h2>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="f_name"
                    placeholder="First Name"
                    value={formData.f_name}
                    onChange={handleChange}
                />

                <input
                    type="text"
                    name="l_name"
                    placeholder="Last Name"
                    value={formData.l_name}
                    onChange={handleChange}
                />

                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleChange}
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                />

                <button type="submit">Sign Up</button>
            </form>

            {message && <p>{message}</p>}
        </div>
    );
}

export default Signup;