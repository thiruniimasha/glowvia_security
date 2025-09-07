import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Address from "../models/Address.js";
import stripe from "stripe";
import { body, validationResult } from "express-validator";

export const SRI_LANKA_DISTRICTS = [
  "Colombo","Gampaha","Kalutara","Kandy","Matale","Nuwara Eliya","Galle","Matara","Hambantota",
  "Jaffna","Kilinochchi","Mannar","Vavuniya","Mullaitivu","Batticaloa","Ampara","Trincomalee",
  "Kurunegala","Puttalam","Anuradhapura","Polonnaruwa","Badulla","Monaragala","Ratnapura","Kegalle"
];

// Validate delivery date (no Sundays, not in past)
const validateDeliveryDate = (deliveryDate) => {
  const date = new Date(deliveryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date < today) {
    return { valid: false, message: "Delivery date cannot be in the past" };
  }
  if (date.getDay() === 0) {
    return { valid: false, message: "Delivery not available on Sundays" };
  }
  return { valid: true };
};

// Validation schema
export const validateOrder = [
  body("items").isArray({ min: 1 }).withMessage("Items required"),
  body("items.*.productId").isMongoId().withMessage("Valid product ID required"),
  body("items.*.quantity").isInt({ min: 1, max: 100 }).withMessage("Quantity 1-100"),
  body("purchaseInfo.deliveryDate").isISO8601().withMessage("Valid date required"),
  body("purchaseInfo.deliveryTime").isIn(["10 AM", "11 AM", "12 PM"]).withMessage("Invalid time"),
  // username is optional, server will set
  body("purchaseInfo.username").optional().isString().trim().isLength({ max: 200 }).escape(),
  body("purchaseInfo.deliveryLocation")
  .isIn(SRI_LANKA_DISTRICTS)
  .withMessage("Invalid district"),
  body("purchaseInfo.message").optional().trim().isLength({ max: 500 }).escape(),
];

// Enforce username from IDP claims
const getUsernameFromToken = async (req) => {
  const auth0Id = req.auth?.sub;
  if (!auth0Id) return "Unknown";

  // Try to fetch the user from DB
  const user = await User.findOne({ auth0Id }).select("name email");
  if (user) {
    return user.name || user.email || "Unknown";
  }

  // fallback
  return req.auth?.name || req.auth?.nickname || req.auth?.email || "Unknown";
};


