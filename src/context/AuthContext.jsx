import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [theme, setTheme] = useState('light'); // 'light' or 'dark'

    // Check if user is logged in on mount
    useEffect(() => {
        const checkUserLoggedIn = async () => {
            try {
                // Load theme from local storage first to avoid flash
                const savedTheme = localStorage.getItem('theme');
                if (savedTheme) {
                    setTheme(savedTheme);
                    document.documentElement.className = savedTheme;
                }

                // Only attempt /me if we have a stored token
                const token = localStorage.getItem('token');
                if (!token) {
                    setUser(null);
                    setLoading(false);
                    return;
                }

                const { data } = await api.get('/auth/me');
                if (data.success) {
                    setUser(data.data);
                    // If user has a preference, override local storage
                    if (data.data.themePreference) {
                        setTheme(data.data.themePreference);
                        document.documentElement.className = data.data.themePreference;
                        localStorage.setItem('theme', data.data.themePreference);
                    }
                }
            } catch (err) {
                // Not logged in or token expired
                setUser(null);
                localStorage.removeItem('token');
            } finally {
                setLoading(false);
            }
        };

        checkUserLoggedIn();
    }, []);

    // Toggle Theme
    const toggleTheme = async () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.className = newTheme;
        localStorage.setItem('theme', newTheme);

        if (user) {
            try {
                await api.put('/auth/theme', { theme: newTheme });
                // Optimistically update user object
                setUser(prev => ({ ...prev, themePreference: newTheme }));
            } catch (err) {
                console.error('Failed to sync theme preference', err);
            }
        }
    };

    // Register User
    const register = async (userData) => {
        try {
            const { data } = await api.post('/auth/register', userData);
            if (data.success) {
                // Store token for subsequent requests
                localStorage.setItem('token', data.token);
                const meRes = await api.get('/auth/me');
                setUser(meRes.data.data);
                return { success: true };
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
            throw err;
        }
    };

    // Login User
    const login = async (userData) => {
        try {
            const { data } = await api.post('/auth/login', userData);
            if (data.success) {
                // Store token for subsequent requests
                localStorage.setItem('token', data.token);
                const meRes = await api.get('/auth/me');
                setUser(meRes.data.data);
                // Sync theme from user profile
                if (meRes.data.data.themePreference) {
                    setTheme(meRes.data.data.themePreference);
                    document.documentElement.className = meRes.data.data.themePreference;
                    localStorage.setItem('theme', meRes.data.data.themePreference);
                }
                return { success: true };
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
            throw err;
        }
    };

    // Logout User
    const logout = async () => {
        try {
            await api.get('/auth/logout');
        } catch (err) {
            // Ignore logout API errors
        } finally {
            localStorage.removeItem('token');
            setUser(null);
            setTheme('light');
            localStorage.removeItem('theme');
            document.documentElement.className = 'light';
        }
    };

    const value = {
        user,
        setUser,
        loading,
        error,
        theme,
        toggleTheme,
        register,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
