import SearchBar from "./SearchBar";

export default function Sidebar({
    handleSearchResults,
    currentFolderId,
    setCurrentFolderId,
    subfolders,
    handleDeleteFolder,
    newFolderName,
    setNewFolderName,
    handleCreateFolder,
    creatingFolder,
    selectedFileIds,
    handleBulkDelete,
    handleBulkDownloadZip
}) {
    return (
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
                                        📂 {folder.name}
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
    );
}
