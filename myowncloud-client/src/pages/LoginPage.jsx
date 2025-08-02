import { useState } from "react"; // setup react hooks
import axios from "axios"; // setup axios for API calls
import { useNavigate } from "react-router-dom"; // setup react router for navigation
import { Link } from "react-router-dom"; // import Link for navigation

export default function LoginPage() {
    const [email, setEmail] = useState(""); // state for email input
    const [password, setPassword] = useState(""); // state for password input
    const navigate = useNavigate(); // useNavigate hook for navigation

    const login = async (e) => {
        e.preventDefault(); // prevent default form submission behavior
        try {
            const res = await axios.post("http://localhost:8000/api/login", {
                email, // send email to backend
                password // send password to backend
            });
            localStorage.setItem("token", res.data.token); // store JWT token in local storage
            navigate("/dashboard"); // redirect to dashboard on successful login
        } catch (err) {
            // Handle different types of errors
            const errorMessage = err.response?.data?.message || err.message || "Login failed";
            
            if (errorMessage === "User not found with this email") {
                // Redirect to register page if user not found
                navigate("/register", { state: { email: email } });
            }
            else{ 
                // Show other errors normally
                alert("Login failed: " + errorMessage);
            }
        }
    };
    // UI rendering
    return (
        <div className="h-screen flex items-center justify-center bg-gray-100">
            <form onSubmit={login} className="bg-white p-8 rounded shadow w-80">
                <h2 className="text-xl font-bold mb-4">Login</h2>
                <input type="email" placeholder="Email" className="w-full mb-3 p-2 border rounded" onChange={e => setEmail(e.target.value)} />
                <input type="password" placeholder="Password" className="w-full mb-3 p-2 border rounded" onChange={e => setPassword(e.target.value)} />
                <button className="bg-blue-500 text-white px-4 py-2 rounded">Login</button>

                <p className="text-sm text-center mt-3">
                    Don't have an account?{" "}
                    <Link to="/register" className="text-blue-600 underline">Register</Link>
                </p>
            </form>
        </div>
    );
}