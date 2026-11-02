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
        usn: user?.usn || (typeof localStorage !== 'undefined' ? localStorage.getItem('nexus_student_usn') : '') || '1KS21CS001',
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
            const cleanUsn = (formData.usn || '').trim().toUpperCase();
            if (cleanUsn && typeof localStorage !== 'undefined') {
                localStorage.setItem('nexus_student_usn', cleanUsn);
            }
            updateProfile({ ...formData, usn: cleanUsn });
            navigate('/student/dashboard');
        }
    };

    const handleCancel = () => {
        navigate('/student/dashboard');
    };

    return (
        <div className="min-h-screen bg-[#F5F6FF] dark:bg-[#070A11] text-[#202442] dark:text-slate-100 p-4 sm:p-6 lg:p-8 animate-scaleIn transition-colors duration-200">
            <div className="max-w-3xl mx-auto">
                <div className="rounded-2xl bg-white dark:bg-[#0D1527] border border-[#E2E6F2] dark:border-[#1E2D4A] shadow-md dark:shadow-2xl overflow-hidden transition-colors">
                    {/* Header with High-Contrast Text */}
                    <div className="bg-[#F8F9FE] dark:bg-[#0A0F1D] border-b border-[#E2E6F2] dark:border-[#1E2D4A] p-6 sm:p-8">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202442] dark:text-white font-display tracking-tight">Edit Profile</h1>
                        <p className="text-sm font-medium text-[#59627E] dark:text-slate-400 mt-1">Update your personal information and student credentials</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                        {/* Profile Picture */}
                        <div className="flex flex-col items-center mb-6">
                            <div className="relative">
                                <div className="h-32 w-32 rounded-full overflow-hidden bg-[#EEF1FC] dark:bg-[#0A0F1D] flex items-center justify-center border-4 border-[#E2E6F2] dark:border-[#1E2D4A] shadow-md">
                                    {previewImage ? (
                                        <img src={previewImage} alt="Profile" className="h-full w-full object-cover" />
                                    ) : (
                                        <User className="h-16 w-16 text-[#6558E8] dark:text-[#22D3EE]" />
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 bg-[#6558E8] dark:bg-[#06B6D4] text-white dark:text-[#070A11] p-2.5 rounded-full cursor-pointer hover:bg-[#5244d4] dark:hover:bg-[#22D3EE] shadow-md transition-all">
                                    <Camera className="h-4 w-4" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            <p className="text-xs font-medium text-[#59627E] dark:text-slate-400 mt-2.5">Click camera icon to upload picture</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Username */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-[#202442] dark:text-slate-200 mb-2">
                                    <User className="inline h-3.5 w-3.5 mr-1 text-[#6558E8] dark:text-[#06B6D4]" />
                                    Username
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className={`w-full px-3.5 py-2.5 rounded-xl border ${errors.username ? 'border-red-500' : 'border-[#E2E6F2] dark:border-[#1E2D4A]'} bg-[#F8F9FE] dark:bg-[#070A11] text-[#202442] dark:text-white placeholder-[#7E87A2] dark:placeholder-slate-500 focus:outline-none focus:border-[#6558E8] dark:focus:border-[#06B6D4] text-sm transition-colors`}
                                    placeholder="johndoe"
                                />
                                {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                            </div>

                            {/* Full Name */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-[#202442] dark:text-slate-200 mb-2">
                                    <User className="inline h-3.5 w-3.5 mr-1 text-[#6558E8] dark:text-[#06B6D4]" />
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`w-full px-3.5 py-2.5 rounded-xl border ${errors.name ? 'border-red-500' : 'border-[#E2E6F2] dark:border-[#1E2D4A]'} bg-[#F8F9FE] dark:bg-[#070A11] text-[#202442] dark:text-white placeholder-[#7E87A2] dark:placeholder-slate-500 focus:outline-none focus:border-[#6558E8] dark:focus:border-[#06B6D4] text-sm transition-colors`}
                                    placeholder="John Doe"
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-[#202442] dark:text-slate-200 mb-2">
                                    <Mail className="inline h-3.5 w-3.5 mr-1 text-[#6558E8] dark:text-[#06B6D4]" />
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full px-3.5 py-2.5 rounded-xl border ${errors.email ? 'border-red-500' : 'border-[#E2E6F2] dark:border-[#1E2D4A]'} bg-[#F8F9FE] dark:bg-[#070A11] text-[#202442] dark:text-white placeholder-[#7E87A2] dark:placeholder-slate-500 focus:outline-none focus:border-[#6558E8] dark:focus:border-[#06B6D4] text-sm transition-colors`}
                                    placeholder="john@example.com"
                                />
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            </div>

                            {/* Mobile */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-[#202442] dark:text-slate-200 mb-2">
                                    <Phone className="inline h-3.5 w-3.5 mr-1 text-[#6558E8] dark:text-[#06B6D4]" />
                                    Mobile Number
                                </label>
                                <input
                                    type="tel"
                                    name="mobile"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                    className={`w-full px-3.5 py-2.5 rounded-xl border ${errors.mobile ? 'border-red-500' : 'border-[#E2E6F2] dark:border-[#1E2D4A]'} bg-[#F8F9FE] dark:bg-[#070A11] text-[#202442] dark:text-white placeholder-[#7E87A2] dark:placeholder-slate-500 focus:outline-none focus:border-[#6558E8] dark:focus:border-[#06B6D4] text-sm transition-colors`}
                                    placeholder="1234567890"
                                />
                                {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
                            </div>

                            {/* Student USN */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-[#202442] dark:text-slate-200 mb-2">
                                    <GraduationCap className="inline h-3.5 w-3.5 mr-1 text-[#6558E8] dark:text-[#06B6D4]" />
                                    University Seat Number (USN)
                                </label>
                                <input
                                    type="text"
                                    name="usn"
                                    value={formData.usn}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#1E2D4A] bg-[#F8F9FE] dark:bg-[#070A11] text-[#202442] dark:text-white font-mono font-bold tracking-wider placeholder-[#7E87A2] dark:placeholder-slate-500 focus:outline-none focus:border-[#6558E8] dark:focus:border-[#06B6D4] text-sm transition-colors"
                                    placeholder="1KS21CS001"
                                />
                                <p className="text-[11px] text-[#59627E] dark:text-slate-400 mt-1">
                                    Shown to staff and HOD across classes and grade sheets
                                </p>
                            </div>

                            {/* Class */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-[#202442] dark:text-slate-200 mb-2">
                                    <GraduationCap className="inline h-3.5 w-3.5 mr-1 text-[#6558E8] dark:text-[#06B6D4]" />
                                    Class / Section
                                </label>
                                <input
                                    type="text"
                                    name="class"
                                    value={formData.class}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#1E2D4A] bg-[#F8F9FE] dark:bg-[#070A11] text-[#202442] dark:text-white placeholder-[#7E87A2] dark:placeholder-slate-500 focus:outline-none focus:border-[#6558E8] dark:focus:border-[#06B6D4] text-sm transition-colors"
                                    placeholder="CSE-A"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-4 border-t border-[#E2E6F2] dark:border-[#1E2D4A]">
                            <button
                                type="submit"
                                className="px-6 py-3 rounded-xl bg-[#6558E8] dark:bg-[#06B6D4] hover:bg-[#5244d4] dark:hover:bg-[#22D3EE] text-white dark:text-[#070A11] text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 flex-1"
                            >
                                <Save className="h-4 w-4" />
                                <span>Save Changes</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-6 py-3 rounded-xl bg-white dark:bg-[#0A0F1D] hover:bg-[#EEF1FC] dark:hover:bg-[#111A2E] text-[#59627E] dark:text-slate-300 border border-[#E2E6F2] dark:border-[#1E2D4A] text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 flex-1"
                            >
                                <X className="h-4 w-4" />
                                <span>Cancel</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
