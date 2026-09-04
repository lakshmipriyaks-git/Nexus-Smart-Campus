import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, GraduationCap, Camera, Save, X } from 'lucide-react';

export default function StudentProfile() {
    const { user, updateProfile } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: user?.username || '',
        name: user?.name || '',
        email: user?.email || '',
        mobile: user?.mobile || '',
        class: user?.class || '',
        profilePicture: user?.profilePicture || null,
    });

    const [previewImage, setPreviewImage] = useState(user?.profilePicture || null);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
                setFormData(prev => ({ ...prev, profilePicture: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.username.trim()) newErrors.username = 'Username is required';
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }
        if (formData.mobile && !/^\d{10}$/.test(formData.mobile.replace(/\D/g, ''))) {
            newErrors.mobile = 'Mobile number must be 10 digits';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (validate()) {
            updateProfile(formData);
            navigate('/student/dashboard');
        }
    };

    const handleCancel = () => {
        navigate('/student/dashboard');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 animate-scaleIn">
            <div className="max-w-3xl mx-auto">
                <div className="glass-card overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
                        <h1 className="text-3xl font-bold">Edit Profile</h1>
                        <p className="text-indigo-100 mt-1">Update your personal information</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8">
                        {/* Profile Picture */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="relative">
                                <div className="h-32 w-32 rounded-full overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center border-4 border-white shadow-lg">
                                    {previewImage ? (
                                        <img src={previewImage} alt="Profile" className="h-full w-full object-cover" />
                                    ) : (
                                        <User className="h-16 w-16 text-indigo-400" />
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 shadow-lg transition-colors">
                                    <Camera className="h-5 w-5" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Click camera icon to upload picture</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Username */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    <User className="inline h-4 w-4 mr-1" />
                                    Username
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className={`input-field ${errors.username ? 'border-red-500' : ''}`}
                                    placeholder="johndoe"
                                />
                                {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                            </div>

                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    <User className="inline h-4 w-4 mr-1" />
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                                    placeholder="John Doe"
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    <Mail className="inline h-4 w-4 mr-1" />
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                                    placeholder="john@example.com"
                                />
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            </div>

                            {/* Mobile */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    <Phone className="inline h-4 w-4 mr-1" />
                                    Mobile Number
                                </label>
                                <input
                                    type="tel"
                                    name="mobile"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                    className={`input-field ${errors.mobile ? 'border-red-500' : ''}`}
                                    placeholder="1234567890"
                                />
                                {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
                            </div>

                            {/* Class */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    <GraduationCap className="inline h-4 w-4 mr-1" />
                                    Class
                                </label>
                                <input
                                    type="text"
                                    name="class"
                                    value={formData.class}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="Grade 10A"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 mt-8">
                            <button
                                type="submit"
                                className="btn-primary flex-1 flex items-center justify-center gap-2"
                            >
                                <Save className="h-5 w-5" />
                                Save Changes
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="btn-secondary flex-1 flex items-center justify-center gap-2"
                            >
                                <X className="h-5 w-5" />
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
