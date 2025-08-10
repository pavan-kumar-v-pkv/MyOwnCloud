// Contains the business logic of uploading files.
const { PrismaClient } = require('../generated/prisma'); // to interact with the database via Prisma
const prisma = new PrismaClient(); // create a new Prisma client instance

const path = require('path'); // built-in Node.js module for handling file paths and operations
const fs = require('fs'); // built-in Node.js module for file system operations

const crypto = require('crypto'); // built-in Node.js module for cryptographic functions
const archiver = require('archiver'); // library for creating zip files
// THUMBNAIL LIBRARIES REMOVED FOR DEBUGGING
// const sharp = require('sharp'); // library for image processing
// const { PDFDocument } = require('pdf-lib') // library for pdf manipulation

exports.uploadFiles = async (req, res) => {
    console.log('=== uploadFiles API called ===');
    const userId = req.user.userId; // JWT middleware sets req.user, which contains userId
    console.log('User ID from token for upload:', userId);

    console.log("Upload request received:", {
        filesCount: req.files?.length || 0,
        files: req.files?.map(f => ({ name: f.originalname, type: f.mimetype, size: f.size })) || [],
        folderId: req.body.folderId
    });

    if(!req.files || req.files.length === 0){
        return res.status(400).json({message: 'No files uploaded'});
    }

    // Get folderId from body or query (support both form-data and query param)
    let folderId = req.body.folderId || req.query.folderId;
    if (folderId && typeof folderId === 'string') folderId = parseInt(folderId);

    // Process each uploaded file
    console.log('Starting to process', req.files.length, 'files...');
    const filePromises = req.files.map(async (file, index) => {
        console.log(`=== PROCESSING FILE ${index + 1}: ${file.originalname} ===`);
        const { originalname, mimetype, size, filename, path: filepath} = file;

        try {
            console.log('File details:', { originalname, mimetype, size, filename, filepath });
            
            const fileData = {
                filename: originalname,
                filepath,
                mimetype,
                size,
                userId: userId,
            };
            if (folderId) {
                console.log('Adding folderId to fileData:', folderId);
                fileData.folderId = folderId;
            }

            console.log('File data prepared:', fileData);

            // THUMBNAIL GENERATION REMOVED FOR DEBUGGING
            // No thumbnail generation - upload files directly

            console.log('Creating file with data:', fileData);
            const newFile = await prisma.file.create({
                data: fileData
            });
            console.log('File created successfully:', { id: newFile.id, filename: newFile.filename, folderId: newFile.folderId });
            return newFile.id;
        } catch (error) {
            console.error('Error uploading file:', file.originalname, error);
            console.error('Full error details:', error.message, error.stack);
            throw new Error(`Internal server error: Upload failed for ${file.originalname}: ${error.message}`);
        }
    });
    
    console.log('FilePromises array created, length:', filePromises.length);
    try {
        console.log('Processing', req.files.length, 'files...');
        console.log('About to start Promise.all with filePromises...');
        const fileIds = await Promise.all(filePromises);
        console.log('All files processed successfully, IDs:', fileIds);
        res.status(201).json({
            message: 'Files uploaded successfully',
            fileIds
        });
    } catch (error) {
        console.error('Error in uploadFiles main function:', error);
        res.status(500).json({ message: error.message });
    }
};

// THUMBNAIL FUNCTION DISABLED FOR DEBUGGING
// async function generateThumbnail(filePath, mimetype, destPath){
//     try {
//         // Ensure the thumbnails directory exists
//         const thumbnailDir = path.dirname(destPath);
//         if (!fs.existsSync(thumbnailDir)) {
//             fs.mkdirSync(thumbnailDir, { recursive: true });
//         }

//         if (mimetype.startsWith('image/')) {
//             // generate image thumbnail
//             await sharp(filePath).resize(200, 200, { fit: 'inside' }).toFile(destPath);
//             return destPath;
//         } else if (mimetype === 'application/pdf') {
//             // generate PDF thumbnail (first page as PNG) using pdf-poppler
//             const Poppler = require('pdf-poppler');
//             const options = {
//                 format: 'png',
//                 out_dir: path.dirname(destPath),
//                 out_prefix: path.basename(destPath, path.extname(destPath)),
//                 page: 1,
//                 scale: 1024 // higher scale for better quality, then resize
//             };
//             try {
//                 await Poppler.convert(filePath, options);
//                 // pdf-poppler will output as out_dir/out_prefix-1.png
//                 const generatedPath = path.join(options.out_dir, options.out_prefix + '-1.png');
//                 // Resize to thumbnail size using sharp
//                 await sharp(generatedPath).resize(200, 200, { fit: 'inside' }).toFile(destPath);
//                 // Optionally, delete the original generatedPath file
//                 fs.unlink(generatedPath, () => {});
//                 return destPath;
//             } catch (err) {
//                 console.error('Error generating PDF thumbnail:', err);
//                 return null;
//             }
//         }
//         return null; // no thumbnail for other file types
//     } catch (error) {
//         console.error('Error generating thumbnail:', error);
//         return null; // Return null if thumbnail generation fails
//     }
// }


