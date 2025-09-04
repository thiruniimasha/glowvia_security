import React, { useEffect, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'
import { assets } from '../../assets/assets'

const Orders = () => {
    const { currency, axios } = useAppContext()
    const [orders, setOrders] = useState([])
    const [filter, setFilter] = useState('all') // all, upcoming, past
    const [sortBy, setSortBy] = useState('newest') // newest, oldest, delivery_date

    const fetchOrders = async () => {
        try{
           
            console.log('Fetching seller orders...'); 
            const {data} = await axios.get('/api/order/seller');
             console.log('Seller orders response:', data);
            if(data.success){
                setOrders(data.orders)
               
            }else {
                toast.error(data.message)
            }

        } catch (error){
             console.error('Fetch orders error:', error);
             toast.error(error.message)

        }
    };

    useEffect(() => {
        fetchOrders();
    }, [])

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const isUpcomingDelivery = (deliveryDate) => {
        const today = new Date()
        const delivery = new Date(deliveryDate)
        return delivery >= today
    }

    const getDeliveryStatus = (deliveryDate, orderStatus) => {
        const isUpcoming = isUpcomingDelivery(deliveryDate)
        if (orderStatus === 'Delivered') return 'delivered'
        return isUpcoming ? 'upcoming' : 'past'
    }

    // Filter and sort orders
    const filteredAndSortedOrders = orders
        .filter(order => {
            if (filter === 'all') return true
            if (filter === 'upcoming') return isUpcomingDelivery(order.purchaseInfo?.deliveryDate)
            if (filter === 'past') return !isUpcomingDelivery(order.purchaseInfo?.deliveryDate) && order.status !== 'Delivered'
            if (filter === 'delivered') return order.status === 'Delivered'
            return true
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'oldest':
                    return new Date(a.createdAt) - new Date(b.createdAt)
                case 'delivery_date':
                    return new Date(a.purchaseInfo?.deliveryDate) - new Date(b.purchaseInfo?.deliveryDate)
                case 'newest':
                default:
                    return new Date(b.createdAt) - new Date(a.createdAt)
            }
        })

    const getStatusColor = (status) => {
        switch (status) {
            case 'upcoming': return 'bg-blue-100 text-blue-800'
            case 'past': return 'bg-orange-100 text-orange-800'
            case 'delivered': return 'bg-green-100 text-green-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }


    

    return (
         <div className='no-scrollbar flex-1 h-[95vh] overflow-y-scroll'>
            <div className="md:p-10 p-4 space-y-6">
                {/* Header with filters */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Orders Management</h2>
                        <p className="text-gray-600">View all purchase information and delivery details</p>
                    </div>
                    
                    {/* Filter and Sort Controls */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <select 
                            value={filter} 
                            onChange={(e) => setFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="all">All Orders ({orders.length})</option>
                            <option value="upcoming">Upcoming Deliveries ({orders.filter(o => isUpcomingDelivery(o.purchaseInfo?.deliveryDate)).length})</option>
                            <option value="past">Past Deliveries ({orders.filter(o => !isUpcomingDelivery(o.purchaseInfo?.deliveryDate) && o.status !== 'Delivered').length})</option>
                            <option value="delivered">Delivered ({orders.filter(o => o.status === 'Delivered').length})</option>
                        </select>
                        
                        <select 
                            value={sortBy} 
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="delivery_date">By Delivery Date</option>
                        </select>
                    </div>
                </div>

                {/* Orders List */}
                {filteredAndSortedOrders.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No orders found for the selected filter.</p>
                    </div>
                ) : (
                    filteredAndSortedOrders.map((order, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            {/* Order Header */}
                            <div className="flex flex-col lg:flex-row justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <img className="w-12 h-12 object-cover" src={assets.box_icon} alt="Order Icon" />
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            Order #{order._id.slice(-6)}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            Placed: {formatDateTime(order.createdAt)}
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Status Badges */}
                                <div className="flex gap-2 mt-3 lg:mt-0">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        order.status === 'Order Placed' ? 'bg-blue-100 text-blue-800' :
                                        order.status === 'Shipped' ? 'bg-yellow-100 text-yellow-800' :
                                        order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {order.status}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(getDeliveryStatus(order.purchaseInfo?.deliveryDate, order.status))}`}>
                                        {getDeliveryStatus(order.purchaseInfo?.deliveryDate, order.status) === 'upcoming' ? 'Upcoming' : 
                                         getDeliveryStatus(order.purchaseInfo?.deliveryDate, order.status) === 'delivered' ? 'Delivered' : 'Past'}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        order.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {order.isPaid ? 'Paid' : 'Unpaid'}
                                    </span>
                                </div>
                            </div>

                            {/* Purchase Information Grid */}
                            {order.purchaseInfo && (
                                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                    <h4 className="font-semibold text-gray-800 mb-4">Purchase Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</p>
                                                <p className="text-sm font-medium text-gray-800">{order.purchaseInfo.username}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Order Date</p>
                                                <p className="text-sm text-gray-700">{formatDate(order.purchaseInfo.orderDate)}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Date</p>
                                                <p className={`text-sm font-medium ${
                                                    isUpcomingDelivery(order.purchaseInfo.deliveryDate) ? 'text-blue-600' : 'text-gray-700'
                                                }`}>
                                                    {formatDate(order.purchaseInfo.deliveryDate)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Time</p>
                                                <p className="text-sm text-gray-700">{order.purchaseInfo.deliveryTime}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Location</p>
                                                <p className="text-sm text-gray-700">{order.purchaseInfo.deliveryLocation}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</p>
                                                <p className="text-sm text-gray-700">{order.paymentType}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {order.purchaseInfo.message && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Special Instructions</p>
                                            <p className="text-sm text-gray-700 italic">"{order.purchaseInfo.message}"</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Products and Customer Details Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Products */}
                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-3">Items Ordered</h4>
                                    <div className="space-y-2">
                                        {order.items.map((item, itemIndex) => (
                                            <div key={itemIndex} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg">
                                                <img 
                                                    src={item.image} 
                                                    alt={item.name} 
                                                    className="w-12 h-12 object-cover rounded-md"
                                                />
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                                                    <p className="text-xs text-gray-600">
                                                        Qty: {item.quantity} × {currency}{item.price}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-sm">{currency}{item.price * item.quantity}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Customer Address */}
                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-3">Delivery Address</h4>
                                    <div className="bg-white border border-gray-100 rounded-lg p-4">
                                        <div className="space-y-1 text-sm">
                                            <p className="font-medium text-gray-800">
                                                {order.address.firstName} {order.address.lastName}
                                            </p>
                                            <p className="text-gray-600">{order.address.street}</p>
                                            <p className="text-gray-600">
                                                {order.address.city}, {order.address.state} {order.address.zipcode}
                                            </p>
                                            <p className="text-gray-600">{order.address.country}</p>
                                            <div className="pt-2 mt-2 border-t border-gray-100">
                                                <p className="text-gray-600">📞 {order.address.phone}</p>
                                                <p className="text-gray-600">✉️ {order.address.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Order Total */}
                            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
                                <div className="text-sm text-gray-600">
                                    <p>Order Total (includes 2% tax)</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-primary">{currency}{order.amount}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default Orders
