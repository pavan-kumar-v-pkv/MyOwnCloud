export default function FileUploadZone({
    selectedFiles,
    setSelectedFiles,
    selectedFolderId,
    setSelectedFolderId,
    setCurrentFolderId,
    folders,
    handleUpload
}) {
    return (
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
    );
}
