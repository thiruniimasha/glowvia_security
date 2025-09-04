import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  // Common fields
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },

  // Local auth fields (legacy/seller)
  password: { type: String, required: false }, // now optional

  // Auth0 fields
  auth0Id: { type: String, unique: true, sparse: true }, // e.g. "auth0|123456789"
  authProvider: { type: String, enum: ["local", "auth0"], default: "auth0" },

  // Extra fields
  contactNumber: { type: String, default: "" },
  country: { type: String, default: "" },

  // Cart items as an array
  cartItems: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "product" },
      quantity: { type: Number, default: 0},
    },
  ],

  // Optional: multiple addresses
  addresses: [{ type: mongoose.Schema.Types.ObjectId, ref: "address" }],
},
{ minimize: false, timestamps: true });

const User = mongoose.models.user || mongoose.model("user", userSchema);

export default User;
