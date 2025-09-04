import { useEffect, useState } from "react"
import { useAuth0 } from "@auth0/auth0-react"
import { useAppContext } from "../context/AppContext"
import { assets } from "../assets/assets"
import toast from "react-hot-toast"

const Cart = () => {
    const { products, currency, cartItems, removeFromCart, getCartCount, updateCartItem, navigate, getCartAmount, setCartItems } = useAppContext()
    const { user: auth0User, isLoading: userLoading, isAuthenticated, getAccessTokenSilently, loginWithRedirect } = useAuth0()

    const [cartArray, setCartArray] = useState([])
    const [addresses, setAddresses] = useState([])
    const [showAddress, setShowAddress] = useState(false)
    const [selectedAddress, setSelectedAddress] = useState(null)
    const [paymentOption, setPaymentOption] = useState("COD")
    const [deliveryDate, setDeliveryDate] = useState("")
    const [deliveryTime, setDeliveryTime] = useState("10 AM")
    const [deliveryLocation, setDeliveryLocation] = useState("")
    const [message, setMessage] = useState("")

    const districts = [
        "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
        "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar",
        "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee",
        "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla",
        "Monaragala", "Ratnapura", "Kegalle"
    ]

    const deliveryTimes = ["10 AM", "11 AM", "12 PM"]

    // Helper function to make authenticated API calls
    const makeAuthenticatedRequest = async (url, options = {}) => {
        try {
            if (!isAuthenticated) {
                throw new Error('User not authenticated');
            }

            console.log(`Making authenticated request to: ${url}`);
            
            const token = await getAccessTokenSilently({
                audience: import.meta.env.VITE_AUTH0_AUDIENCE,
                scope: 'openid profile email'
            });

            console.log('Token obtained for request:', !!token);

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}${url}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    ...options.headers
                }
            });

            console.log(`Response status for ${url}:`, response.status);

            const data = await response.json();
            console.log(`Response data for ${url}:`, data);

            return data;
        } catch (error) {
            console.error(`Error in authenticated request to ${url}:`, error);
            
            if (error.error === 'login_required' || error.error === 'consent_required') {
                console.log('Login required, redirecting...');
                loginWithRedirect();
            }
            
            throw error;
        }
    };

    // Debug auth state
    useEffect(() => {
        console.log('Cart component - Auth state:', {
            isAuthenticated,
            isLoading: userLoading,
            hasAuth0User: !!auth0User,
            auth0UserEmail: auth0User?.email,
            auth0UserSub: auth0User?.sub
        });
    }, [isAuthenticated, userLoading, auth0User]);

    const getCart = () => {
        let tempArray = []
        for (const key in cartItems) {
            const product = products.find((item) => item._id === key)
            if (product) {
                product.quantity = cartItems[key]
                tempArray.push(product)
            }
        }
        setCartArray(tempArray)
    }

    const getUserAddress = async () => {
        try {
            console.log('getUserAddress called');
            const data = await makeAuthenticatedRequest('/api/address/get');
            
            if (data.success) {
                setAddresses(data.addresses || [])
                if (data.addresses && data.addresses.length > 0) {
                    setSelectedAddress(data.addresses[0])
                }
            } else {
                console.log('Address fetch failed:', data.message);
                toast.error(data.message || 'Failed to load addresses')
            }
        } catch (error) {
            console.error('getUserAddress error:', error);
            toast.error('Failed to load addresses')
        }
    }

    const isValidDeliveryDate = (date) => {
        const selectedDate = new Date(date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (selectedDate < today) {
            return false
        }

        if (selectedDate.getDay() === 0) {
            return false
        }

        return true
    }

    const validatePurchaseInfo = () => {
        if (!selectedAddress) {
            toast.error("Please select a delivery address")
            return false
        }

        if (!deliveryDate) {
            toast.error("Please select a delivery date")
            return false
        }

        if (!isValidDeliveryDate(deliveryDate)) {
            toast.error("Delivery date cannot be in the past or on Sunday")
            return false
        }

        if (!deliveryLocation) {
            toast.error("Please select a delivery location (district)")
            return false
        }

        return true
    }

    const placeOrder = async () => {
        try {
            if (!validatePurchaseInfo()) {
                return
            }

            if (!auth0User) {
                toast.error("User information not available. Please try again.")
                return
            }

            const orderItems = cartArray.map(item => ({
                productId: item._id,
                quantity: item.quantity,
                productName: item.name
            }));

            const purchaseInfo = {
                username: auth0User.name || auth0User.nickname,
                userEmail: auth0User.email,
                deliveryDate,
                deliveryTime,
                deliveryLocation,
                message: message.trim() || "",
                orderDate: new Date().toISOString()
            }

            const orderData = {
                userId: auth0User.sub,
                items: orderItems,
                address: selectedAddress._id,
                purchaseInfo
            };

            if (paymentOption === "COD") {
                const data = await makeAuthenticatedRequest('/api/order/cod', {
                    method: 'POST',
                    body: JSON.stringify(orderData)
                });

                if (data.success) {
                    toast.success(data.message)
                    setCartItems({})
                    navigate('/my-orders')
                } else {
                    toast.error(data.message)
                }
            } else {
                const data = await makeAuthenticatedRequest('/api/order/stripe', {
                    method: 'POST',
                    body: JSON.stringify(orderData)
                });

                if (data.success) {
                    window.location.replace(data.url)
                } else {
                    toast.error(data.message)
                }
            }
        } catch (error) {
            console.error('Place order error:', error);
            toast.error('Failed to place order')
        }
    }

    const getMinDate = () => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        return tomorrow.toISOString().split('T')[0]
    }

    useEffect(() => {
        if (products.length > 0 && cartItems) {
            getCart()
        }
    }, [products, cartItems])

    // Wait for Auth0 to fully load before fetching addresses
    useEffect(() => {
        if (isAuthenticated && auth0User && !userLoading) {
            console.log('Auth ready, fetching addresses...');
            getUserAddress()
        }
    }, [isAuthenticated, auth0User, userLoading])

    if (userLoading) {
        return (
            <div className="flex justify-center items-center mt-16 min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading...</p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return (
            <div className="flex justify-center items-center mt-16 min-h-[400px]">
                <div className="text-center">
                    <p className="text-gray-500 mb-4">Please log in to view your cart</p>
                    <button 
                        onClick={() => loginWithRedirect()}
                        className="bg-primary text-white px-6 py-2 rounded hover:bg-primary-dull transition"
                    >
                        Login
                    </button>
                </div>
            </div>
        )
    }

    return products.length > 0 && cartItems && Object.keys(cartItems).length > 0 ? (
        <div className="flex flex-col md:flex-row mt-16">
            <div className='flex-1 max-w-4xl'>
                <h1 className="text-3xl font-medium mb-6">
                    Shopping Cart <span className="text-sm text-primary">{getCartCount()} Items</span>
                </h1>

                <div className="grid grid-cols-[2fr_1fr_1fr] text-gray-500 text-base font-medium pb-3">
                    <p className="text-left">Product Details</p>
                    <p className="text-center">Subtotal</p>
                    <p className="text-center">Action</p>
                </div>

                {cartArray.map((product, index) => (
                    <div key={index} className="grid grid-cols-[2fr_1fr_1fr] text-gray-500 items-center text-sm md:text-base font-medium pt-3">
                        <div className="flex items-center md:gap-6 gap-3">
                            <div className="cursor-pointer w-24 h-24 flex items-center justify-center border border-gray-300 rounded overflow-hidden">
                                <img className="max-w-full h-full object-cover" src={product.image[0]} alt={product.name} />
                            </div>
                            <div>
                                <p className="hidden md:block font-semibold">{product.name}</p>
                                <div className="font-normal text-gray-500/70">
                                    <p>Size: <span>{product.size || "N/A"}</span></p>
                                    <div className='flex items-center'>
                                        <p>Qty:</p>
                                        <select onChange={e => updateCartItem(product._id, Number(e.target.value))} value={cartItems[product._id]} className='outline-none'>
                                            {Array(5).fill('').map((_, index) => (
                                                <option key={index} value={index + 1}>{index + 1}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-center">{currency}{product.offerPrice * product.quantity}</p>
                        <button onClick={() => removeFromCart(product._id)} className="cursor-pointer mx-auto">
                            <img src={assets.remove_icon} alt="remove" className="inline-block w-6 h-6" />
                        </button>
                    </div>)
                )}

                <button onClick={() => { navigate("/products"); scrollTo(0, 0) }} className="group cursor-pointer flex items-center mt-8 gap-2 text-primary font-medium">
                    <img className="group-hover:-translate-x-1 transition" src={assets.arrow_right_icon_colored} alt="arrow" />
                    Continue Shopping
                </button>
            </div>

            <div className="max-w-[500px] w-full bg-gray-100/40 p-5 max-md:mt-16 border border-gray-300/70">
                <h2 className="text-xl md:text-xl font-medium">Order Summary</h2>
                <hr className="border-gray-300 my-5" />

                <div className="mb-6">
                    <p className="text-sm font-medium uppercase mb-2">Customer Information</p>
                    <div className="space-y-1">
                        <p className="text-gray-600 text-sm">
                            Name: {auth0User?.name || auth0User?.nickname || 'Not provided'}
                        </p>
                        <p className="text-gray-600 text-sm">
                            Email: {auth0User?.email || 'Not provided'}
                        </p>
                    </div>
                </div>

                <div className="mb-6">
                    <p className="text-sm font-medium uppercase mb-3">Delivery Information</p>

                    <div className="mb-3">
                        <label className="block text-sm text-gray-600 mb-1">Delivery Date *</label>
                        <input
                            type="date"
                            value={deliveryDate}
                            onChange={(e) => setDeliveryDate(e.target.value)}
                            min={getMinDate()}
                            className="w-full border border-gray-300 bg-white px-3 py-2 rounded outline-none focus:border-primary"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">Note: Delivery not available on Sundays</p>
                    </div>

                    <div className="mb-3">
                        <label className="block text-sm text-gray-600 mb-1">Preferred Delivery Time *</label>
                        <select
                            value={deliveryTime}
                            onChange={(e) => setDeliveryTime(e.target.value)}
                            className="w-full border border-gray-300 bg-white px-3 py-2 rounded outline-none focus:border-primary"
                        >
                            {deliveryTimes.map(time => (
                                <option key={time} value={time}>{time}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-3">
                        <label className="block text-sm text-gray-600 mb-1">Delivery District *</label>
                        <select
                            value={deliveryLocation}
                            onChange={(e) => setDeliveryLocation(e.target.value)}
                            className="w-full border border-gray-300 bg-white px-3 py-2 rounded outline-none focus:border-primary"
                            required
                        >
                            <option value="">Select District</option>
                            {districts.map(district => (
                                <option key={district} value={district}>{district}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-6">
                        <p className="text-sm font-medium uppercase">Delivery Address</p>
                        <div className="relative flex justify-between items-start mt-2">
                            <p className="text-gray-500">
                                {selectedAddress ? 
                                    `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state}, ${selectedAddress.country}` : 
                                    "No address found"
                                }
                            </p>
                            <button onClick={() => setShowAddress(!showAddress)} className="text-primary hover:underline cursor-pointer">
                                Change
                            </button>
                            {showAddress && (
                                <div className="absolute top-12 py-1 bg-white border border-gray-300 text-sm w-full z-10">
                                    {addresses.map((address, index) => (
                                        <p
                                            key={address._id}
                                            onClick={() => {
                                                setSelectedAddress(address);
                                                setShowAddress(false);
                                            }}
                                            className={`text-gray-500 p-2 hover:bg-gray-100 cursor-pointer ${selectedAddress?._id === address._id ? 'bg-gray-100' : ''}`}
                                        >
                                            {address.street}, {address.city}, {address.state}, {address.country}
                                        </p>
                                    ))}
                                    <p onClick={() => navigate("/add-address")} className="text-primary text-center cursor-pointer p-2 hover:bg-primary/10">
                                        Add address
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="block text-sm text-gray-600 mb-1">Special Instructions (Optional)</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Any special delivery instructions..."
                            className="w-full border border-gray-300 bg-white px-3 py-2 rounded outline-none focus:border-primary resize-none"
                            rows="3"
                        />
                    </div>
                </div>

                <div className="mb-6">
                    <p className="text-sm font-medium uppercase mt-6">Payment Method</p>
                    <select onChange={e => setPaymentOption(e.target.value)} className="w-full border border-gray-300 bg-white px-3 py-2 mt-2 outline-none">
                        <option value="COD">Cash On Delivery</option>
                        <option value="Online">Online Payment</option>
                    </select>
                </div>

                <hr className="border-gray-300" />

                <div className="text-gray-500 mt-4 space-y-2">
                    <p className="flex justify-between">
                        <span>Price</span><span>{currency}{getCartAmount()}</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Shipping Fee</span><span className="text-green-600">Free</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Tax (2%)</span><span>{currency} {(getCartAmount() * 2 / 100).toFixed(2)}</span>
                    </p>
                    <p className="flex justify-between text-lg font-medium mt-3">
                        <span>Total Amount:</span><span>{currency} {(getCartAmount() + getCartAmount() * 2 / 100).toFixed(2)} </span>
                    </p>
                </div>

                <button
                    onClick={placeOrder}
                    disabled={userLoading}
                    className={`w-full py-3 mt-6 cursor-pointer font-medium transition ${
                        userLoading 
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                            : 'bg-primary text-white hover:bg-primary-dull'
                    }`}
                >
                    {userLoading ? 'Loading...' : (paymentOption === "COD" ? "Place Order" : "Proceed to Checkout")}
                </button>
            </div>
        </div>
    ) : (
        <div className="flex justify-center items-center mt-16 min-h-[400px]">
            <div className="text-center">
                <p className="text-gray-500 mb-4">
                    {!isAuthenticated ? 'Please log in to view your cart' : 'Your cart is empty'}
                </p>
                <button 
                    onClick={() => navigate(!isAuthenticated ? '/login' : '/products')}
                    className="bg-primary text-white px-6 py-2 rounded hover:bg-primary-dull transition"
                >
                    {!isAuthenticated ? 'Login' : 'Start Shopping'}
                </button>
            </div>
        </div>
    )
}

export default Cart