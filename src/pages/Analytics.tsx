import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, BarChart3, Globe, Link2 } from 'lucide-react'
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
                    className="p-2 rounded hover:bg-quest-elevated text-quest-muted hover:text-quest-parchment transition-colors"
                    title="Back to dashboard"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-quest-parchment">Link Analytics</h1>
                    <p className="text-quest-muted">
                        Stats for: <code className="text-quest-gold font-mono">{slug}</code>
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <GlassCard className="flex items-center gap-4">
                    <div className="quest-icon">
                        <BarChart3 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-quest-muted">Total Clicks</p>
                        <p className="text-2xl font-bold text-quest-parchment">{clicks.length}</p>
                    </div>
                </GlassCard>

                <GlassCard className="flex items-center gap-4">
                    <div className="quest-icon quest-icon-purple">
                        <Globe className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-quest-muted">Unique IPs</p>
                        <p className="text-2xl font-bold text-quest-parchment">
                            {new Set(clicks.map((c) => c.ip_address).filter(Boolean)).size}
                        </p>
                    </div>
                </GlassCard>

                <GlassCard className="flex items-center gap-4">
                    <div className="quest-icon bg-green-500/10 border-green-400/30 text-green-400">
                        <Link2 className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                        <p className="text-sm text-quest-muted">Referrers</p>
                        <p className="text-2xl font-bold text-quest-parchment">
                            {new Set(clicks.map((c) => c.referrer).filter(Boolean)).size}
                        </p>
                    </div>
                </GlassCard>
            </div>

            {/* Clicks Table */}
            <GlassCard>
                <h2 className="text-xl font-semibold text-quest-parchment mb-4">Click Details</h2>

                {isLoading ? (
                    <div className="text-center py-8 text-quest-muted">Loading...</div>
                ) : error ? (
                    <div className="text-center py-8 text-red-400">{error}</div>
                ) : clicks.length === 0 ? (
                    <div className="text-center py-8 text-quest-muted">
                        No clicks recorded yet
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-quest-border">
                                    <th className="text-left py-3 px-2 text-xs font-display font-medium text-quest-muted uppercase">
                                        Timestamp
                                    </th>
                                    <th className="text-left py-3 px-2 text-xs font-display font-medium text-quest-muted uppercase">
                                        IP Address
                                    </th>
                                    <th className="text-left py-3 px-2 text-xs font-display font-medium text-quest-muted uppercase">
                                        User Agent
                                    </th>
                                    <th className="text-left py-3 px-2 text-xs font-display font-medium text-quest-muted uppercase">
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
                                        className="border-b border-quest-border/40 hover:bg-quest-elevated/60 transition-colors"
                                    >
                                        <td className="py-3 px-2 text-sm text-quest-muted">
                                            {new Date(click.clicked_at).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-2 text-sm text-quest-muted font-mono">
                                            {click.ip_address || 'N/A'}
                                        </td>
                                        <td className="py-3 px-2 text-sm text-quest-muted max-w-[200px] truncate" title={click.user_agent || ''}>
                                            {click.user_agent || 'N/A'}
                                        </td>
                                        <td className="py-3 px-2 text-sm text-quest-gold max-w-[150px] truncate" title={click.referrer || ''}>
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
