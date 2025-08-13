export default function FileGrid({
    isSearchActive,
    searchResults,
    setSearchResults,
    setIsSearchActive,
    visibleFiles,
    currentFolder,
    currentFolderId,
    selectedFileIds,
    handleSelectFile,
    handleAnalyze,
    handleDownload,
    handleShare
}) {
    if (isSearchActive) {
        return (
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
        );
    }

    // Normal File List View
    return (
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
    );
}
