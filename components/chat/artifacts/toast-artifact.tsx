"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { cn } from "@/lib/utils";

export interface ToastMessage {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'loading';
    message: string;
    duration?: number;
}

interface ToastArtifactProps {
    toasts: ToastMessage[];
    onRemove?: (id: string) => void;
}

export const ToastArtifact: React.FC<ToastArtifactProps> = ({ toasts, onRemove }) => {
    return (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col gap-2 items-end pointer-events-none">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        layout
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                        className={cn(
                            "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl min-w-[300px] max-w-sm backdrop-blur-md",
                            toast.type === 'loading' && "bg-zinc-900/80 border-zinc-800 text-zinc-100",
                            toast.type === 'info' && "bg-blue-900/40 border-blue-500/30 text-blue-100",
                            toast.type === 'success' && "bg-emerald-900/40 border-emerald-500/30 text-emerald-100",
                            toast.type === 'warning' && "bg-amber-900/40 border-amber-500/30 text-amber-100",
                            toast.type === 'error' && "bg-red-900/40 border-red-500/30 text-red-100"
                        )}
                    >
                        <div className="shrink-0">
                            {toast.type === 'loading' && <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />}
                            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
                            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                            {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-400" />}
                            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-tight">{toast.message}</p>
                        </div>

                        {onRemove && (
                            <button
                                onClick={() => onRemove(toast.id)}
                                className="shrink-0 p-1 rounded-md hover:bg-white/10 transition-colors"
                            >
                                <X className="w-4 h-4 opacity-50" />
                            </button>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
