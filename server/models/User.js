import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    
    name: { type: String, required: true },

    email: {
      type: String,
      unique: true,
      sparse: true, 
      required: function () {
        return this.authProvider === "local"; 
      },
    },

  
    password: { type: String, required: function () { return this.authProvider === "local"; } }, 

   
    auth0Id: { type: String, unique: true, sparse: true }, 
    authProvider: { type: String, enum: ["local", "auth0"], default: "auth0" },

   
    contactNumber: { type: String, default: "" },
    country: { type: String, default: "" },

    
    cartItems: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "product" },
        quantity: { type: Number, default: 0 },
      },
    ],

    
    addresses: [{ type: mongoose.Schema.Types.ObjectId, ref: "address" }],
  },
  { minimize: false, timestamps: true }
);


const User = mongoose.models.user || mongoose.model("user", userSchema);

export default User;
