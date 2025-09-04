import axios from "axios";
import User from "../models/User.js";
import { body, validationResult } from 'express-validator';

/**
 * Fetch Auth0 user info using access token
 */
const getAuth0UserInfo = async (accessToken) => {
  const resp = await axios.get(
    `https://${process.env.AUTH0_DOMAIN}/userinfo`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return resp.data; // { sub, email, name, picture, ... }
};

/**
 * @desc Check if user is authenticated
 * @route GET /api/user/is-auth
 * @access Private (Auth0)
 */
export const isAuth = async (req, res) => {
  try {
    
    if (!req.auth.sub) {
      console.log('No auth data found');
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const auth0Id = req.auth.sub;

    // Check if user exists
    let user = await User.findOne({ auth0Id }).select("-password");

    // Auto-create user if not found
    if (!user) {
      const accessToken = req.headers.authorization.split(" ")[1]; // remove "Bearer "
      const userInfo = await getAuth0UserInfo(accessToken);

      user = await User.create({
        auth0Id,
        authProvider: "auth0",
        name: userInfo.name || "New User",
        email: userInfo.email,
      });
    }

    return res.json({ success: true, user });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get user profile
 * @route GET /api/user/profile
 * @access Private (Auth0)
 */
export const getUserProfile = async (req, res) => {
  try {
    
    // Check for valid Auth0 ID
    if (!req.auth?.sub) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required",
        error: "missing_auth_id"
      });
    }

    const auth0Id = req.auth.sub;
    let user = await User.findOne({ auth0Id }).select("-password");

    // Auto-create if not found
    if (!user) {
      // Fixed: Extract token from Authorization header correctly
      const accessToken = req.headers.authorization.split(" ")[1]; // remove "Bearer "
      const userInfo = await getAuth0UserInfo(accessToken);
      
      user = await User.create({
        auth0Id,
        authProvider: "auth0",
        name: userInfo.name || "New User",
        email: userInfo.email,
        contactNumber: "",
        country: ""
      });
    }

    return res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        contactNumber: user.contactNumber || "",
        country: user.country || "",
        cartItems: user.cartItems || {}
      },
    });
  } catch (error) {
    console.error('getUserProfile error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const validateUserProfile = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be 1-100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces')
    .escape(),
  body('contactNumber')
    .optional()
    .isMobilePhone()
    .withMessage('Invalid phone number'),
  body('country')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Country can only contain letters and spaces')
    .escape()
];

/**
 * @desc Update user profile
 * @route PUT /api/user/profile
 * @access Private (Auth0)
 */
export const updateUserProfile = async (req, res) => {
  try {

    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
    }

    if (!req.auth || !req.auth.sub) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const { name, contactNumber, country } = req.body;
    
    if (!name || name.trim() === "") {
      return res.json({ success: false, message: "Name is required" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { auth0Id: req.auth.sub },
      {
        name: name.trim(),
        contactNumber: contactNumber || "",
        country: country || "",
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        contactNumber: updatedUser.contactNumber || "",
        country: updatedUser.country || "",
      },
    });
  } catch (error) {
    console.error('updateUserProfile error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};