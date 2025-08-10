import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import Header from "../components/Header";

export default function Dashboard() {
    const [selectedFiles, setSelectedFiles] = useState([]); // For multi-file upload
    const [selectedFileIds, setSelectedFileIds] = useState([]); // For bulk actions
    const [currentFolderId, setCurrentFolderId] = useState(null); // For nested folder navigation
    
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
                            {/* Debug Info - Remove this in production */}
                            {/* <div className="mb-4 p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded text-xs">
                                <strong>Debug Info:</strong> Total files: {files.length}, Current folder: {currentFolderId}, Visible files: {visibleFiles.length}
                                <br />
                                Files in current view: {visibleFiles.map(f => `${f.filename} (folderId: ${f.folderId})`).join(', ')}
                            </div> */}

                            {/* Folder navigation breadcrumbs */}
                            <div className="mb-4 flex items-center gap-2 text-sm">
                                <button
                                    onClick={() => setCurrentFolderId(null)}
                                    className={`font-medium ${!currentFolderId ? 'text-blue-600' : 'text-gray-700 dark:text-gray-300'} hover:underline`}
                                >
                                    Root
                                </button>
                                {currentFolder && (
                                    <>
                                        <span className="mx-1">/</span>
                                        <span className="font-medium text-blue-600">{currentFolder.name}</span>
                                    </>
                                )}
                            </div>

                            {/* Subfolders list */}
                            {subfolders.length > 0 && (
                                <div className="mb-4 flex flex-wrap gap-2">
                                    {subfolders.map(folder => (
                                        <div 
                                            key={folder.id}
                                            className="flex items-center bg-gray-200 dark:bg-gray-700 rounded overflow-hidden"
                                        >
                                            <button
                                                onClick={() => setCurrentFolderId(folder.id)}
                                                className="px-3 py-1 hover:bg-blue-200 dark:hover:bg-blue-600 text-gray-800 dark:text-gray-100 flex-grow"
                                            >
                                                📁 {folder.name}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteFolder(folder.id, folder.name);
                                                }}
                                                className="px-2 py-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 dark:text-red-400"
                                                title={`Delete folder "${folder.name}"`}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Upload Form */}
                            <form onSubmit={handleUpload} className="mb-8">
                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
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
                                        Choose one or more files to upload to your cloud storage
                                    </p>
                                    {/* Show selected file names */}
                                    {selectedFiles.length > 0 && (
                                        <ul className="mt-2 text-xs text-gray-600 dark:text-gray-300 text-left">
                                            {selectedFiles.map((file, idx) => (
                                                <li key={idx}>{file.name}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                {/* Folder selection dropdown inside form */}
                                <div className="mb-2 mt-4">
                                    <label className="block mb-1 font-medium text-gray-900 dark:text-gray-100">Select Folder (optional):</label>
                                    <select 
                                        value={selectedFolderId}
                                        onChange={(e) => {
                                            const folderId = e.target.value;
                                            setSelectedFolderId(folderId);
                                            // Also navigate to the selected folder
                                            // Convert empty string to null, and numeric string to number
                                            setCurrentFolderId(folderId ? parseInt(folderId) : null);
                                        }}
                                        className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="">No Folder</option>
                                        {folders.map((folder) => (
                                            <option key={folder.id} value={folder.id}>
                                                {folder.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {/* Inline folder creation */}
                                <div className="flex items-center gap-2 mb-4">
                                    <input
                                        type="text"
                                        placeholder="New folder name"
                                        value={newFolderName}
                                        onChange={e => setNewFolderName(e.target.value)}
                                        className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 flex-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCreateFolder}
                                        disabled={creatingFolder || !newFolderName.trim()}
                                        className="bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50"
                                    >
                                        {creatingFolder ? "Creating..." : "Create Folder"}
                                    </button>
                                </div>
                                <button
                                    type="submit"
                                    disabled={selectedFiles.length === 0}
                                    className="mt-4 w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Upload File(s)
                                </button>
                            </form>

                            {/* Bulk Actions */}
                            <div className="mb-4 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={selectedFileIds.length === visibleFiles.length && visibleFiles.length > 0}
                                    onChange={handleSelectAll}
                                    className="mr-2"
                                />
                                <span className="mr-4 text-gray-900 dark:text-gray-100">Select All ({selectedFileIds.length} selected)</span>
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={selectedFileIds.length === 0}
                                    className="bg-red-600 text-white px-3 py-1 rounded disabled:opacity-50"
                                >
                                    Delete Selected
                                </button>
                                <button
                                    onClick={handleBulkDownloadZip}
                                    disabled={selectedFileIds.length === 0}
                                    className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
                                >
                                    Download as Zip
                                </button>
                            </div>
                            
                            {/* Files List with Thumbnails and Selection, filtered by folder */}
                            <div className="space-y-3">
                                {visibleFiles.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-gray-500 dark:text-gray-400">
                                            {currentFolderId ? 'No files in this folder' : 'No files uploaded yet'}
                                        </p>
                                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Upload your first file to get started</p>
                                    </div>
                                ) : (
                                    visibleFiles.map((f) => (
                                        <div key={f.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                            {/* Checkbox for selection */}
                                            <input
                                                type="checkbox"
                                                checked={selectedFileIds.includes(f.id)}
                                                onChange={() => handleSelectFile(f.id)}
                                                className="mr-4"
                                            />
                                            {/* Thumbnail or icon */}
                                            <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center mr-4">
                                                {f.thumbnailPath ? (
                                                    <img
                                                        src={`/${f.thumbnailPath.replace(/^uploads[\\/]?/, 'uploads/')}`}
                                                        alt="thumbnail"
                                                        className="w-16 h-16 object-contain rounded"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded">
                                                        <span role="img" aria-label="file" className="text-2xl">📄</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-900 dark:text-white">
                                                    {f.filename}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {f.mimetype || f.mimeType} • {Math.round(f.size / 1024)} KB
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                                    Folder ID: {f.folderId || 'None'}
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