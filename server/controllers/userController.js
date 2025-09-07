import axios from "axios";
import User from "../models/User.js";
import { body, validationResult } from "express-validator";

/**
 * Fetch Auth0 user info using access token
 */
const getAuth0UserInfo = async (accessToken) => {
  const resp = await axios.get(
    `https://${process.env.AUTH0_DOMAIN}/userinfo`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return resp.data; 
};

/**
 * Safe function to find or create Auth0 user
 */
const findOrCreateUser = async (auth0Id, accessToken) => {
  
  let user = await User.findOne({ auth0Id });

  if (user) return user;

  
  const userInfo = await getAuth0UserInfo(accessToken);
  const email = userInfo.email || null;
  const name = userInfo.name || "New User";

  if (email) {
    user = await User.findOne({ email });

    if (user) {
     
      user.auth0Id = auth0Id;
      user.authProvider = "auth0";
      await user.save();
      return user;
    }
  }

  user = await User.create({
    auth0Id,
    authProvider: "auth0",
    name,
    email,
    contactNumber: "",
    country: "",
  });

  return user;
};

/**
 * @desc Check if user is authenticated
 * @route GET /api/user/is-auth
 * @access Private (Auth0)
 */
export const isAuth = async (req, res) => {
  try {
    if (!req.auth?.sub) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const auth0Id = req.auth.sub;
    const accessToken = req.headers.authorization.split(" ")[1];
    const user = await findOrCreateUser(auth0Id, accessToken);

    return res.json({ success: true, user: user.toObject({ getters: true, versionKey: false }) });
  } catch (error) {
    console.error("isAuth error:", error.message);
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
    if (!req.auth?.sub) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const auth0Id = req.auth.sub;
    const accessToken = req.headers.authorization.split(" ")[1];

    const user = await findOrCreateUser(auth0Id, accessToken);

    return res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        contactNumber: user.contactNumber || "",
        country: user.country || "",
        cartItems: user.cartItems || [],
      },
    });
  } catch (error) {
    console.error("getUserProfile error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Validation middleware for updating profile
 */
export const validateUserProfile = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Name must be 1-100 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name can only contain letters and spaces")
    .escape(),
  body("contactNumber")
    .optional()
    .isMobilePhone()
    .withMessage("Invalid phone number"),
  body("country")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Country can only contain letters and spaces")
    .escape(),
];

/**
 * @desc Update user profile
 * @route PUT /api/user/profile
 * @access Private (Auth0)
 */
export const updateUserProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    }

    if (!req.auth?.sub) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const { name, contactNumber, country } = req.body;

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
      return res.status(404).json({ success: false, message: "User not found" });
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
    console.error("updateUserProfile error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
