import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, id, ...props }, ref) => {
        return (
            <div className="space-y-1.5">
                {label && (
                    <label htmlFor={id} className="block font-display text-sm font-medium text-quest-parchment">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={id}
                    className={cn(
                        'w-full px-3 py-2 rounded glass-input text-quest-parchment placeholder:text-quest-muted/70',
                        'outline-none',
                        error && 'border-red-500 focus:border-red-500 focus:ring-red-500/25',
                        className
                    )}
                    {...props}
                />
                {error && (
                    <p className="text-xs text-red-400">{error}</p>
                )}
            </div>
        )
    }
)

Input.displayName = 'Input'

export default Input