exports.listUserFile = async (req, res) => {
    console.log('=== listUserFile API called ===');
    const userId = req.user.userId; // JWT middleware sets req.user, which contains userId
    console.log('User ID from token:', userId);

    try {
        const files = await prisma.file.findMany({
            where: { userId }, // filter files by the userId
            select: {
                id: true,          // include file ID
                filename: true,    // include original file name
                mimetype: true,    // include file type
                size: true,        // include file size
                folderId: true,    // include folder ID for filtering
                createdAt: true,   // include creation date of the file
                thumbnailPath: true // include thumbnail path for previews
            }
        });
        console.log('Files fetched from database:', files.length, 'files for user', userId);
        console.log('Files details:', files.map(f => ({ id: f.id, filename: f.filename, folderId: f.folderId, mimetype: f.mimetype })));
        res.json({ files });    // return the list of files
    } catch (err) {
        console.error('Error listing files:', err);
        res.status(500).json({ message: 'Internal server error: Unable to list files' });
    }
};

exports.downloadFile = async (req, res) => {
    const userId = req.user.userId; // JWT middleware sets req.user, which contains userId
    const fileId = parseInt(req.params.id); // get file ID from request parameters

    try {
        const file = await prisma.file.findUnique({ where: { id: fileId }}); // find the file by ID
        // Check if the file exists and belongs to the user
        if(!file) return res.status(404).json({ message: 'File not found' });

        // check permissions
        if(file.userId !== userId) {
            const perm = await prisma.filePermission.findUnique({
                where: { fileId_userId: { fileId, userId } }
            });
            if(!perm || !['download', 'edit'].includes(perm.permission)) {
                return res.status(403).json({ message: 'Access denied: You do not own this file' });
            }
        }

        // send file
        const filePath = path.resolve(file.filepath); // resolve the full path to the file
        res.download(filePath, file.filename); // send the file to the client with its original name
    } catch(err){
        console.error('Error downloading file:', err);
        res.status(500).json({ message: 'Internal server error: Unable to download file' });
    }
};

// Helper function to generate a shareable link for the file to download    
exports.generateShareLink = async(req, res) => {
    const userId = req.user.userId; // JWT middleware sets req.user, which contains userId
    const fileId = parseInt(req.params.id); // get file ID from request parameters

    const file = await prisma.file.findUnique({ where: { id: fileId }});
    if(!file) return res.status(404).json({ message: 'File not found' });

    if(file.userId !== userId) {
        return res.status(403).json({ message: 'Access denied: You do not own this file' });
    }

    // Generate a unique token for the shareable link
    const token = crypto.randomBytes(16).toString('hex'); // generate a random token

    const link = await prisma.shareLink.create({
        data: {
            token, // store the generated token
            file: { connect: { id: fileId}}, // associate the link with the file
        }
    });

    res.json({ shareableUrl: `http://localhost:8000/public/${token}` }); // return the shareable URL
};

// Public route to download shared files using the token
exports.downloadPublicFile = async (req, res) => {
    const token = req.params.token; // get the token from the request parameters

    const link = await prisma.shareLink.findUnique({
        where: { token }, // find the share link by token
        include: { file: true } // include the associated file details
    });

    if(!link) return res.status(404).json({ message: 'Invalid or expired share link' });

    const filePath = path.resolve(link.file.filepath); // resolve the full path to the file
    res.download(filePath, link.file.filename); // send the file to the client with its original name
};

// Download multiple files as zip
exports.downloadZip = async(req, res) => {
    const { fileIds } = req.body; // array of file IDs
    const files = await prisma.file.findMany({ where: { id: { in: fileIds } } });

    res.attachment('files.zip');
    const archive = archiver('zip', { zlib: { level: 9 }});
    archive.pipe(res);

    files.forEach(file => {
        archive.file(file.filepath, { name: file.filename });
    });
    
    await archive.finalize();
};

// Bulk delete files
exports.bulkDeleteFiles = async(req, res) => {
    console.log('Bulk delete request received');
    const { fileIds } = req.body; // array of file IDs
    const userId = req.user.userId;
    
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
        console.log('No file IDs provided');
        return res.status(400).json({ message: 'No file IDs provided' });
    }
    
    console.log('File IDs to delete:', fileIds);
    console.log('User ID:', userId);
    
    try {
        // Convert string IDs to integers if needed
        const parsedFileIds = fileIds.map(id => typeof id === 'string' ? parseInt(id) : id);
        
        // Delete the files from the database
        const deleteResult = await prisma.file.deleteMany({
            where: { 
                id: { in: parsedFileIds },
                userId: userId
            }
        });
        
        console.log('Delete result:', deleteResult);
        
        res.json({ 
            message: 'Files deleted successfully',
            count: deleteResult.count
        });
    } catch (err) {
        console.error('Error deleting files:', err);
        res.status(500).json({ message: 'Internal server error: Unable to delete files' });
    }
};