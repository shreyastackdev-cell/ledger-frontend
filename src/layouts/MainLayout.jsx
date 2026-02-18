import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import ThemeToggle from '../components/ThemeToggle';
import api from '../services/api';
import {
    HiHome,
    HiCurrencyDollar,
    HiUsers,
    HiLogout,
    HiMenu,
    HiX,
    HiChevronLeft,
    HiChevronRight,
    HiUserCircle,
    HiCog,
    HiPencil,
    HiKey
} from 'react-icons/hi';

const MainLayout = ({ children }) => {
    const { user, setUser, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useToast();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

    // Edit Profile State
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [editError, setEditError] = useState('');
    const [editSuccess, setEditSuccess] = useState('');

    // Change Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const profileMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setIsProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const navigation = [
        { name: 'Dashboard', href: '/', icon: HiHome },
        { name: 'Transactions', href: '/transactions', icon: HiCurrencyDollar },
        { name: 'Contacts', href: '/contacts', icon: HiUsers },
    ];

    const isActive = (path) => location.pathname === path;

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setEditError('');
        setEditSuccess('');
        try {
            const { data } = await api.put('/auth/updatedetails', { name, email });
            if (data.success) {
                setUser(data.data);
                toast.success('Profile updated!');
                setTimeout(() => setIsEditProfileOpen(false), 500);
            }
        } catch (err) {
            setEditError(err.response?.data?.error || 'Failed to update profile');
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordError('');
        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError('New password must be at least 6 characters');
            return;
        }
        try {
            const { data } = await api.put('/auth/updatepassword', { currentPassword, newPassword });
            if (data.success) {
                // Update token since password change issues a new one
                localStorage.setItem('token', data.token);
                toast.success('Password changed successfully!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setTimeout(() => setIsChangePasswordOpen(false), 500);
            }
        } catch (err) {
            setPasswordError(err.response?.data?.error || 'Failed to change password');
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200 overflow-hidden">

            {/* Sidebar (Desktop only - hidden on mobile, replaced by bottom nav) */}
            <aside className={`
                hidden md:flex fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-800 shadow-lg transform transition-all duration-300 ease-in-out
                ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}
                flex-col
            `}>
                {/* Brand */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
                    {!isSidebarCollapsed && (
                        <Link to="/" className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 truncate">
                            Ledger<span className="text-gray-900 dark:text-white">Book</span>
                        </Link>
                    )}
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                    >
                        {isSidebarCollapsed ? <HiChevronRight size={20} /> : <HiChevronLeft size={20} />}
                    </button>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={`flex items-center px-4 py-3 text-sm font-medium transition-colors duration-150
                                ${isActive(item.href)
                                    ? 'bg-indigo-50 text-indigo-700 dark:bg-gray-700 dark:text-white border-r-4 border-indigo-600'
                                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                                }
                                ${isSidebarCollapsed ? 'justify-center' : ''}
                            `}
                            title={isSidebarCollapsed ? item.name : ''}
                        >
                            <item.icon className={`h-6 w-6 ${!isSidebarCollapsed ? 'mr-3' : 'mx-auto'}`} />
                            {!isSidebarCollapsed && <span>{item.name}</span>}
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Content Area */}
            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>

                {/* Top Header */}
                <header className="bg-white dark:bg-gray-800 shadow-sm z-40 h-16 px-4 flex items-center justify-between sticky top-0">
                    {/* Left: Logo on mobile */}
                    <div className="flex items-center">
                        <h2 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400 md:hidden">
                            Ledger<span className="text-gray-800 dark:text-white">Book</span>
                        </h2>
                    </div>

                    {/* Right: Profile & Actions */}
                    <div className="flex items-center space-x-4 ml-auto">
                        <ThemeToggle />

                        <div className="relative" ref={profileMenuRef}>
                            <button
                                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                className="flex items-center space-x-2 focus:outline-none"
                            >
                                <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border-2 border-transparent hover:border-indigo-200 transition-colors">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-200">
                                    {user?.name}
                                </span>
                            </button>

                            {/* Dropdown Menu */}
                            {isProfileMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 ring-1 ring-black ring-opacity-5">
                                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                                        <p className="text-sm text-gray-900 dark:text-white font-medium truncate">{user?.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                                    </div>
                                    <button
                                        onClick={() => { setIsEditProfileOpen(true); setIsProfileMenuOpen(false); }}
                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        <HiPencil className="mr-3 h-4 w-4 text-gray-400" />
                                        Edit Profile
                                    </button>
                                    <button
                                        onClick={() => { setIsChangePasswordOpen(true); setIsProfileMenuOpen(false); }}
                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        <HiKey className="mr-3 h-4 w-4 text-gray-400" />
                                        Change Password
                                    </button>
                                    <button
                                        onClick={async () => { await logout(); navigate('/login'); }}
                                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        <HiLogout className="mr-3 h-4 w-4" />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Main Scrollable Content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative pb-20 md:pb-8">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
                <div className="flex justify-around">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={`flex flex-col items-center py-2 px-3 text-xs font-medium transition-colors
                                ${isActive(item.href)
                                    ? 'text-indigo-600 dark:text-indigo-400'
                                    : 'text-gray-500 dark:text-gray-400'
                                }
                            `}
                        >
                            <item.icon className="h-6 w-6 mb-0.5" />
                            <span>{item.name}</span>
                        </Link>
                    ))}
                </div>
            </nav>

            {/* Edit Profile Modal */}
            {isEditProfileOpen && (
                <div className="fixed inset-0 z-[60] overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 text-center">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <div className="inline-block bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:max-w-lg w-full relative z-10">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Edit Profile</h3>
                                {editError && <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">{editError}</div>}
                                {editSuccess && <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-sm">{editSuccess}</div>}
                                <form onSubmit={handleUpdateProfile}>
                                    <div className="mb-4">
                                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Email</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    </div>
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditProfileOpen(false)}
                                            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {isChangePasswordOpen && (
                <div className="fixed inset-0 z-[60] overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 text-center">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <div className="inline-block bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:max-w-lg w-full relative z-10">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Change Password</h3>
                                {passwordError && <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">{passwordError}</div>}
                                <form onSubmit={handleChangePassword}>
                                    <div className="mb-4">
                                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Current Password</label>
                                        <input
                                            type="password"
                                            required
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">New Password</label>
                                        <input
                                            type="password"
                                            required
                                            minLength={6}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Confirm New Password</label>
                                        <input
                                            type="password"
                                            required
                                            minLength={6}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    </div>
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => { setIsChangePasswordOpen(false); setPasswordError(''); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}
                                            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
                                        >
                                            Change Password
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MainLayout;
