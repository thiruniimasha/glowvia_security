import Address from "../models/Address.js"
import User from "../models/User.js"

//add address : /api/address/add
export const addAddress = async (req, res) => {
    try {
        const { address } = req.body;
        const auth0Id = req.auth?.sub;

        if (!auth0Id) {
            return res.json({ success: false, message: "User ID not found in token" });
        }

        // Find the user by Auth0 ID
        const user = await User.findOne({ auth0Id });
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        await Address.create({ ...address, userId: user._id });
        res.json({ success: true, message: "Address added successfully" });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

//get address : /api/address/get
export const getAddress = async (req, res) => {
    try {
        const auth0Id = req.auth?.sub;
        if (!auth0Id) {
            return res.json({ success: false, message: "User ID not found in token" });
        }

        const user = await User.findOne({ auth0Id });
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        const addresses = await Address.find({ userId: user._id });
        res.json({ success: true, addresses });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}