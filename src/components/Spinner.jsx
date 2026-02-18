import React from 'react';

const Spinner = ({ size = 'md', className = '' }) => {
    const sizeClasses = {
        sm: 'h-5 w-5',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
    };

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div
                className={`${sizeClasses[size] || sizeClasses.md} animate-spin rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-indigo-600 dark:border-t-indigo-400`}
            />
        </div>
    );
};

export default Spinner;
