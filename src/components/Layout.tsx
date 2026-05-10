import { Outlet, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Link2, LayoutDashboard, LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

export default function Layout() {
    const { logout } = useAuth()
    const location = useLocation()

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ]

    return (
        <div className="min-h-screen bg-animated relative overflow-hidden">
            {/* Navbar */}
            <nav className="relative z-10 glass-subtle border-b border-quest-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between min-h-16 py-3 gap-3">
                        {/* Logo */}
                        <Link to="/dashboard" className="flex items-center gap-2">
                            <div className="quest-icon">
                                <Link2 className="w-5 h-5" />
                            </div>
                            <span className="text-xl font-bold font-display gradient-text">RapidLink</span>
                        </Link>

                        {/* Nav Items */}
                        <div className="flex items-center gap-2">
                            {navItems.map((item) => {
                                const Icon = item.icon
                                const isActive = location.pathname === item.path
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={cn(
                                            'flex items-center gap-2 px-4 py-2 rounded font-display text-sm transition-all duration-300 border',
                                            isActive
                                                ? 'bg-quest-gold text-quest-bg border-quest-goldLight shadow-quest'
                                                : 'text-quest-muted border-transparent hover:text-quest-parchment hover:bg-quest-elevated hover:border-quest-border'
                                        )}
                                    >
                                        <Icon size={18} />
                                        <span className="hidden sm:inline">{item.label}</span>
                                    </Link>
                                )
                            })}

                            <button
                                onClick={logout}
                                className="flex items-center gap-2 px-4 py-2 rounded font-display text-sm text-quest-muted hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 border border-transparent hover:border-red-500/30"
                            >
                                <LogOut size={18} />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <Outlet />
                </motion.div>
            </main>
        </div>
    )
}
