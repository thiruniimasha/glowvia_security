import express from "express";
import { authMiddleware } from "../middlewares/authUser.js";
import { updateCart } from "../controllers/cartController.js";
import { mapAuthToUser } from "../middlewares/userMapping.js";

const cartRouter = express.Router();

cartRouter.post('/update', authMiddleware, mapAuthToUser, updateCart)

export default cartRouter;