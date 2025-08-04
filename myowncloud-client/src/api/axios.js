// Setup axios auth helper
import axios from 'axios'; // Importing axios for HTTP requests

const instance = axios.create({
    baseURL: 'http://localhost:8000/api', // Base URL for the API
});

instance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token"); // Retrieve token from local storage
    if (token) {
        config.headers.Authorization = `Bearer ${token}`; // Set the Authorization header with the token
    }
    return config; // Return the modified config
});

export default instance; // Export the configured axios instance