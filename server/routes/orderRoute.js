import express from 'express';
import {checkJwt} from '../middlewares/authUser.js';
import { getAllOrders, getUserOrders, placeOrderCOD, placeOrderStripe } from '../controllers/orderController.js';
import authSeller from '../middlewares/authSeller.js';

const orderRouter = express.Router();

orderRouter.post('/cod', validateOrder, placeOrderCOD);
orderRouter.get('/user', checkJwt, getUserOrders)
orderRouter.get('/seller', authSeller, getAllOrders)
orderRouter.post('/stripe', validateOrder, placeOrderStripe);

export default orderRouter;