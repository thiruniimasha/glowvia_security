import React, { useEffect, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import OrderDetails from '../components/OrderDetails'

const MyOrders = () => {
    const { axios, user, navigate } = useAppContext()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)

    const getUserOrders = async () => {
        try {
            setLoading(true)
            const { data } = await axios.get('/api/order/user')
            if (data.success) {
                setOrders(data.orders)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message || 'Failed to fetch orders')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!user) {
            navigate('/')
            return
        }
        getUserOrders()
    }, [user])

    if (loading) {
        return (
            <div className="mt-16 pb-16">
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="mt-16 pb-16">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-medium text-gray-800">
                    My Orders
                    {orders.length > 0 && (
                        <span className="text-sm text-primary ml-2">({orders.length} orders)</span>
                    )}
                </h1>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-20">
                    <div className="mb-6">
                        <svg className="mx-auto h-24 w-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No orders yet</h3>
                    <p className="text-gray-600 mb-6">You haven't placed any orders yet.</p>
                    <button 
                        onClick={() => navigate('/products')}
                        className="bg-primary text-white px-6 py-3 rounded-md hover:bg-primary-dull transition"
                    >
                        Start Shopping
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {orders.map((order) => (
                        <OrderDetails key={order._id} order={order} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default MyOrders