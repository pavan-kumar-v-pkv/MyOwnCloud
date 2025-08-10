const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient(); // Initialize Prisma Client

exports.grantFilePermission = async (req, res) => {
    const { fileId, userId, permission } = req.body;
    // Validate permission type
    if (!['view', 'download', 'edit'].includes(permission)) {
        return res.status(400).json({ message: 'Invalid permission type' });
    }
    try {
        await prisma.filePermission.upsert({
            where: { fileId_userId: { fileId, userId } },
            update: { permission },
            create: { fileId, userId, permission }
        });
        res.json({ message: 'Permission granted successfully' });
    } catch (err) {
        console.error("Error granting permission:", err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.revokeFilePermission = async (req, res) => {
    // get fileId and userId from request body
    const { fileId, userId } = req.body;
    try {
        // Revoke file permission where fileId and userId match
        await prisma.filePermission.delete({
            where: { fileId_userId: { fileId, userId } }
        });
        res.json({ message: 'Permission revoked successfully' });``
    } catch (err) {
        console.error("Error revoking permission:", err);  
        res.status(500).json({ message: 'Server error' });
    }
};

exports.listFilePermissions = async (req, res) => {
    // get fileId from request parameters
    const fileId = parseInt(req.params.fileId);
    try {
        const permissions = await prisma.filePermission.findMany({
            where: { fileId },
            include: { user: { select: {id: true, name: true, email: true } } } // Include user details
        });
        res.json({ permissions });
    } catch (err) {
        console.error("Error listing permissions:", err);
        res.status(500).json({ message: 'Server error' });
    }
};