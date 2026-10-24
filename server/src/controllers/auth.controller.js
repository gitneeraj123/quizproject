import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '30d',
  });
  return { accessToken, refreshToken };
};

// In production the client (Vercel) and API (Render) are on different sites,
// so the cookie must be SameSite=None (which requires Secure) to be sent at all.
const isProduction = process.env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'None' : 'Lax',
};

const setCookie = (res, refreshToken) => {
  res.cookie('jwt', refreshToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });
};

const toUserJSON = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({ name, email, password });
    const { accessToken, refreshToken } = generateTokens(user._id);
    
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    setCookie(res, refreshToken);

    res.status(201).json({
      success: true,
      accessToken,
      user: toUserJSON(user),
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    setCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      accessToken,
      user: toUserJSON(user),
    });
  } catch (error) {
    next(error);
  }
};

export const refreshAccessToken = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt;

    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ success: false, message: 'Invalid refresh token.' });
    }

    // Issue new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
    
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    setCookie(res, newRefreshToken);

    // The client keeps the access token in memory only, so on page reload
    // this is how it gets both a fresh token and the user back.
    res.status(200).json({
      success: true,
      accessToken,
      user: toUserJSON(user),
    });
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Refresh token expired or invalid. Please log in again.' });
  }
};

export const logout = async (req, res) => {
  // Revoke the stored refresh token so the cookie can't be reused even if it leaked
  const token = req.cookies?.jwt;
  if (token) {
    await User.updateOne({ refreshToken: token }, { $unset: { refreshToken: 1 } }).catch(() => {});
  }

  res.clearCookie('jwt', cookieOptions);
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};