/**
 * TOAST NOTIFICATION COMPONENT
 * 
 * Hiển thị thông báo tạm thời (tự động ẩn sau vài giây)
 * 
 * Props:
 * - type: 'success' | 'error' | 'info' | 'warning'
 * - message: string
 * - duration?: number (ms) - Mặc định 5000ms
 * - onClose?: () => void
 */

'use client';

import { useEffect } from 'react';

export interface ToastProps {
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    duration?: number;
    onClose?: () => void;
}

export default function Toast({ 
    type, 
    message, 
    duration = 5000, 
    onClose 
}: ToastProps) {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose?.();
            }, duration);
            
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);
    
    const getToastStyle = () => {
        switch (type) {
            case 'success':
                return {
                    bg: 'bg-green-50',
                    border: 'border-green-500',
                    text: 'text-green-900',
                    icon: '✅'
                };
            case 'error':
                return {
                    bg: 'bg-red-50',
                    border: 'border-red-500',
                    text: 'text-red-900',
                    icon: '❌'
                };
            case 'warning':
                return {
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-500',
                    text: 'text-yellow-900',
                    icon: '⚠️'
                };
            case 'info':
            default:
                return {
                    bg: 'bg-blue-50',
                    border: 'border-blue-500',
                    text: 'text-blue-900',
                    icon: 'ℹ️'
                };
        }
    };
    
    const style = getToastStyle();
    
    return (
        <div className={`${style.bg} border-l-4 ${style.border} rounded-lg shadow-lg p-4 flex items-start gap-3 min-w-[300px] max-w-md animate-slide-in`}>
            <span className="text-2xl">{style.icon}</span>
            <div className="flex-1">
                <p className={`font-semibold ${style.text}`}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                </p>
                <p className={`text-sm ${style.text} mt-1`}>
                    {message}
                </p>
            </div>
            {onClose && (
                <button
                    onClick={onClose}
                    className={`${style.text} hover:opacity-70 text-xl font-bold`}
                >
                    ×
                </button>
            )}
            
            <style jsx>{`
                @keyframes slide-in {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}

/**
 * TOAST CONTAINER
 * 
 * Container để hiển thị nhiều toasts cùng lúc
 */

interface ToastContainerProps {
    toasts: Array<ToastProps & { id: string }>;
    onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
            {toasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto">
                    <Toast
                        {...toast}
                        onClose={() => onClose(toast.id)}
                    />
                </div>
            ))}
        </div>
    );
}

/**
 * HOOK: useToast
 * 
 * Custom hook để quản lý toasts dễ dàng
 */

import { useState, useCallback } from 'react';

export function useToast() {
    const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([]);
    
    const showToast = useCallback((props: Omit<ToastProps, 'onClose'>) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        setToasts(prev => [...prev, { ...props, id }]);
    }, []);
    
    const hideToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);
    
    const success = useCallback((message: string, duration?: number) => {
        showToast({ type: 'success', message, duration });
    }, [showToast]);
    
    const error = useCallback((message: string, duration?: number) => {
        showToast({ type: 'error', message, duration });
    }, [showToast]);
    
    const warning = useCallback((message: string, duration?: number) => {
        showToast({ type: 'warning', message, duration });
    }, [showToast]);
    
    const info = useCallback((message: string, duration?: number) => {
        showToast({ type: 'info', message, duration });
    }, [showToast]);
    
    return {
        toasts,
        showToast,
        hideToast,
        success,
        error,
        warning,
        info
    };
}

