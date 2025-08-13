import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import BreadcrumbHeader from "../components/BreadcrumbHeader";
import FileUploadZone from "../components/FileUploadZone";
import FileGrid from "../components/FileGrid";

export default function Dashboard() {
    const [selectedFiles, setSelectedFiles] = useState([]); // For multi-file upload
    const [selectedFileIds, setSelectedFileIds] = useState([]); // For bulk actions
    const [currentFolderId, setCurrentFolderId] = useState(null); // For nested folder navigation
    const [searchResults, setSearchResults] = useState([]);
    const [isSearchActive, setIsSearchActive] = useState(false);

    // Search handlers
    const handleSearchResults = (results) => {
        console.log("Dashboard received search results:", results);
        setSearchResults(results);
        setIsSearchActive(results.length > 0);
    };

    // Bulk selection handlers
    const handleSelectFile = (fileId) => {
        setSelectedFileIds((prev) =>
            prev.includes(fileId)
                ? prev.filter((id) => id !== fileId)
                : [...prev, fileId]
        );
    };

    const handleSelectAll = () => {
        if (selectedFileIds.length === visibleFiles.length) {
            setSelectedFileIds([]);
        } else {
            setSelectedFileIds(visibleFiles.map((f) => f.id));
        }
    };

    // Bulk delete handler
    const handleBulkDelete = async () => {
        if (selectedFileIds.length === 0) return;
        if (!window.confirm('Are you sure you want to delete the selected files?')) return;
        try {
            const response = await axios.post('/bulk-delete', { fileIds: selectedFileIds });
            console.log("Delete response:", response.data);
            setSelectedFileIds([]);
            
            // Refresh both files and folders
            await Promise.all([fetchFiles(), fetchFolders()]);
            
            // Show success message
            alert(`Successfully deleted ${response.data.count || selectedFileIds.length} file(s)!`);
        } catch (err) {
            console.error("Failed to delete files:", err.response?.data || err.message);
            alert('Failed to delete files: ' + (err.response?.data?.message || err.message));
        }
    };

    // Bulk download as zip handler
    const handleBulkDownloadZip = async () => {
        if (selectedFileIds.length === 0) return;
        try {
            const response = await axios.post('/download-zip', { fileIds: selectedFileIds }, { responseType: 'blob' });
            const blob = new Blob([response.data], { type: 'application/zip' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'files.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('Failed to download zip');
            console.error(err);
        }
    };

    const [files, setFiles] = useState([]);
    const [folders, setFolders] = useState([]);
    const [selectedFolderId, setSelectedFolderId] = useState("");
    const [newFolderName, setNewFolderName] = useState("");
    const [creatingFolder, setCreatingFolder] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    const fetchFolders = async() => {
        try {
            const res = await axios.get("/folders", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            console.log("Folders response:", res.data);
            // Handle both possible response formats
            const foldersData = res.data.folders || res.data || [];
            setFolders(foldersData);
        } catch (err) {
            console.error("Error fetching folders:", err);
        }
    };

    // Helper: get current folder object
    const currentFolder = currentFolderId ? folders.find(f => f.id === currentFolderId) : null;

    // Helper: get subfolders of current folder
    const subfolders = folders.filter(f => f.parentId === currentFolderId);

    // Inline folder creation handler
    const handleCreateFolder = async (e) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;
        setCreatingFolder(true);
        try {
            console.log("Creating folder with name:", newFolderName);
            const res = await axios.post(
                "/folders",
                { name: newFolderName, parentId: currentFolderId || null },
                { 
                    headers: { 
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("token")}` 
                    } 
                }
            );
            console.log("Folder creation response:", res.data);
            
            // Refresh the folders list
            await fetchFolders();
            
            // Clear the input
            setNewFolderName("");
            
            // Optionally auto-select and navigate to the new folder
            if (res.data.folder && res.data.folder.id) {
                setCurrentFolderId(res.data.folder.id);
                console.log("Auto-navigated to new folder:", res.data.folder.id);
            }
            
            // Show success message
            alert(`Folder "${newFolderName}" created successfully!`);
        } catch (err) {
            console.error("Failed to create folder:", err.response?.data || err.message);
            alert("Failed to create folder: " + (err.response?.data?.error || err.message));
        } finally {
            setCreatingFolder(false);
        }
    };

    // Delete folder handler
    const handleDeleteFolder = async (folderId, folderName) => {
        const confirmMessage = `Are you sure you want to delete the folder "${folderName}"?\n\nThis will permanently delete the folder and ALL files and subfolders within it. This action cannot be undone.`;
        
        if (!window.confirm(confirmMessage)) {
            return;
        }
        
        try {
            console.log("Deleting folder with ID:", folderId);
            const response = await axios.delete(`/folders/${folderId}`);
            console.log("Delete folder response:", response.data);
            
            // If the deleted folder was selected or we're currently viewing it, go back to root
            if (selectedFolderId === String(folderId) || currentFolderId === folderId) {
                setCurrentFolderId(null);
            }
            
            // Refresh both files and folders
            await Promise.all([fetchFiles(), fetchFolders()]);
            
            // Show success message
            alert(`Folder "${folderName}" and all its contents have been deleted successfully!`);
        } catch (err) {
            console.error("Failed to delete folder:", err.response?.data || err.message);
            alert("Failed to delete folder: " + (err.response?.data?.error || err.message));
        }
    };

    const fetchFiles = async () => {
        try {
            console.log("DEBUGGING: fetchFiles() called");
            const res = await axios.get("/files", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            console.log("DEBUGGING: Files response:", res.data);
            
            // Handle both possible response formats
            const filesData = res.data.files || res.data || [];
            console.log("DEBUGGING: Setting files to:", filesData.length, "files");
            console.log("DEBUGGING: Files details:", filesData.map(f => ({ 
                id: f.id, 
                filename: f.filename, 
                folderId: f.folderId, 
                folderIdType: typeof f.folderId 
            })));
            setFiles(filesData);
        } catch (err) {
            console.error("DEBUGGING: Error fetching files:", err);
        }
    };

    // Helper: filter files by current folder - FIXED VERSION
    const visibleFiles = currentFolderId
        ? files.filter(f => {
            // Handle both number and string comparisons to ensure compatibility
            const fileFolderId = f.folderId;
            const currentFolderIdNum = currentFolderId;
            
            // Convert both to numbers for comparison if they exist
            const fileFolder = fileFolderId ? (typeof fileFolderId === 'string' ? parseInt(fileFolderId) : fileFolderId) : null;
            const currentFolder = currentFolderId ? (typeof currentFolderId === 'string' ? parseInt(currentFolderId) : currentFolderId) : null;
            
            const matches = fileFolder === currentFolder;
            
            console.log(`DEBUGGING: File ${f.filename} - folderId: ${fileFolderId} (${typeof fileFolderId}) -> ${fileFolder}, currentFolderId: ${currentFolderId} (${typeof currentFolderId}) -> ${currentFolder}, matches: ${matches}`);
            
            return matches;
        })
        : files.filter(f => !f.folderId || f.folderId === null);
    
    console.log("DEBUGGING: Current folder ID:", currentFolderId, "(type:", typeof currentFolderId, "), total files:", files.length, "visible files count:", visibleFiles.length);
    console.log("DEBUGGING: Visible files:", visibleFiles.map(f => ({ id: f.id, filename: f.filename, folderId: f.folderId })));

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
        fetchFolders();
        fetchFiles();
        fetchUserInfo();
        // Check for saved dark mode preference
        const savedDarkMode = localStorage.getItem("darkMode") === "true";
        setDarkMode(savedDarkMode);
        if (savedDarkMode) {
            document.documentElement.classList.add("dark");
        }
    }, []);

    // Synchronize selectedFolderId with currentFolderId
    useEffect(() => {
        // When currentFolderId changes, update selectedFolderId to match
        const folderIdStr = currentFolderId ? String(currentFolderId) : "";
        setSelectedFolderId(folderIdStr);
    }, [currentFolderId]);

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
        if(selectedFiles.length === 0) return;

        const formData = new FormData();
        for (let i = 0; i < selectedFiles.length; i++) {
            formData.append("files", selectedFiles[i]); // 'files' must match backend field
        }
        // Convert selectedFolderId to number if it exists, or don't send it if empty
        if(selectedFolderId && selectedFolderId !== "") {
            const folderId = parseInt(selectedFolderId);
            console.log("Converting selectedFolderId:", selectedFolderId, "to number:", folderId);
            formData.append("folderId", folderId);
        }

        try {
            console.log("Uploading files to folder:", selectedFolderId, "currentFolderId:", currentFolderId);
            console.log("Form data folderId:", formData.get("folderId"));
            const response = await axios.post("/upload", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${localStorage.getItem("token")}`
                }
            });
            console.log("Upload response:", response.data);
            
            // Clear the selected files
            setSelectedFiles([]);
            
            // Reset the file input
            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput) {
                fileInput.value = '';
            }
            
            // Small delay to ensure database operations complete
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Refresh both files and folders (in case new files affect folder structure)
            await Promise.all([fetchFiles(), fetchFolders()]);
            
            // Force re-render by updating state
            console.log("Files refreshed after upload, current files state:", files.length);
            
            // Show success message
            alert(`Successfully uploaded ${response.data.fileIds?.length || selectedFiles.length} file(s)!`);
        }
        catch (err) {
            console.error("Error uploading file:", err.response?.data || err.message);
            alert("Error uploading file: " + (err.response?.data?.message || err.message));
        }
    };

    const handleDownload = async (id) => {
        try {
            const response = await axios.get(`/files/${id}`, {
                responseType: 'blob',
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
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
            const res = await axios.post(`/files/${id}/share`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            navigator.clipboard.writeText(res.data.shareableUrl);
            alert("Shareable link copied to clipboard!");
        } catch (err) {
            console.error("Error sharing file:", err);
            alert("Failed to copy shareable link. Please try again.");
        }
    };

    const handleAnalyze = async (id) => {
        try {
            console.log("Analyzing file with ID:", id);
            const res = await axios.post(`/files/${id}/analyze`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            console.log("Analysis result:", res.data);
            alert("File analyzed successfully! It can now be searched using AI.");
            // Refresh files to show updated data
            await fetchFiles();
        } catch (err) {
            console.error("Error analyzing file:", err);
            alert("Failed to analyze file: " + (err.response?.data?.message || err.message));
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
                
                {/* Main Layout with Sidebar and Content */}
                <div className="flex h-screen pt-16"> {/* pt-16 to account for fixed header */}
                    
                    {/* Left Sidebar */}
                    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">My Cloud</h2>
                            
                            {/* AI Search Bar */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    🔍 AI Search
                                </label>
                                <SearchBar onResults={handleSearchResults} />
                            </div>
                        </div>

                        {/* Navigation & Quick Actions */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Folder Navigation */}
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Navigation</h3>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setCurrentFolderId(null)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                            !currentFolderId 
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        📁 All Files
                                    </button>
                                </div>
                            </div>

                            {/* Folders */}
                            {subfolders.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Folders</h3>
                                    <div className="space-y-1">
                                        {subfolders.map(folder => (
                                            <div key={folder.id} className="flex items-center group">
                                                <button
                                                    onClick={() => setCurrentFolderId(folder.id)}
                                                    className={`flex-1 text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                                        currentFolderId === folder.id
                                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }`}
                                                >
                                                    � {folder.name}
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteFolder(folder.id, folder.name);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-opacity"
                                                    title={`Delete folder "${folder.name}"`}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Create New Folder */}
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Actions</h3>
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="New folder name"
                                            value={newFolderName}
                                            onChange={e => setNewFolderName(e.target.value)}
                                            className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                        <button
                                            onClick={handleCreateFolder}
                                            disabled={creatingFolder || !newFolderName.trim()}
                                            className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                                        >
                                            {creatingFolder ? "..." : "📁+"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Bulk Actions (when files selected) */}
                            {selectedFileIds.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Selected ({selectedFileIds.length})
                                    </h3>
                                    <div className="space-y-2">
                                        <button
                                            onClick={handleBulkDelete}
                                            className="w-full bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                                        >
                                            🗑️ Delete Selected
                                        </button>
                                        <button
                                            onClick={handleBulkDownloadZip}
                                            className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                        >
                                            📦 Download as Zip
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Breadcrumb Header */}
                        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                    <button
                                        onClick={() => setCurrentFolderId(null)}
                                        className={`font-medium ${!currentFolderId ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'} hover:underline`}
                                    >
                                        Home
                                    </button>
                                    {currentFolder && (
                                        <>
                                            <span className="text-gray-400">/</span>
                                            <span className="font-medium text-blue-600">{currentFolder.name}</span>
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedFileIds.length === visibleFiles.length && visibleFiles.length > 0}
                                        onChange={handleSelectAll}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {selectedFileIds.length > 0 ? `${selectedFileIds.length} selected` : 'Select all'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* File Content Area */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Upload Zone */}
                            <div className="mb-8">
                                <form onSubmit={handleUpload}>
                                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-800/50">
                                        <div className="text-4xl mb-4">☁️</div>
                                        <input
                                            type="file"
                                            multiple
                                            accept="*/*"
                                            onChange={(e) => {
                                                const files = Array.from(e.target.files);
                                                console.log("Selected files:", files.map(f => ({ name: f.name, type: f.type, size: f.size })));
                                                setSelectedFiles(files);
                                            }}
                                            className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/20 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/30"
                                        />
                                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                            Drag and drop files here, or click to browse
                                        </p>
                                        {selectedFiles.length > 0 && (
                                            <div className="mt-4">
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Selected files ({selectedFiles.length}):
                                                </p>
                                                <div className="max-h-20 overflow-y-auto">
                                                    {selectedFiles.map((file, idx) => (
                                                        <div key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                                                            {file.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {selectedFiles.length > 0 && (
                                        <div className="mt-4 flex items-center gap-4">
                                            <select 
                                                value={selectedFolderId}
                                                onChange={(e) => {
                                                    const folderId = e.target.value;
                                                    setSelectedFolderId(folderId);
                                                    setCurrentFolderId(folderId ? parseInt(folderId) : null);
                                                }}
                                                className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            >
                                                <option value="">Upload to current location</option>
                                                {folders.map((folder) => (
                                                    <option key={folder.id} value={folder.id}>
                                                        📁 {folder.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="submit"
                                                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                                            >
                                                Upload Files
                                            </button>
                                        </div>
                                    )}
                                </form>
                            </div>
                            {/* Files List - Search Results or Normal Files */}
                            {isSearchActive ? (
                                /* Search Results View */
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                            Search Results ({searchResults.length})
                                        </h2>
                                        <button
                                            onClick={() => {
                                                setSearchResults([]);
                                                setIsSearchActive(false);
                                            }}
                                            className="text-blue-600 hover:underline text-sm"
                                        >
                                            Clear search
                                        </button>
                                    </div>
                                    
                                    {searchResults.length === 0 ? (
                                        <div className="text-center py-16">
                                            <div className="text-6xl mb-4">🔍</div>
                                            <p className="text-gray-500 dark:text-gray-400 text-lg">No files found matching your search</p>
                                            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Try different keywords or analyze more files</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                            {searchResults.map((f) => (
                                                <div key={f.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex-1">
                                                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                                                {f.filename}
                                                            </h3>
                                                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs mr-2">
                                                                    {f.category}
                                                                </span>
                                                                <span className="text-xs">Score: {(f.score || 0).toFixed(3)}</span>
                                                            </div>
                                                            {f.tags && f.tags.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 mt-2">
                                                                    {f.tags.slice(0, 3).map((tag, idx) => (
                                                                        <span key={idx} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                                                                            {tag}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                                {f.mimetype || f.mimeType} • {Math.round(f.size / 1024)} KB
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => handleDownload(f.id)} 
                                                            className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                                                        >
                                                            Download
                                                        </button>
                                                        <button 
                                                            onClick={() => handleShare(f.id)} 
                                                            className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                                                        >
                                                            Share
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Normal File List View */
                                <div>
                                    <div className="mb-6">
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                            {currentFolder ? `Files in ${currentFolder.name}` : 'All Files'} ({visibleFiles.length})
                                        </h2>
                                    </div>
                                    
                                    {visibleFiles.length === 0 ? (
                                        <div className="text-center py-16">
                                            <div className="text-6xl mb-4">📁</div>
                                            <p className="text-gray-500 dark:text-gray-400 text-lg">
                                                {currentFolderId ? 'No files in this folder' : 'No files uploaded yet'}
                                            </p>
                                            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                                                {currentFolderId ? 'Upload files to this folder to get started' : 'Upload your first file to get started'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                            {visibleFiles.map((f) => (
                                                <div key={f.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex items-start mb-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedFileIds.includes(f.id)}
                                                            onChange={() => handleSelectFile(f.id)}
                                                            className="mt-1 mr-3"
                                                        />
                                                        
                                                        {/* Thumbnail */}
                                                        <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center mr-3">
                                                            {f.thumbnailPath ? (
                                                                <img
                                                                    src={`/${f.thumbnailPath.replace(/^uploads[\\/]?/, 'uploads/')}`}
                                                                    alt="thumbnail"
                                                                    className="w-12 h-12 object-cover rounded"
                                                                />
                                                            ) : (
                                                                <div className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
                                                                    <span className="text-xl">📄</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                                                {f.filename}
                                                            </h3>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                {f.mimetype || f.mimeType} • {Math.round(f.size / 1024)} KB
                                                            </p>
                                                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                                                Folder: {f.folderId || 'Root'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => handleAnalyze(f.id)} 
                                                            className="flex-1 bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
                                                            title="Analyze file with AI for search"
                                                        >
                                                            🤖 Analyze
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDownload(f.id)} 
                                                            className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                                                        >
                                                            ⬇️ Download
                                                        </button>
                                                        <button 
                                                            onClick={() => handleShare(f.id)} 
                                                            className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                                                        >
                                                            🔗 Share
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}