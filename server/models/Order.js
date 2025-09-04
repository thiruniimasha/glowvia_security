import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'product' },
        quantity: Number,
        name: String,
        price: Number,
        image: String,
         productName: String
    }],
    amount: { type: Number, required: true },
    address: { type: mongoose.Schema.Types.ObjectId,
        ref: 'address',
        required: true },
    status: { type: String, default: 'Order Placed' },
    paymentType: { type: String,
        enum: ['COD', 'Online'],
        default: 'COD' },
    isPaid: { type: Boolean, required: true, default: false },

    purchaseInfo: {
        username: { type: String, required: true }, // Authenticated user's username
        orderDate: { type: Date, default: Date.now }, // Date of purchase
        deliveryDate: { type: Date, required: true }, // Preferred delivery date
        deliveryTime: { 
            type: String, 
            enum: ['10 AM', '11 AM', '12 PM'], 
            required: true 
        }, 

        deliveryLocation: { type: String, required: true }, // Preferred delivery location (district)
        message: { type: String, default: '' } // Optional message/special instructions
    }

}, { timestamps: true })

export default mongoose.model('Order', orderSchema);