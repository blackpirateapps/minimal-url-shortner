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
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-ocean-500/20 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-ocean-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                <GlassCard className="space-y-6">
                    {/* Logo */}
                    <div className="text-center space-y-2">
                        <div className="inline-flex p-3 rounded-xl bg-gradient-to-r from-ocean-500 to-ocean-600 mb-2">
                            <Link2 className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
                        <p className="text-white/60">Enter your password to access the dashboard</p>
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
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
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
                                className="w-4 h-4 rounded border-white/20 bg-white/10 text-cyan-500 focus:ring-cyan-500/20"
                            />
                            <label htmlFor="rememberMe" className="text-sm text-white/70">
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
