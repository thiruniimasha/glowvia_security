import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Address from "../models/Address.js";
import stripe from "stripe"
import { body, validationResult } from 'express-validator';

// Validate delivery date (no Sundays, not in past)
const validateDeliveryDate = (deliveryDate) => {
    const date = new Date(deliveryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if date is in the past
    if (date < today) {
        return { valid: false, message: "Delivery date cannot be in the past" };
    }

    // Check if it's Sunday (0 = Sunday)
    if (date.getDay() === 0) {
        return { valid: false, message: "Delivery not available on Sundays" };
    }

    return { valid: true };
};

export const validateOrder = [
    body('items').isArray({ min: 1 }).withMessage('Items required'),
    body('items.*.productId').isMongoId().withMessage('Valid product ID required'),
    body('items.*.quantity').isInt({ min: 1, max: 100 }).withMessage('Quantity 1-100'),
    body('purchaseInfo.deliveryDate').isISO8601().withMessage('Valid date required'),
    body('purchaseInfo.deliveryTime').isIn(['10 AM', '11 AM', '12 PM']).withMessage('Invalid time'),
    body('purchaseInfo.username')
        .trim()
        .isLength({ min: 1, max: 100 })
        .matches(/^[a-zA-Z\s]+$/)
        .escape(),
    body('purchaseInfo.deliveryLocation')
        .trim()
        .isLength({ min: 1, max: 100 })
        .escape(),
    body('purchaseInfo.message')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .escape()
];



// place order COD : /api/order/cod
export const placeOrderCOD = async (req, res) => {
    try {

        // Validate input first
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array()
            });
        }

        const { items, address, purchaseInfo } = req.body;

        // Get Auth0 ID
        const auth0Id = req.user?.id || req.auth?.sub;

        if (!auth0Id) {
            return res.status(401).json({
                success: false,
                message: "User authentication required"
            });
        }

        console.log('🔍 Looking for user with auth0Id:', auth0Id);

        // Find the actual MongoDB user document
        const user = await User.findOne({ auth0Id: auth0Id });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found. Please ensure your profile is created."
            });
        }

        const userId = user._id; // This is the MongoDB ObjectId
        console.log('✅ Found user with MongoDB ID:', userId);

        if (!address || !items || items.length === 0) {
            return res.json({ success: false, message: "Invalid Data" })
        }

        // Validate purchase information
        if (!purchaseInfo) {
            return res.json({ success: false, message: "Purchase information is required" });
        }

        const { deliveryDate, deliveryTime, deliveryLocation, username } = purchaseInfo;

        if (!deliveryDate || !deliveryTime || !deliveryLocation || !username) {
            return res.json({ success: false, message: "Missing required purchase information" });
        }

        // Validate delivery date
        const dateValidation = validateDeliveryDate(deliveryDate);
        if (!dateValidation.valid) {
            return res.json({ success: false, message: dateValidation.message });
        }

        //Calculate amount using items
        let amount = 0;
        const orderItems = [];
        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.json({ success: false, message: `Product not found : ${item.productId}` });
            }

            const itemTotal = product.offerPrice * item.quantity;
            amount += itemTotal;

            orderItems.push({
                productId: product._id,
                quantity: item.quantity,
                name: product.name,
                price: product.offerPrice,
                image: product.image[0]
            });
        }



        //add tax charge(2%)
        amount += Math.floor(amount * 0.02);

        await Order.create({
            userId,
            items: orderItems,
            amount,
            address,
            paymentType: "COD",
            purchaseInfo: {
                username: purchaseInfo.username,
                orderDate: new Date(),
                deliveryDate: new Date(purchaseInfo.deliveryDate),
                deliveryTime: purchaseInfo.deliveryTime,
                deliveryLocation: purchaseInfo.deliveryLocation,
                message: purchaseInfo.message || ''
            }
        });

        await User.findByIdAndUpdate(userId, { $set: { cartItems: [] } });



        return res.json({ success: true, message: "Order Placed Successfully" })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

