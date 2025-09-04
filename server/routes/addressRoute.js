import express from 'express';
import { checkJwt } from '../middlewares/authUser.js';
import { addAddress, getAddress } from '../controllers/addressController.js';

const addressRouter = express.Router();

addressRouter.post('/add', checkJwt, addAddress);
addressRouter.get('/get', checkJwt, getAddress);

export default addressRouter;