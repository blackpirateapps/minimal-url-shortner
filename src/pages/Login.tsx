import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Link2, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function Login() {
    const [password, setPassword] = useState('')
    const [rememberMe, setRememberMe] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        const success = await login(password, rememberMe)

        if (success) {
            navigate('/dashboard')
        } else {
            setError('Invalid password. Please try again.')
        }

        setIsLoading(false)
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
                    {/* Logo */}
                    <div className="text-center space-y-2">
                        <div className="quest-icon inline-flex p-3 mb-2">
                            <Link2 className="w-8 h-8" />
                        </div>
                        <p className="quest-chip mx-auto">RapidLink</p>
                        <h1 className="text-2xl font-bold text-quest-parchment">Welcome Back</h1>
                        <p className="text-quest-muted">Enter your password to access the dashboard.</p>
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

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="rememberMe"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-5 h-5 rounded-sm border-2 border-quest-border bg-quest-surface text-quest-gold focus:ring-quest-gold/25"
                            />
                            <label htmlFor="rememberMe" className="text-sm text-quest-muted">
                                Remember me for 30 days
                            </label>
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
                            Sign In
                        </Button>
                    </form>
                </GlassCard>
            </motion.div>
        </div>
    )
}
