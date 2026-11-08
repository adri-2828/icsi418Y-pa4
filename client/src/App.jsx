import Signup from "./components/Signup";
import Login from "./components/Login";
import ProjectDashboard from "./components/ProjectDashboard";
import "./App.css";
import { useState } from "react";

function App() {
    const [loggedInUser, setLoggedInUser] = useState(null);

    const hearts = [
        { left: "5%", top: "10%", size: "24px", delay: "0s", duration: "5s" },
        { left: "15%", top: "75%", size: "18px", delay: "1s", duration: "6s" },
        { left: "25%", top: "20%", size: "30px", delay: "2s", duration: "7s" },
        { left: "35%", top: "85%", size: "20px", delay: "0.5s", duration: "5.5s" },
        { left: "45%", top: "8%", size: "18px", delay: "1.5s", duration: "6.5s" },
        { left: "55%", top: "78%", size: "28px", delay: "3s", duration: "7s" },
        { left: "65%", top: "15%", size: "20px", delay: "0.8s", duration: "5.5s" },
        { left: "75%", top: "88%", size: "24px", delay: "2.5s", duration: "6s" },
        { left: "85%", top: "25%", size: "30px", delay: "1s", duration: "7.5s" },
        { left: "92%", top: "65%", size: "18px", delay: "3.5s", duration: "5s" },
        { left: "8%", top: "45%", size: "20px", delay: "2s", duration: "6.5s" },
        { left: "30%", top: "55%", size: "16px", delay: "4s", duration: "5.5s" },
        { left: "70%", top: "48%", size: "22px", delay: "1.5s", duration: "7s" },
        { left: "88%", top: "42%", size: "16px", delay: "2.5s", duration: "6s" }
    ];

    return (
        <div>
            <div className="hearts">
                {hearts.map((heart, index) => (
                    <span
                        key={index}
                        className="heart"
                        style={{
                            left: heart.left,
                            top: heart.top,
                            fontSize: heart.size,
                            animationDelay: heart.delay,
                            animationDuration: heart.duration
                        }}
                    >
                        ♥
                    </span>
                ))}
            </div>

            {loggedInUser ? (
                <ProjectDashboard
                    loggedInUser={loggedInUser}
                    onLogout={() => setLoggedInUser(null)}
                />
            ) : (
                <div className="forms">
                    <Signup />
                    <Login onLoginSuccess={setLoggedInUser} />
                </div>
            )}
        </div>
    );
}

export default App;