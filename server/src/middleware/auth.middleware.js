import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  // 1. Check if the token was sent in the headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // 2. Fallback: Check if it's in an HTTP-only cookie
  else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  // If no token is found, kick them out
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized. Token missing or invalid.' });
  }

  try {
    // Verify the token using your secret key
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Find the user in the database and attach them to the request object (excluding the password)
    req.user = await User.findById(decoded.id).select('-password');
    
    next(); // Move on to the controller!
  } catch (error) {
    console.error('Middleware Token Error:', error);
    res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};