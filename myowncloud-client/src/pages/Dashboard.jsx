import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import Header from "../components/Header";

export default function Dashboard() {
    const [file, setFile] = useState(null);
    const [files, setFiles] = useState([]);
    const [darkMode, setDarkMode] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    const fetchFiles = async () => {
        try {
            const res = await axios.get("/files");
            setFiles(res.data.files);
        } catch (err) {
            console.error("Error fetching files:", err);
        }
    };

    const fetchUserInfo = async () => {
        try {
            // We'll need to decode the JWT token to get user info
            const token = localStorage.getItem("token");
            if (token) {
                // For now, let's use a placeholder. We'll improve this later
                setUser({ name: "Demo User", email: "demo@test.com" });
            }
        } catch (err) {
            console.error("Error fetching user info:", err);
        }
    };

    useEffect(() => {
        fetchFiles();
        fetchUserInfo();
        // Check for saved dark mode preference
        const savedDarkMode = localStorage.getItem("darkMode") === "true";
        setDarkMode(savedDarkMode);
        if (savedDarkMode) {
            document.documentElement.classList.add("dark");
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("darkMode");
        navigate("/");
    };

    const toggleDarkMode = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        localStorage.setItem("darkMode", newDarkMode.toString());
        
        if (newDarkMode) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if(!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            await axios.post("/upload", formData);
            setFile(null);
            fetchFiles();
        }
        catch (err) {
            console.error("Error uploading file:", err);
        }
    };

    const handleDownload = async (id) => {
        try {
            const response = await axios.get(`/files/${id}`, {
                responseType: 'blob'
            });
            
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            const contentDisposition = response.headers['content-disposition'];
            let filename = `file_${id}`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }
            
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Error downloading file:", err);
            alert("Failed to download file. Please try again.");
        }
    };

    const handleShare = async (id) => {
        try {
            const res = await axios.post(`/files/${id}/share`);
            navigator.clipboard.writeText(res.data.shareableUrl);
            alert("Shareable link copied to clipboard!");
        } catch (err) {
            console.error("Error sharing file:", err);
            alert("Failed to copy shareable link. Please try again.");
        }
    };

    return (
        <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
            <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
                <Header 
                    user={user}
                    onLogout={handleLogout}
                    darkMode={darkMode}
                    toggleDarkMode={toggleDarkMode}
                />
                
                <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                                My Files
                            </h2>

                            {/* Upload Form */}
                            <form onSubmit={handleUpload} className="mb-8">
                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                                    <input 
                                        type="file" 
                                        onChange={(e) => setFile(e.target.files[0])} 
                                        className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/20 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/30"
                                    />
                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                        Choose a file to upload to your cloud storage
                                    </p>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={!file}
                                    className="mt-4 w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Upload File
                                </button>
                            </form>

                            {/* Files List */}
                            <div className="space-y-3">
                                {files.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-gray-500 dark:text-gray-400">No files uploaded yet</p>
                                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Upload your first file to get started</p>
                                    </div>
                                ) : (
                                    files.map((f) => (
                                        <div key={f.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-900 dark:text-white">
                                                    {f.filename}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {f.mimetype || f.mimeType}
                                                </p>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button 
                                                    onClick={() => handleDownload(f.id)} 
                                                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 transition-colors"
                                                >
                                                    Download
                                                </button>
                                                <button 
                                                    onClick={() => handleShare(f.id)} 
                                                    className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 transition-colors"
                                                >
                                                    Share
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}