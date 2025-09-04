import React from 'react'
import { useAppContext } from '../context/AppContext'

const OrderDetails = ({ order }) => {
    const { currency } = useAppContext()

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
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

    return (
        <div className="border border-gray-200 p-6 rounded-lg mb-6 bg-white shadow-sm">
            {/* Order Header */}
            <div className="flex flex-col md:flex-row justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">Order #{order._id.slice(-6)}</h3>
                    <p className="text-sm text-gray-600">
                        Placed on {formatDateTime(order.createdAt)}
                    </p>
                </div>
                <div className="flex flex-col md:flex-row gap-2 mt-2 md:mt-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === 'Order Placed' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'Shipped' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                        {order.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.isPaid ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                        {order.isPaid ? 'Paid' : 'Pending Payment'}
                    </span>
                </div>
            </div>

            {/* Purchase Information */}
            {order.purchaseInfo && (
                <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3">Purchase Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p><span className="font-medium">Customer:</span> {order.purchaseInfo.username}</p>
                            <p><span className="font-medium">Order Date:</span> {formatDate(order.purchaseInfo.orderDate)}</p>
                            <p><span className="font-medium">Delivery Date:</span> {formatDate(order.purchaseInfo.deliveryDate)}</p>
                        </div>
                        <div>
                            <p><span className="font-medium">Delivery Time:</span> {order.purchaseInfo.deliveryTime}</p>
                            <p><span className="font-medium">Delivery Location:</span> {order.purchaseInfo.deliveryLocation}</p>
                            <p><span className="font-medium">Payment Method:</span> {order.paymentType}</p>
                        </div>
                        {order.purchaseInfo.message && (
                            <div className="md:col-span-2">
                                <p><span className="font-medium">Special Instructions:</span></p>
                                <p className="text-gray-600 mt-1 italic">"{order.purchaseInfo.message}"</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Products */}
            <div className="mb-4">
                <h4 className="font-semibold text-gray-800 mb-3">Items Ordered</h4>
                <div className="space-y-3">
                    {order.items.map((item, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            <img 
                                src={item.image} 
                                alt={item.name} 
                                className="w-16 h-16 object-cover rounded-md"
                            />
                            <div className="flex-1">
                                <p className="font-medium text-gray-800">{item.name || item.productName}</p>
                                <p className="text-sm text-gray-600">
                                    Quantity: {item.quantity} × {currency}{item.price}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-medium">{currency}{item.price * item.quantity}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Delivery Address */}
            {order.address && (
                <div className="mb-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Delivery Address</h4>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
                        <p>{order.address.firstName} {order.address.lastName}</p>
                        <p>{order.address.street}</p>
                        <p>{order.address.city}, {order.address.state} {order.address.zipcode}</p>
                        <p>{order.address.country}</p>
                        <p>Phone: {order.address.phone}</p>
                        <p>Email: {order.address.email}</p>
                    </div>
                </div>
            )}

            {/* Order Summary */}
            <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800">Total Amount:</span>
                    <span className="font-bold text-lg text-primary">{currency}{order.amount}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">*Includes 2% tax</p>
            </div>
        </div>
    )
}

export default OrderDetails