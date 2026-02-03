import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, BarChart3, Globe, Monitor, Link2 } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

interface Click {
    id: number
    link_slug: string
    ip_address: string | null
    user_agent: string | null
    referrer: string | null
    clicked_at: string
}

export default function Analytics() {
    const { slug } = useParams<{ slug: string }>()
    const [clicks, setClicks] = useState<Click[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchData = async () => {
            if (!slug) return

            try {
                const res = await fetch(`/api/link-details?slug=${slug}`)
                if (res.ok) {
                    const data = await res.json()
                    setClicks(data)
                } else {
                    setError('Failed to load analytics')
                }
            } catch {
                setError('Something went wrong')
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [slug])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    to="/dashboard"
                    className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Link Analytics</h1>
                    <p className="text-white/60">
                        Stats for: <code className="text-cyan-400 font-mono">{slug}</code>
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <GlassCard className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20">
                        <BarChart3 className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                        <p className="text-sm text-white/60">Total Clicks</p>
                        <p className="text-2xl font-bold text-white">{clicks.length}</p>
                    </div>
                </GlassCard>

                <GlassCard className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                        <Globe className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <p className="text-sm text-white/60">Unique IPs</p>
                        <p className="text-2xl font-bold text-white">
                            {new Set(clicks.map((c) => c.ip_address).filter(Boolean)).size}
                        </p>
                    </div>
                </GlassCard>

                <GlassCard className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20">
                        <Link2 className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                        <p className="text-sm text-white/60">Referrers</p>
                        <p className="text-2xl font-bold text-white">
                            {new Set(clicks.map((c) => c.referrer).filter(Boolean)).size}
                        </p>
                    </div>
                </GlassCard>
            </div>

            {/* Clicks Table */}
            <GlassCard>
                <h2 className="text-xl font-semibold text-white mb-4">Click Details</h2>

                {isLoading ? (
                    <div className="text-center py-8 text-white/60">Loading...</div>
                ) : error ? (
                    <div className="text-center py-8 text-red-400">{error}</div>
                ) : clicks.length === 0 ? (
                    <div className="text-center py-8 text-white/60">
                        No clicks recorded yet
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-2 text-xs font-medium text-white/50 uppercase">
                                        Timestamp
                                    </th>
                                    <th className="text-left py-3 px-2 text-xs font-medium text-white/50 uppercase">
                                        IP Address
                                    </th>
                                    <th className="text-left py-3 px-2 text-xs font-medium text-white/50 uppercase">
                                        User Agent
                                    </th>
                                    <th className="text-left py-3 px-2 text-xs font-medium text-white/50 uppercase">
                                        Referrer
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {clicks.map((click, i) => (
                                    <motion.tr
                                        key={click.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.02 }}
                                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                    >
                                        <td className="py-3 px-2 text-sm text-white/70">
                                            {new Date(click.clicked_at).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-2 text-sm text-white/70 font-mono">
                                            {click.ip_address || 'N/A'}
                                        </td>
                                        <td className="py-3 px-2 text-sm text-white/70 max-w-[200px] truncate" title={click.user_agent || ''}>
                                            {click.user_agent || 'N/A'}
                                        </td>
                                        <td className="py-3 px-2 text-sm text-cyan-400 max-w-[150px] truncate" title={click.referrer || ''}>
                                            {click.referrer || 'Direct'}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </GlassCard>
        </div>
    )
}
