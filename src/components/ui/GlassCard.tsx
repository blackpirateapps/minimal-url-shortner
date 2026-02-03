import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlassCardProps {
    children: React.ReactNode
    className?: string
    animate?: boolean
}

export default function GlassCard({ children, className, animate = false }: GlassCardProps) {
    const Component = animate ? motion.div : 'div'

    return (
        <Component
            className={cn(
                'glass rounded-2xl p-6',
                className
            )}
            {...(animate && {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.3 }
            })}
        >
            {children}
        </Component>
    )
}
