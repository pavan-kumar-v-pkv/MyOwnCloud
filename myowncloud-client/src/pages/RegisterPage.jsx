import { useState } from "react"; // Setup react router hooks
import axios from "axios"; // Setup axios for API calls
import { useNavigate } from "react-router-dom"; // Setup react router for navigation
import { Link } from "react-router-dom"; // Import Link for naviagtion
import { useLocation } from "react-router-dom"; // Import useLocation to access passed state

export default function RegisterPage() {
    const location = useLocation(); // Get the location object
    const [name, setName] = useState(""); // State for name input
    const [email, setEmail] = useState(location.state?.email || ""); // Pre-fill email if passed from login page
    const [password, setPassword] = useState(""); // State for password input
    const navigate = useNavigate(); // UseNavigate hook for navigation

    const register = async (e) => {
        e.preventDefault(); // Prevent default form submission behavior
        try {
            await axios.post("http://localhost:8000/api/register", {
                name, // Send name to backend
                email, // Send email to backend
                password // Send password to backend
            });
            navigate("/"); // Redirect to login page on successful registration
        }
        catch (err) {
            // Handle different types of errors
            const errorMessage = err.response?.data?.message || err.message || "Registration failed";
            alert("Registration failed: " + errorMessage);
        }
    };

    // UI rendering
    return (
        <div className="h-screen flex items-center justify-center bg-gray-100">
            <form onSubmit={register} className="bg-white p-8 rounded shadow w-80">
                <h2 className="text-xl font-bold mb-4">Register</h2>
                <input type="text" placeholder="Name" className="w-full mb-3 p-2 border rounded" onChange={e => setName(e.target.value)} />
                <input type="email" placeholder="Email" value={email} className="w-full mb-3 p-2 border rounded" onChange={e => setEmail(e.target.value)} />
                <input type="password" placeholder="Password" className="w-full mb-3 p-2 border rounded" onChange={e => setPassword(e.target.value)} />
                <button className="bg-green-500 text-white px-4 py-2 rounded w-full">Register</button>

                <p className="text-sm text-center mt-3">
                    Already have an account?{" "}
                    <Link to="/" className="text-blue-600 underline">Login</Link>
                </p>
            </form>
        </div>
    );
}
