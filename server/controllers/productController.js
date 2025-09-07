import { v2 as cloudinary} from "cloudinary"
import Product from "../models/Product.js"


//Add product : /api/product/add
export const addProduct = async (req , res) => {
    try{
        let productData = JSON.parse(req.body.productData)

        const images = req.files

        let imagesUrl = await Promise.all(
            images.map ( async (item) => {
                let result = await cloudinary.uploader.upload(item.path,{resource_type: 'image'});
                return result.secure_url
            })
        )

        await Product.create({...productData, image: imagesUrl})

        res.json({success: true, message: "Product Added"})

    }catch(error){
        console.log(error.message);
        res.json({ success: false, message: error.message})
    }

}

//Get product : /api/product/list
export const productList = async (req , res) => {
    try{
        const products = await Product.find({})
        res.json({success: true, products})
    }catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message})
    }

}

//Get single product : /api/product/id
export const productById = async (req , res) => {
    try{
        const { id } = req.body
        const product = await Product.findById(id)
        res.json({success: true, product })
    }catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message})
    }


}

//Change Product inStock : /api/product/stock


export const changeStock = async (req, res) => {
  try {
    const { id, inStock } = req.body;

    if (!id || typeof inStock !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Invalid input: must provide product ID and inStock as boolean",
      });
    }

    
    if (!req.seller || req.seller.role !== "seller") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: you are not allowed to update stock",
      });
    }

    const updated = await Product.findByIdAndUpdate(
      id,
      { inStock },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({ success: true, message: "Stock updated", product: updated });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

