const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'no_secrets';

exports.authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 
    // header formatted: Bearer <token>
    // we take the 2nd element

    if (!token) {
        return res.status(401).json({ error: 'Access token missing' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        req.user = decoded;
        // pass the request to the next handler 
        next();
    } catch (err) {
        console.error(err);
        res.status(403).json({ error: 'Invalid or expired token' });
    }


};


exports.authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.user.role; 
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }
        next();
    };
};

