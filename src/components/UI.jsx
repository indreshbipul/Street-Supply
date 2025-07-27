// src/components/UI.jsx
import React, { useEffect } from 'react';

export const Spinner = () => (
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
);

export const Modal = ({ children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
      <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      {children}
    </div>
  </div>
);

export const Notification = ({ message, type, onDismiss }) => {
  const baseClasses = "fixed top-5 right-5 z-50 p-4 rounded-lg shadow-lg text-white transition-opacity duration-300";
  const typeClasses = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={`${baseClasses} ${typeClasses[type] || 'bg-gray-800'}`}>
      {message}
      <button onClick={onDismiss} className="ml-4 font-bold">X</button>
    </div>
  );
};

export const StarRating = ({ rating, setRating, readOnly = false }) => (
    <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
            <svg
                key={star}
                onClick={() => !readOnly && setRating(star)}
                className={`w-6 h-6 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} ${!readOnly && 'cursor-pointer'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
            >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ))}
    </div>
);
