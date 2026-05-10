import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function PasswordPrompt() {
    const [searchParams] = useSearchParams()
    const slug = searchParams.get('slug')

    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!slug) return

        setError('')
        setIsLoading(true)

        try {
            const res = await fetch('/api/verify-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug, password }),
            })

            const data = await res.json()

            if (res.ok) {
                // Redirect to destination URL
                window.location.href = data.destinationUrl
            } else {
                setError(data.error || 'Invalid password')
                setPassword('')
            }
        } catch {
            setError('Something went wrong')
        } finally {
            setIsLoading(false)
        }
    }

    if (!slug) {
        return (
            <div className="min-h-screen bg-animated flex items-center justify-center p-4">
                <GlassCard className="text-center">
                    <p className="text-red-400">Invalid link. No slug provided.</p>
                </GlassCard>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-animated flex items-center justify-center p-4 relative overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                <GlassCard className="space-y-6">
                    {/* Icon */}
                    <div className="text-center space-y-2">
                        <div className="quest-icon inline-flex p-3 mb-2">
                            <Lock className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold text-quest-parchment">Password Required</h1>
                        <p className="text-quest-muted">This link is password protected. Enter the password to continue.</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-quest-muted hover:text-quest-parchment transition-colors"
                                title={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-400 text-sm text-center"
                            >
                                {error}
                            </motion.p>
                        )}

                        <Button type="submit" isLoading={isLoading} className="w-full">
                            Unlock Link
                        </Button>
                    </form>
                </GlassCard>
            </motion.div>
        </div>
    )
}
