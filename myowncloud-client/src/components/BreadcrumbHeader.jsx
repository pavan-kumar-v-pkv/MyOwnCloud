export default function BreadcrumbHeader({
    currentFolderId,
    setCurrentFolderId,
    currentFolder,
    selectedFileIds,
    visibleFiles,
    handleSelectAll
}) {
    return (
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
    );
}
