import express from 'express';
import { isAuth, getUserProfile, updateUserProfile, validateUserProfile } from '../controllers/userController.js';
import { authMiddleware } from '../middlewares/authUser.js';
import { mapAuthToUser } from '../middlewares/userMapping.js';

const userRouter = express.Router();

// Add both middlewares: first validate Auth0 token, then map req.auth -> req.user
userRouter.get('/is-auth', authMiddleware, mapAuthToUser, isAuth);
userRouter.get('/profile', authMiddleware, mapAuthToUser, getUserProfile);
userRouter.put('/profile', authMiddleware, mapAuthToUser, validateUserProfile, updateUserProfile);

export default userRouter;
