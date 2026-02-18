import React, { createContext, useContext, useState, useCallback } from 'react';
import { HiCheckCircle, HiExclamationCircle, HiInformationCircle, HiX } from 'react-icons/hi';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

let toastId = 0;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = ++toastId;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const toast = {
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error', 5000),
        info: (msg) => addToast(msg, 'info'),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-slide-in
                            ${t.type === 'success' ? 'bg-green-600 text-white' : ''}
                            ${t.type === 'error' ? 'bg-red-600 text-white' : ''}
                            ${t.type === 'info' ? 'bg-blue-600 text-white' : ''}
                        `}
                    >
                        {t.type === 'success' && <HiCheckCircle className="h-5 w-5 flex-shrink-0" />}
                        {t.type === 'error' && <HiExclamationCircle className="h-5 w-5 flex-shrink-0" />}
                        {t.type === 'info' && <HiInformationCircle className="h-5 w-5 flex-shrink-0" />}
                        <span className="flex-1">{t.message}</span>
                        <button onClick={() => removeToast(t.id)} className="ml-2 hover:opacity-80">
                            <HiX className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
