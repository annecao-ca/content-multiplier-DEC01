import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastProps {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`
            fixed bottom-6 right-6 p-4 rounded-xl shadow-2xl border flex items-start gap-3 max-w-sm animate-in slide-in-from-bottom-5 z-50
            ${type === 'success' ? 'bg-white border-green-100' : 'bg-white border-red-100'}
        `}>
            <div className={`mt-0.5 ${type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                {type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
            </div>
            <div className="flex-1">
                <h4 className={`font-bold text-sm ${type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                    {type === 'success' ? 'Success' : 'Error'}
                </h4>
                <p className="text-sm text-gray-600 mt-0.5">{message}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
            </button>
        </div>
    );
}
