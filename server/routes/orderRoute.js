import express from 'express';
import {authMiddleware, checkJwt} from '../middlewares/authUser.js';
import { getAllOrders, getUserOrders, placeOrderCOD, placeOrderStripe, validateOrder, cancelOrder } from '../controllers/orderController.js';
import authSeller from '../middlewares/authSeller.js';

const orderRouter = express.Router();

orderRouter.post('/cod', authMiddleware, validateOrder, placeOrderCOD);
orderRouter.get('/user', checkJwt, getUserOrders)
orderRouter.get('/seller', authSeller, getAllOrders)
orderRouter.post('/stripe', authMiddleware, validateOrder, placeOrderStripe);
orderRouter.put('/cancel/:orderId', checkJwt, cancelOrder);

export default orderRouter;