// ====================== COD ORDER ======================
export const placeOrderCOD = async (req, res) => {
  try {


    const { items, address, purchaseInfo } = req.body;

    // Extract from req.auth (not req.user)
    const auth0Id = req.auth?.sub;
    if (!auth0Id) {
      return res.status(401).json({ success: false, message: "User authentication required" });
    }

    const user = await User.findOne({ auth0Id });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found. Please ensure your profile is created." });
    }

    const userId = user._id;

    purchaseInfo.username = await getUsernameFromToken(req);



    
    if (!address || !items || items.length === 0) {
      return res.json({ success: false, message: "Invalid Data" });
    }

   

    if (!purchaseInfo) {
      return res.json({ success: false, message: "Purchase information is required" });
    }

    const { deliveryDate, deliveryTime, deliveryLocation } = purchaseInfo;
    if (!deliveryDate || !deliveryTime || !deliveryLocation) {
      return res.json({ success: false, message: "Missing required purchase information" });
    }

    const dateValidation = validateDeliveryDate(deliveryDate);
    if (!dateValidation.valid) {
      return res.json({ success: false, message: dateValidation.message });
    }

    // calculate total
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
        image: product.image[0],
      });
    }

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
    deliveryDate: new Date(deliveryDate),
    deliveryTime,
    deliveryLocation,
    message: purchaseInfo.message || "",
  },
});

    await User.findByIdAndUpdate(userId, { $set: { cartItems: [] } }); 

    return res.json({ success: true, message: "Order Placed Successfully" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// ====================== STRIPE ORDER ======================
export const placeOrderStripe = async (req, res) => {
  try {
    const { items, address, purchaseInfo } = req.body;

    
    

   purchaseInfo.username = await getUsernameFromToken(req);


    const auth0Id = req.user?.id || req.auth?.sub;

    const user = await User.findOne({ auth0Id });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const userId = user._id;

    const origin = process.env.FRONTEND_URL || req.headers.origin || "https://localhost:5173";

    if (!purchaseInfo) {
      return res.json({ success: false, message: "Purchase information is required" });
    }

    const { deliveryDate, deliveryTime, deliveryLocation } = purchaseInfo;
    if (!deliveryDate || !deliveryTime || !deliveryLocation) {
      return res.json({ success: false, message: "Missing required purchase information" });
    }

    const dateValidation = validateDeliveryDate(deliveryDate);
    if (!dateValidation.valid) {
      return res.json({ success: false, message: dateValidation.message });
    }

    let productData = [];
    let amount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.json({ success: false, message: `Product not found : ${item.productId}` });
      }

      productData.push({
        name: product.name,
        price: product.offerPrice,
        quantity: item.quantity,
        image: product.image[0],
      });

      const itemTotal = product.offerPrice * item.quantity;
      amount += itemTotal;

      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        name: product.name,
        price: product.offerPrice,
        image: product.image[0],
      });
    }

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
        deliveryDate: new Date(deliveryDate),
        deliveryTime,
        deliveryLocation,
        message: purchaseInfo.message || "",
      },
    });

    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

    const line_items = productData.map((item) => ({
      price_data: {
        currency: "lkr",
        product_data: { name: item.name },
        unit_amount: (item.price + item.price * 0.2) * 100,
      },
      quantity: item.quantity,
    }));

    const session = await stripeInstance.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${origin}/loader?next=my-orders`,
      cancel_url: `${origin}/cart`,
      metadata: { orderId: String(order._id), userId: String(userId) },
    });

    await User.findByIdAndUpdate(userId, { $set: { cartItems: [] } });

    return res.json({ success: true, url: session.url });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// ====================== STRIPE WEBHOOK ======================
export const stripeWebhooks = async (request, response) => {
  const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
  const sig = request.headers["stripe-signature"];
  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return response.status(400).send(`Webhook Error : ${error.message}`);
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      const session = await stripeInstance.checkout.sessions.list({ payment_intent: paymentIntent.id });
      const { orderId, userId } = session.data[0].metadata;

      await Order.findByIdAndUpdate(orderId, { isPaid: true });
      await User.findByIdAndUpdate(userId, { cartItems: [] }); 
      break;
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      const session = await stripeInstance.checkout.sessions.list({ payment_intent: paymentIntent.id });
      const { orderId } = session.data[0].metadata;
      await Order.findByIdAndDelete(orderId);
      break;
    }
    default:
      console.error(`Unhandled event type ${event.type}`);
      break;
  }
  response.json({ received: true });
};

// ====================== GET ORDERS ======================
export const getUserOrders = async (req, res) => {
  try {
    const auth0Id = req.user?.id || req.auth?.sub;
    const user = await User.findOne({ auth0Id });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const orders = await Order.find({ userId: user._id })
      .populate("items.productId", "name image category offerPrice")
      .populate("address")
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    console.error("Get orders error:", error);
    res.json({ success: false, message: error.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [{ paymentType: "COD" }, { isPaid: true }],
    })
      .populate("items.productId", "name image category offerPrice")
      .populate("address")
      .sort({ createdAt: -1 });

    const ordersWithUserInfo = await Promise.all(
      orders.map(async (order) => {
        try {
          let user = null;

          if (/^[0-9a-fA-F]{24}$/.test(order.userId)) {
            user = await User.findById(order.userId).select("name email");
          }

         
          if (!user) {
            user = await User.findOne({ auth0Id: order.userId }).select("name email");
          }

          return {
            ...order.toObject(),
            user: user
              ? { name: user.name, email: user.email }
              : { name: "Unknown", email: "Unknown" },
          };
        } catch (err) {
          return { ...order.toObject(), user: { name: "Unknown", email: "Unknown" } };
        }
      })
    );

    res.json({ success: true, orders: ordersWithUserInfo });
  } catch (error) {
    console.error("Get all orders error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ====================== CANCEL ORDER ======================
export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const auth0Id = req.user?.id || req.auth?.sub;
    if (!auth0Id) {
      return res.status(401).json({ success: false, message: "User authentication required" });
    }

    const user = await User.findOne({ auth0Id });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!order.userId.equals(user._id)) {
      return res.status(403).json({ success: false, message: "Not authorized to cancel this order" });
    }

    if (order.isPaid || order.paymentType === "Online") {
      return res.status(400).json({ success: false, message: "Cannot cancel paid orders" });
    }

    order.status = "Cancelled";
    await order.save();

    res.status(200).json({ success: true, message: "Order cancelled successfully", order });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
