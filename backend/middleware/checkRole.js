// Middleware to check user roles
module.exports = function checkRole(roles = []) {
    return (req, res, next) => {
        if(!roles.includes(req.user.role)){
            // user is not authorised
            return res.status(403).json({ message: 'Access denied: Insufficient role' });
        }
        next();
    };
};