// place order Stripe : /api/order/stripe
export const placeOrderStripe = async (req, res) => {
    try {
        const { items, address, purchaseInfo } = req.body;
        const auth0Id = req.user?.id || req.auth?.sub;
        const user = await User.findOne({ auth0Id: auth0Id });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const userId = user._id;

        // Improved origin detection
        const origin = process.env.FRONTEND_URL || req.headers.origin || 'http://localhost:5173';

        console.log('Request origin details:', {
            headerOrigin: req.headers.origin,
            headerReferer: req.headers.referer,
            environmentFrontend: process.env.FRONTEND_URL,
            finalOrigin: origin
        });

        // Validate purchase information
        if (!purchaseInfo) {
            return res.json({ success: false, message: "Purchase information is required" });
        }

        const { deliveryDate, deliveryTime, deliveryLocation, username } = purchaseInfo;

        if (!deliveryDate || !deliveryTime || !deliveryLocation || !username) {
            return res.json({ success: false, message: "Missing required purchase information" });
        }

        // Validate delivery date
        const dateValidation = validateDeliveryDate(deliveryDate);
        if (!dateValidation.valid) {
            return res.json({ success: false, message: dateValidation.message });
        }

        let productData = [];


        //Calculate amount using items
        let amount = 0;
        const orderItems = [];
        for (const item of items) {
            const product = await Product.findById(item.productId);

            productData.push({
                name: product.name,
                price: product.offerPrice,
                quantity: item.quantity,
                image: product.image[0]
            });

            if (!product) {
                return res.json({ success: false, message: `Product not found : ${item.productId}` });
            }

            const itemTotal = product.offerPrice * item.quantity;
            amount += itemTotal;

            orderItems.push({
                productId: product._id,
                quantity: item.quantity,
                name: product.name,
                price: product.offerPrice,
                image: product.image[0]
            });


        }



        //add tax charge(2%)
        amount += Math.floor(amount * 0.02);

        const order = await Order.create({
            userId,
            items: orderItems,
            amount,
            address,
            paymentType: "Online",
            purchaseInfo: {
                username: purchaseInfo.username,
                orderDate: new Date(),
                deliveryDate: new Date(purchaseInfo.deliveryDate),
                deliveryTime: purchaseInfo.deliveryTime,
                deliveryLocation: purchaseInfo.deliveryLocation,
                message: purchaseInfo.message || ''
            }
        });

        //stripe gateway
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

        //create line items for stripe
        const line_items = productData.map((item) => {
            return {
                price_data: {
                    currency: "lkr",
                    product_data: {
                        name: item.name,

                    },
                    unit_amount: (item.price + item.price * 0.2) * 100
                },
                quantity: item.quantity,
            }
        })

        //create session
        const session = await stripeInstance.checkout.sessions.create({
            line_items,
            mode: "payment",
            success_url: `${origin}/loader?next=my-orders`,
            cancel_url: `${origin}/cart`,
            metadata: {
                orderId: String(order._id),        // Ensure string conversion
                userId: String(userId),            // Ensure string conversion
            }
        })

        await User.findByIdAndUpdate(userId, { $set: { cartItems: [] } }); // Also fix: use [] not {}

        return res.json({ success: true, url: session.url });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}


//Stripe webhook to verify payment action : /stripe
export const stripeWebhooks = async (request, response) => {
    //stripe gateway initialize
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

    const sig = request.headers["stripe-signature"];
    let event;

    try {
        event = stripeInstance.webhooks.constructEvent(
            request.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

    } catch (error) {
        response.status(400).send(`Webhook Error : ${error.message}`)

    }

    //handle event
    switch (event.type) {
        case "payment_intent.succeeded": {
            const paymentIntent = event.data.object;
            const paymentIntentId = paymentIntent.id;

            //getting session metadata
            const session = await stripeInstance.checkout.sessions.list({
                payment_intent: paymentIntentId,
            });

            const { orderId, userId } = session.data[0].metadata;

            //mark payment as paid
            await Order.findByIdAndUpdate(orderId, { isPaid: true })
            // clear user cart
            await User.findByIdAndUpdate(userId, { cartItems: {} });
            break;
        }

        case "payment_intent.payment_failed": {
            const paymentIntent = event.data.object;
            const paymentIntentId = paymentIntent.id;

            //getting session metadata
            const session = await stripeInstance.checkout.sessions.list({
                payment_intent: paymentIntentId,
            });

            const { orderId } = session.data[0].metadata;
            await Order.findByIdAndDelete(orderId);
            break;
        }
        default:
            console.error(`Unhandled event type ${event.type}`)
            break;

    }
    response.json({ received: true })


}

//get orders by user id : /api/order/user
export const getUserOrders = async (req, res) => {
    try {
        const auth0Id = req.user?.id || req.auth?.sub;
        const user = await User.findOne({ auth0Id: auth0Id });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const userId = user._id;
        const orders = await Order.find({
            userId
        }).populate('items.productId', 'name image category offerPrice')


            .populate('address')
            .sort({ createdAt: -1 });

        res.json({ success: true, orders })
    } catch (error) {
        console.error('Get orders error:', error);
        res.json({ success: false, message: error.message })
    }
}

//get all orders (for seller/admin) : api/order/seller
export const getAllOrders = async (req, res) => {
    try {
        console.log('Fetching all orders...');
        const orders = await Order.find({
            $or: [{ paymentType: "COD" }, { isPaid: true }]
        }).populate('items.productId', 'name image category offerPrice')
            .populate('address')
            .sort({ createdAt: -1 });

        console.log('Found orders:', orders);

        const ordersWithUserInfo = await Promise.all(
            orders.map(async (order) => {
                try {
                    const user = await User.findById(order.userId).select('name email');
                    return {
                        ...order.toObject(),
                        user: user || { name: 'Unknown', email: 'Unknown' }
                    };
                } catch (err) {
                    console.log('Error fetching user for order:', order._id, err.message);
                    return {
                        ...order.toObject(),
                        user: { name: 'Unknown', email: 'Unknown' }
                    };
                }
            })
        );


        res.json({ success: true, orders })
    } catch (error) {
        console.error('Get all orders error:', error);
        res.json({ success: false, message: error.message })
    }
}