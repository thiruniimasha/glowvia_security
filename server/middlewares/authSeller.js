import jwt from "jsonwebtoken";

const authSeller = (req, res, next) => {
  try {
    const token = req.cookies.sellerToken;

    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "seller") {
      return res.status(403).json({ success: false, message: "Forbidden: Not a seller" });
    }

    req.seller = decoded;
    next();
  } catch (error) {
    console.error("JWT verification failed:", error.message);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

export default authSeller;
