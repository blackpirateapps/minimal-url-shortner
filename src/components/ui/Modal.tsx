import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    children: React.ReactNode
    className?: string
}

export default function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div
                            className={cn(
                                'glass p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-quest-lg',
                                className
                            )}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {title && (
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold text-quest-parchment">{title}</h2>
                                    <button
                                        onClick={onClose}
                                        className="p-1 rounded hover:bg-quest-elevated text-quest-muted hover:text-quest-parchment transition-colors"
                                        title="Close"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            )}
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
