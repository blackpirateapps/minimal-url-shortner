import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string
    options: { value: string; label: string }[]
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, options, id, ...props }, ref) => {
        return (
            <div className="space-y-1.5">
                {label && (
                    <label htmlFor={id} className="block font-display text-sm font-medium text-quest-parchment">
                        {label}
                    </label>
                )}
                <select
                    ref={ref}
                    id={id}
                    className={cn(
                        'w-full px-3 py-2 rounded glass-input text-quest-parchment',
                        'outline-none appearance-none cursor-pointer',
                        'bg-[url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%23CA8A04%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e")]',
                        'bg-[length:1.5em_1.5em] bg-[right_0.5rem_center] bg-no-repeat',
                        className
                    )}
                    {...props}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value} className="bg-dark-800 text-quest-parchment">
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
        )
    }
)

Select.displayName = 'Select'

export default Select
