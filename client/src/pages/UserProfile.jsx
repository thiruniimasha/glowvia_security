import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';
import { useAuth0 } from '@auth0/auth0-react';

const UserProfile = () => {
    const { axios, navigate } = useAppContext();
    const { user, isAuthenticated, isLoading, getAccessTokenSilently} = useAuth0();
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        contactNumber: '',
        country: ''
    });
    const [originalData, setOriginalData] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchUserProfile();
    }, [user, navigate]);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const token = await getAccessTokenSilently();
            const { data } = await axios.get('/api/user/profile',{
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (data.success) {
                const userData = {
                    name: data.user.name || '',
                    email: data.user.email || '',
                    contactNumber: data.user.contactNumber || '',
                    country: data.user.country || ''
                };
                setProfileData(userData);
                setOriginalData(userData);
            } else {
                toast.error(data.message || 'Failed to fetch profile');
            }
        } catch (error) {
            toast.error('Failed to fetch profile information');
            console.error('Profile fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setProfileData(originalData); // Reset to original data
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        if (!profileData.name.trim()) {
            toast.error('Name is required');
            return;
        }

        try {
            setUpdating(true);
            // Get the token here as well
            const token = await getAccessTokenSilently();
            const { data } = await axios.put('/api/user/profile', {
                name: profileData.name.trim(),
                contactNumber: profileData.contactNumber.trim(),
                country: profileData.country.trim()
            },{
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (data.success) {
                toast.success('Profile updated successfully');
                setIsEditing(false);
                setOriginalData(profileData); // Update original data
                // Update user in context if needed
                if (data.user) {
                    // You might want to update the user context here
                }
            } else {
                toast.error(data.message || 'Failed to update profile');
            }
        } catch (error) {
            toast.error('Failed to update profile');
            console.error('Profile update error:', error);
        } finally {
            setUpdating(false);
        }
    };

    if (!user) {
        return null; // Will redirect in useEffect
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="bg-white rounded-lg shadow-md p-8">
                        <div className="animate-pulse">
                            <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                                    <div className="h-10 bg-gray-300 rounded"></div>
                                </div>
                                <div className="space-y-4">
                                    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                                    <div className="h-10 bg-gray-300 rounded"></div>
                                </div>
                                <div className="space-y-4">
                                    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                                    <div className="h-10 bg-gray-300 rounded"></div>
                                </div>
                                <div className="space-y-4">
                                    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                                    <div className="h-10 bg-gray-300 rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                    <p className="text-gray-600 mt-2">Manage your personal information and account settings</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Summary Card */}
                    <div className="lg:col-span-1">
                        <div className="h-80 bg-white rounded-lg shadow-md p-6">
                            <div className="text-center">
                                <div className="w-24 h-24 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-3xl font-bold">
                                        {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
                                    </span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                                    {profileData.name || 'Unknown User'}
                                </h3>
                                <p className="text-gray-600 mb-4">{profileData.email}</p>
                                
                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex items-center justify-center">
                                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                        Account Active
                                    </div>
                                    <p>Member since {new Date().toLocaleDateString()}</p>
                                </div>
                            </div>

                            
                        </div>

                        {/* Navigation Links */}
                        <div className="bg-white rounded-lg shadow-md p-4 mt-6">
                            <h4 className="font-semibold text-gray-900 mb-4">Account Links</h4>
                            <div className="space-y-2">
                                <button
                                    onClick={() => navigate('/my-orders')}
                                    className="w-full text-left p-2 text-gray-700 hover:bg-gray-50 rounded-md cursor-pointer hover:underline transition "
                                >
                                    My Orders
                                </button>
                                <button
                                    onClick={() => navigate('/cart')}
                                    className="w-full text-left p-2 text-gray-700 hover:bg-gray-50 rounded-md cursor-pointer hover:underline transition"
                                >
                                    Shopping Cart
                                </button>
                                <button
                                    onClick={() => navigate('/add-address')}
                                    className="w-full text-left p-2 text-gray-700 hover:bg-gray-50 rounded-md cursor-pointer hover:underline transition"
                                >
                                    Manage Addresses
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Profile Details */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-md">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                                {!isEditing && (
                                    <button
                                        onClick={handleEdit}
                                        className="bg-primary hover:bg-primary-dull text-white px-4 py-2 rounded-md transition-all text-sm"
                                    >
                                        Edit Profile
                                    </button>
                                )}
                            </div>

                            {/* Form */}
                            <div className="p-6">
                                <form onSubmit={handleSave} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Name Field */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={profileData.name}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                                className={`w-full px-3 py-2 border rounded-md transition-all ${
                                                    isEditing 
                                                        ? 'border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent' 
                                                        : 'border-gray-200 bg-gray-50 text-gray-600'
                                                }`}
                                                placeholder="Enter your full name"
                                                required
                                            />
                                        </div>

                                        {/* Email Field */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={profileData.email}
                                                disabled={true}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Email address cannot be changed for security reasons
                                            </p>
                                        </div>

                                        {/* Contact Number Field */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Contact Number
                                            </label>
                                            <input
                                                type="tel"
                                                name="contactNumber"
                                                value={profileData.contactNumber}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                                className={`w-full px-3 py-2 border rounded-md transition-all ${
                                                    isEditing 
                                                        ? 'border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent' 
                                                        : 'border-gray-200 bg-gray-50 text-gray-600'
                                                }`}
                                                placeholder="Enter your contact number"
                                            />
                                        </div>

                                        {/* Country Field */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Country
                                            </label>
                                            <input
                                                type="text"
                                                name="country"
                                                value={profileData.country}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                                className={`w-full px-3 py-2 border rounded-md transition-all ${
                                                    isEditing 
                                                        ? 'border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent' 
                                                        : 'border-gray-200 bg-gray-50 text-gray-600'
                                                }`}
                                                placeholder="Enter your country"
                                            />
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    {isEditing && (
                                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                                            <button
                                                type="submit"
                                                disabled={updating}
                                                className={`px-6 py-2 rounded-md text-white font-medium transition-all ${
                                                    updating
                                                        ? 'bg-gray-400 cursor-not-allowed'
                                                        : 'bg-green-600 hover:bg-green-700'
                                                }`}
                                            >
                                                {updating ? 'Saving...' : 'Save Changes'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCancel}
                                                disabled={updating}
                                                className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md font-medium transition-all disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div className="bg-white rounded-lg shadow-md mt-6 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Security</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <h4 className="font-medium text-gray-900">Password</h4>
                                        <p className="text-sm text-gray-600">Last updated: Recently</p>
                                    </div>
                                    <button className="text-primary hover:text-primary-dull font-medium text-sm">
                                        Change Password
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                                        <p className="text-sm text-gray-600">Not enabled</p>
                                    </div>
                                    <button className="text-primary hover:text-primary-dull font-medium text-sm">
                                        Enable 2FA
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;