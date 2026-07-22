import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: '30d',
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '30d',
  });
  return { accessToken, refreshToken };
};

const setCookie = (res, refreshToken) => {
  res.cookie('jwt', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, 
  });
};

// Removed 'next' from parameters
export const register = async (req, res) => {
  try {
    const { name, email, password, organization } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({ name, email, password, organization });
    const { accessToken, refreshToken } = generateTokens(user._id);
    
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    setCookie(res, refreshToken);

    res.status(201).json({
      success: true,
      accessToken,
      user: { id: user._id, name: user.name, email: user.email, organization: user.organization, role: user.role },
    });
  } catch (error) {
    // Handling the error natively without 'next'
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error during registration' });
  }
};

// Removed 'next' from parameters
export const login = async (req, res) => {
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
      user: { id: user._id, name: user.name, email: user.email, organization: user.organization, role: user.role },
    });
  } catch (error) {
    // Handling the error natively without 'next'
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error during login' });
  }
};