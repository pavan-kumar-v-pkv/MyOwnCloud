// Script to clean up all data from the database
const { PrismaClient } = require('./generated/prisma');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function cleanupDatabase() {
    try {
        console.log('Starting database cleanup...');
        
        // Delete all share links first (due to foreign key constraints)
        const deletedShareLinks = await prisma.shareLink.deleteMany({});
        console.log(`Deleted ${deletedShareLinks.count} share links from database`);
        
        // Delete all files from database
        const deletedFiles = await prisma.file.deleteMany({});
        console.log(`Deleted ${deletedFiles.count} files from database`);
        
        // Delete all folders from database
        const deletedFolders = await prisma.folder.deleteMany({});
        console.log(`Deleted ${deletedFolders.count} folders from database`);
        
        // Clean up physical files in uploads directory
        const uploadsDir = path.join(__dirname, 'uploads');
        const thumbnailsDir = path.join(__dirname, 'uploads', 'thumbnails');
        
        // Remove all files from uploads directory (except .gitkeep if it exists)
        if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            for (const file of files) {
                const filePath = path.join(uploadsDir, file);
                const stat = fs.statSync(filePath);
                
                if (stat.isFile() && file !== '.gitkeep') {
                    fs.unlinkSync(filePath);
                    console.log(`Deleted physical file: ${file}`);
                }
            }
        }
        
        // Remove all thumbnail files
        if (fs.existsSync(thumbnailsDir)) {
            const thumbnails = fs.readdirSync(thumbnailsDir);
            for (const thumbnail of thumbnails) {
                const thumbnailPath = path.join(thumbnailsDir, thumbnail);
                if (fs.statSync(thumbnailPath).isFile()) {
                    fs.unlinkSync(thumbnailPath);
                    console.log(`Deleted thumbnail: ${thumbnail}`);
                }
            }
        }
        
        console.log('Database cleanup completed successfully!');
        
    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the cleanup
cleanupDatabase();
