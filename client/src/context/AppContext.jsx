import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";

// Base Axios config
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;
axios.defaults.headers.common["Content-Type"] = "application/json";

axios.defaults.withCredentials = true;

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const currency = import.meta.env.VITE_CURRENCY;
  const navigate = useNavigate();

  const { user: auth0User, isAuthenticated, getAccessTokenSilently, loginWithRedirect, logout } = useAuth0();

  const [user, setUser] = useState(null);
  const [isSeller, setIsSeller] = useState(false);
  const [showUserLogin, setShowUserLogin] = useState(false);
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  // Debug Auth0 state
  useEffect(() => {
    console.log('Auth0 State:', {
      isAuthenticated,
      hasUser: !!auth0User,
      userName: auth0User?.name,
      userEmail: auth0User?.email
    });
  }, [isAuthenticated, auth0User]);

  // Attach Auth0 token to Axios
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(async (config) => {
      // Skip auth header for public endpoints
      if (config.url.includes('/api/product/list')) {
        return config;
      }

      console.log('Making request to:', config.url);

      if (isAuthenticated) {
        try {
          console.log('Getting access token...');
          const token = await getAccessTokenSilently({
            audience: import.meta.env.VITE_AUTH0_AUDIENCE,
            scope: 'openid profile email',
            timeoutInSeconds: 10
          }).catch(error => {
            console.error('Token fetch failed:', error);
            if (error.error === 'login_required' || error.error === 'consent_required') {
              loginWithRedirect();
              throw error;
            }
            return null;
          });

          if (token) {
            console.log('Token received successfully');
            config.headers.Authorization = `Bearer ${token}`;
            console.log('Request headers set:', config.headers);
          } else {
            console.warn('No token available');
          }
        } catch (err) {
          console.error("Failed to fetch token:", err.message, err.stack);
          if (err.error === 'login_required') {
            console.log('Login required, redirecting...');
            loginWithRedirect();
          }
        }
      } else {
        console.log('User not authenticated, skipping token');
      }
      return config;
    });

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
    };
  }, [isAuthenticated, getAccessTokenSilently]);

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Fetch user and seller info
  useEffect(() => {
    if (isAuthenticated && auth0User) {
      fetchUser();
      fetchSeller();
    } else {
      setUser(null);
      setCartItems({});
      setIsSeller(false);
    }
  }, [isAuthenticated, auth0User]);

  const fetchUser = async () => {
    try {
      const { data } = await axios.get("/api/user/profile");
      if (data.success && data.user) {
        setUser(data.user);

        // Transform cart array to object for frontend
        const cartObj = {};
        (data.user.cartItems || []).forEach(item => {
          cartObj[item.productId] = item.quantity;
        });

        setCartItems(cartObj);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
      setCartItems({});
    }
  };


  const fetchSeller = async () => {
    try {
      const { data } = await axios.get("/api/seller/is-auth");
      setIsSeller(data.success);
    } catch {
      setIsSeller(false);
    }
  };

  // Helper to convert cart object to array for backend
  const cartObjectToArray = (cartObj) =>
    Object.entries(cartObj).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));

  // Cart helpers with auto-sync
  const addToCart = (product, quantity = 1) => {
    console.log('🛒 addToCart called with:', { product, quantity });
    // Add validation
    if (!product || !product._id) {
      console.error('Invalid product:', product);
      return;
    }
    console.log('✅ Valid product ID:', product._id);

    setCartItems(prevItems => {
      console.log('📦 Current cart items before update:', prevItems);

      const newItems = { ...prevItems };

      if (newItems[product._id]) {
        newItems[product._id] += quantity;
        console.log('📝 Updated existing item, new quantity:', newItems[product._id]);
      } else {
        newItems[product._id] = quantity;

      }

      console.log('🆕 New cart items:', newItems);
      return newItems;
    });
    toast.success("Add to Cart");
  };

  const updateCartItem = async (itemId, quantity) => {
    console.log('🔄 updateCartItem called:', { itemId, quantity });

    setCartItems(prevItems => {
      const newItems = { ...prevItems };

      if (quantity > 0) {
        newItems[itemId] = quantity;
      } else {
        delete newItems[itemId];
      }

      console.log('Updated cart items:', newItems);
      return newItems;
    });

    toast.success("Cart Updated");
  };

  const removeFromCart = async (itemId) => {

    setCartItems(prevItems => {
      const newItems = { ...prevItems };

      if (newItems[itemId]) {
        newItems[itemId] -= 1;
        if (newItems[itemId] <= 0) {
          delete newItems[itemId];
        }
      }

      return newItems;
    });

    toast.success("Removed from Cart");
  };

  const clearCart = async () => {
    console.log('🧹 clearCart called');
    setCartItems({});
    toast.success("Cart cleared");
  };

  useEffect(() => {
    console.log('🔄 Cart items changed, checking sync. Items:', cartItems);
    console.log('Auth state:', { isAuthenticated, hasUser: !!user });

    // Only sync if user is authenticated and cart has items
    if (isAuthenticated && user && Object.keys(cartItems).length > 0) {
      console.log('✅ Conditions met, syncing cart...');

      // Add delay to batch rapid updates
      const timeoutId = setTimeout(() => {
        syncCart(cartItems);
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      console.log(' Skipping sync - conditions not met');
    }
  }, [cartItems, isAuthenticated, user]);


  // Sync cart to backend
  const syncCart = async (cartObj = cartItems) => {
    console.log('🔄 syncCart called with:', {
      cartObj,
      hasUser: !!user,
      isAuthenticated,
      userEmail: user?.email
    });

    if (!user || !isAuthenticated) {
      console.log(' User not authenticated, skipping cart sync');
      return;
    }

    try {
      // Convert object to array and filter valid items
      const cartArray = Object.entries(cartObj)
        .filter(([productId, quantity]) =>
          productId &&
          productId !== 'undefined' &&
          quantity > 0
        )
        .map(([productId, quantity]) => ({
          productId,
          quantity
        }));

      console.log(' Sending to backend:', {
        url: '/api/cart/update',
        cartArray: cartArray,
      });

      const response = await axios.post("/api/cart/update", {
        cartItems: cartArray,
      });

      console.log(" Cart synced successfully:", response.data);
    } catch (error) {
      console.error(" Failed to sync cart:", error);
      console.error('Full error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
      });

      toast.error("Failed to sync cart with server");
    }
  };

  const getCartCount = () =>
    Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);

  const getCartAmount = () =>
    Object.entries(cartItems).reduce((total, [id, qty]) => {
      const itemInfo = products.find((p) => p._id === id);
      return total + (itemInfo ? itemInfo.offerPrice * qty : 0);
    }, 0);


  // Fetch products from backend
  const fetchProducts = async () => {
    try {
      console.log('Fetching products...');
      const { data } = await axios.get("/api/product/list");
      console.log('Products response:', data);
      if (data.success) {
        setProducts(data.products);
        console.log('Products set in state:', data.products);
      } else {
        console.error('Failed to fetch products:', data.message);
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error(error.message);
    }
  };

  // Cancel order by ID
const cancelOrder = async (orderId) => {
  if (!orderId) return;

  try {
    const { data } = await axios.delete(`/api/order/cancel/${orderId}`);
    if (data.success) {
      toast.success("Order cancelled successfully");
      return true; 
    } else {
      toast.error(data.message || "Failed to cancel order");
      return false;
    }
  } catch (error) {
    console.error("Cancel order error:", error);
    toast.error(error.response?.data?.message || error.message || "Failed to cancel order");
    return false;
  }
};



  const value = {
    navigate,
    user,
    isSeller,
    setIsSeller,
    showUserLogin,
    setShowUserLogin,
    products,
    currency,
    cartItems,
    setCartItems,
    addToCart,
    updateCartItem,
    removeFromCart,
    getCartCount,
    getCartAmount,
    fetchProducts,
    clearCart,
    searchQuery,
    setSearchQuery,
    axios,
    logout, 
    cancelOrder,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
