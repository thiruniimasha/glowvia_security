import User from "../models/User.js";

export const updateCart = async (req, res) => {
  try {
    console.log('updateCart called');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Auth data:', req.auth);
    
    const auth0Id = req.auth?.sub;
    if (!auth0Id) {
      return res.status(401).json({ success: false, message: "User ID not found in token" });
    }

    const { cartItems } = req.body;
    
    console.log('Received cartItems:', cartItems, 'Type:', typeof cartItems, 'Is Array:', Array.isArray(cartItems));
    
    if (!Array.isArray(cartItems)) {
      return res.status(400).json({ success: false, message: "cartItems must be an array" });
    }

    console.log('Looking for user with auth0Id:', auth0Id);

    const updatedUser = await User.findOneAndUpdate(
      { auth0Id: auth0Id },
      { cartItems: cartItems },
      { new: true, upsert: false }
    );

    if (!updatedUser) {
      console.error('User not found with auth0Id:', auth0Id);
      return res.status(404).json({ 
        success: false, 
        message: "User not found. Please make sure your profile is created." 
      });
    }

    console.log('Cart updated successfully for user:', updatedUser.email);
    res.json({ success: true, message: "Cart updated successfully" });

  } catch (error) {
    console.error("Error updating cart:", error.name, error.message, error.stack);
    res.status(500).json({ success: false, message: error.message });
  }
}