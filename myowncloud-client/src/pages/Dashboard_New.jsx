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
            const res = await axios.delete(`/folders/${folderId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            console.log("Folder deletion response:", res.data);
            
            // If we were viewing the deleted folder, navigate to parent or root
            if (currentFolderId === folderId) {
                setCurrentFolderId(null);
            }
            
            // Refresh the folders list and files list
            await Promise.all([fetchFolders(), fetchFiles()]);
            
            // Show success message
            alert(`Folder "${folderName}" and all its contents have been deleted successfully!`);
        } catch (err) {
            console.error("Failed to delete folder:", err.response?.data || err.message);
            alert("Failed to delete folder: " + (err.response?.data?.error || err.message));
        }
    };

    const fetchFiles = async () => {
        try {
            const res = await axios.get("/files", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            console.log("Files response:", res.data);
            setFiles(res.data);
        } catch (err) {
            console.error("Error fetching files:", err);
            alert("Failed to fetch files. Please check your connection and try again.");
        }
    };

    // Helper: filter files by current folder - FIXED VERSION
    const visibleFiles = currentFolderId
        ? files.filter(f => {
            // Handle both number and string comparisons to ensure compatibility
            const fileFolderId = f.folderId;
            
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
            e.target.reset();
            
            // Refresh the files list to show the newly uploaded files
            await fetchFiles();
            
            // Show success message
            alert(`Successfully uploaded ${selectedFiles.length} file(s)!`);
        } catch (err) {
            console.error("Upload failed:", err.response?.data || err.message);
            alert("Upload failed: " + (err.response?.data?.error || err.message));
        }
    };

    const handleDownload = async (id) => {
        try {
            const response = await axios.get(`/files/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                responseType: 'blob'
            });
            
            // Get filename from content-disposition header or use a default
            const contentDisposition = response.headers['content-disposition'];
            let filename = `file_${id}`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }
            
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
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
                    <Sidebar
                        handleSearchResults={handleSearchResults}
                        currentFolderId={currentFolderId}
                        setCurrentFolderId={setCurrentFolderId}
                        subfolders={subfolders}
                        handleDeleteFolder={handleDeleteFolder}
                        newFolderName={newFolderName}
                        setNewFolderName={setNewFolderName}
                        handleCreateFolder={handleCreateFolder}
                        creatingFolder={creatingFolder}
                        selectedFileIds={selectedFileIds}
                        handleBulkDelete={handleBulkDelete}
                        handleBulkDownloadZip={handleBulkDownloadZip}
                    />

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Breadcrumb Header */}
                        <BreadcrumbHeader
                            currentFolderId={currentFolderId}
                            setCurrentFolderId={setCurrentFolderId}
                            currentFolder={currentFolder}
                            selectedFileIds={selectedFileIds}
                            visibleFiles={visibleFiles}
                            handleSelectAll={handleSelectAll}
                        />

                        {/* File Content Area */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Upload Zone */}
                            <FileUploadZone
                                selectedFiles={selectedFiles}
                                setSelectedFiles={setSelectedFiles}
                                selectedFolderId={selectedFolderId}
                                setSelectedFolderId={setSelectedFolderId}
                                setCurrentFolderId={setCurrentFolderId}
                                folders={folders}
                                handleUpload={handleUpload}
                            />

                            {/* Files List - Search Results or Normal Files */}
                            <FileGrid
                                isSearchActive={isSearchActive}
                                searchResults={searchResults}
                                setSearchResults={setSearchResults}
                                setIsSearchActive={setIsSearchActive}
                                visibleFiles={visibleFiles}
                                currentFolder={currentFolder}
                                currentFolderId={currentFolderId}
                                selectedFileIds={selectedFileIds}
                                handleSelectFile={handleSelectFile}
                                handleAnalyze={handleAnalyze}
                                handleDownload={handleDownload}
                                handleShare={handleShare}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
