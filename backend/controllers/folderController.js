// business logic for folder management
const { PrismaClient } = require('../generated/prisma'); // to interact with the database via Prisma
const prisma = new PrismaClient();

exports.createFolder = async (req, res) => {
    try {
        const { name, parentId } = req.body; // get folder name from request body
        const userId = req.user.userId; // JWT middleware sets req.user, which contains userId

        console.log('Creating folder with:', { name, parentId, userId });

        if (!name) {
            return res.status(400).json({ error: 'Folder name is required' });
        }

        const folderData = {
            name, 
            userId: userId,
            parentId: parentId || null
        };

        console.log('Folder data to create:', folderData);

        const folder = await prisma.folder.create({
            data: folderData
        });
        
        console.log('Folder created successfully:', folder);
        res.json({ folder, message: 'Folder created successfully' }); // return created folder
    } catch (error) {
        console.error('Error creating folder:', error);
        res.status(500).json({ error: 'Error creating folder', details: error.message });
    }
};

exports.getFolders = async (req, res) => {
    try {
        const userId = req.user.userId; // JWT middleware sets req.user, which contains userId
        const folders = await prisma.folder.findMany({
            where: { userId: userId }, // get all the folders created by that user
            include: { files: true } // include all the files within that folder
        });
        res.json(folders); // return the folders
    } catch (error) {
        console.error('Error fetching folders:', error);
        res.status(500).json({ error: 'Error fetching folders' });
    }
};

// Helper function to recursively delete folder contents
async function deleteFolderRecursively(folderId, userId) {
    const fs = require('fs');
    const path = require('path');
    
    // Get all files in this folder
    const files = await prisma.file.findMany({
        where: { folderId: folderId, userId: userId }
    });
    
    // Delete physical files
    for (const file of files) {
        try {
            if (fs.existsSync(file.filepath)) {
                fs.unlinkSync(file.filepath);
            }
            // Delete thumbnail if it exists
            if (file.thumbnailPath && fs.existsSync(file.thumbnailPath)) {
                fs.unlinkSync(file.thumbnailPath);
            }
        } catch (err) {
            console.error(`Error deleting physical file ${file.filename}:`, err);
        }
    }
    
    // Delete files from database
    await prisma.file.deleteMany({
        where: { folderId: folderId, userId: userId }
    });
    
    // Get all subfolders
    const subfolders = await prisma.folder.findMany({
        where: { parentId: folderId, userId: userId }
    });
    
    // Recursively delete subfolders
    for (const subfolder of subfolders) {
        await deleteFolderRecursively(subfolder.id, userId);
    }
    
    // Finally, delete the folder itself
    await prisma.folder.delete({
        where: { id: folderId }
    });
}

exports.deleteFolder = async (req, res) => {
    try {
        const folderId = parseInt(req.params.id);
        const userId = req.user.userId;
        
        console.log('Deleting folder with ID:', folderId, 'for user:', userId);
        
        // Check if folder exists and belongs to user
        const folder = await prisma.folder.findFirst({
            where: { id: folderId, userId: userId }
        });
        
        if (!folder) {
            return res.status(404).json({ error: 'Folder not found or access denied' });
        }
        
        // Recursively delete folder and all its contents
        await deleteFolderRecursively(folderId, userId);
        
        console.log('Folder deleted successfully:', folderId);
        res.json({ message: 'Folder and all contents deleted successfully' });
    } catch (error) {
        console.error('Error deleting folder:', error);
        res.status(500).json({ error: 'Error deleting folder', details: error.message });
    }
};