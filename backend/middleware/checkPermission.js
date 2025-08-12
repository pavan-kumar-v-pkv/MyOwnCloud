// middleware for role and permission checking
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();



exports.checkFilePermission = (requiredPermission) => {
    return async (req, res, next) => {
        const fileId = parseInt(req.params.id); // get file ID from request parameters
        const userId = req.user.userId; // JWT middleware sets req.user, which contains

        // File ownder check
        const file = await prisma.file.findUnique({ where: { id: fileId } });
        if(!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        if(file.userId === userId) {
            return next(); // User is the owner, allow access
        }

        // Permission check
        const permission = await prisma.filePermission.findUnique({
            where: { fileId_userId: { fileId, userId } }
        })      

        if(!permission || permission.permission !== requiredPermission) {
            return res.status(403).json({ message: 'Access denied: No permission' });
        }

        next();
    };
};