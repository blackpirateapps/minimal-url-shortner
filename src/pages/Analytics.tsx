import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, BarChart3, Globe, Link2, Monitor, MapPin } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import GlassCard from '@/components/ui/GlassCard'

interface AnalyticsData {
    stats?: {
        pageviews: { value: number; change: number };
        visitors: { value: number; change: number };
        visits: { value: number; change: number };
        bounces: { value: number; change: number };
        totaltime: { value: number; change: number };
    };
    referrers?: { x: string; y: number }[];
    browsers?: { x: string; y: number }[];
    os?: { x: string; y: number }[];
    countries?: { x: string; y: number }[];
    pageviews?: {
        pageviews: { x: string; y: number }[];
        sessions: { x: string; y: number }[];
    };
}



export default function Analytics() {
    const { slug } = useParams<{ slug: string }>()
    const [data, setData] = useState<AnalyticsData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchData = async () => {
            if (!slug) return

            try {
                const res = await fetch(`/api/link-details?slug=${slug}`)
                if (res.ok) {
                    const result = await res.json()
                    setData(result)
                } else if (res.status === 503) {
                    setError('Umami Analytics is not configured.')
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

    if (error) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link to="/dashboard" className="p-2 rounded hover:bg-quest-elevated text-quest-muted">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-2xl font-bold text-quest-parchment">Link Analytics</h1>
                </div>
                <GlassCard className="text-center py-12">
                    <p className="text-red-400">{error}</p>
                    {error.includes("Umami") && (
                        <p className="text-quest-muted mt-4">
                            Please configure UMAMI_URL, UMAMI_WEBSITE_ID, UMAMI_USERNAME, and UMAMI_PASSWORD in your environment variables.
                        </p>
                    )}
                </GlassCard>
            </div>
        )
    }

    if (isLoading || !data) {
        return <div className="text-center py-12 text-quest-muted">Loading Analytics...</div>
    }

    // Prepare chart data for line chart
    const chartData = data.pageviews?.pageviews.map((pv, i) => {
        const d = new Date(pv.x);
        return {
            date: `${d.getMonth() + 1}/${d.getDate()}`,
            views: pv.y,
            visitors: data.pageviews?.sessions[i]?.y || 0
        };
    }) || [];

    const stats = data.stats;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    to="/dashboard"
                    className="p-2 rounded hover:bg-quest-elevated text-quest-muted hover:text-quest-parchment transition-colors"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-quest-parchment">Link Analytics</h1>
                    <p className="text-quest-muted">
                        Stats for: <code className="text-quest-gold font-mono">{slug}</code> (Last 30 Days)
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <GlassCard className="flex items-center gap-4">
                    <div className="quest-icon"><BarChart3 className="w-6 h-6" /></div>
                    <div>
                        <p className="text-sm text-quest-muted">Views</p>
                        <p className="text-2xl font-bold text-quest-parchment">{stats?.pageviews?.value || 0}</p>
                    </div>
                </GlassCard>

                <GlassCard className="flex items-center gap-4">
                    <div className="quest-icon quest-icon-purple"><Globe className="w-6 h-6" /></div>
                    <div>
                        <p className="text-sm text-quest-muted">Visitors</p>
                        <p className="text-2xl font-bold text-quest-parchment">{stats?.visitors?.value || 0}</p>
                    </div>
                </GlassCard>

                <GlassCard className="flex items-center gap-4">
                    <div className="quest-icon bg-green-500/10 border-green-400/30 text-green-400"><MapPin className="w-6 h-6 text-green-400" /></div>
                    <div>
                        <p className="text-sm text-quest-muted">Countries</p>
                        <p className="text-2xl font-bold text-quest-parchment">{data.countries?.length || 0}</p>
                    </div>
                </GlassCard>

                <GlassCard className="flex items-center gap-4">
                    <div className="quest-icon bg-pink-500/10 border-pink-400/30 text-pink-400"><Monitor className="w-6 h-6 text-pink-400" /></div>
                    <div>
                        <p className="text-sm text-quest-muted">Browsers</p>
                        <p className="text-2xl font-bold text-quest-parchment">{data.browsers?.length || 0}</p>
                    </div>
                </GlassCard>
            </div>

            {/* Main Chart */}
            <GlassCard>
                <h2 className="text-xl font-semibold text-quest-parchment mb-6">Traffic Overview</h2>
                <div className="h-[300px] w-full">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                <XAxis dataKey="date" stroke="#ffffff50" fontSize={12} />
                                <YAxis stroke="#ffffff50" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1a1b23', borderColor: '#ffffff20', color: '#fff' }}
                                    itemStyle={{ color: '#FCD34D' }}
                                />
                                <Line type="monotone" dataKey="views" name="Views" stroke="#FCD34D" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="visitors" name="Visitors" stroke="#A78BFA" strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full items-center justify-center text-quest-muted">No traffic data available</div>
                    )}
                </div>
            </GlassCard>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GlassCard>
                    <h3 className="text-lg font-medium text-quest-parchment mb-4 flex items-center gap-2">
                        <Link2 size={18} className="text-green-400" /> Top Referrers
                    </h3>
                    <div className="space-y-3">
                        {data.referrers?.slice(0, 5).map((ref, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <span className="text-quest-muted truncate max-w-[200px]">{ref.x || 'Direct'}</span>
                                <span className="text-quest-gold font-mono">{ref.y}</span>
                            </div>
                        ))}
                        {(!data.referrers || data.referrers.length === 0) && (
                            <div className="text-sm text-quest-muted text-center py-4">No referrer data</div>
                        )}
                    </div>
                </GlassCard>

                <GlassCard>
                    <h3 className="text-lg font-medium text-quest-parchment mb-4 flex items-center gap-2">
                        <MapPin size={18} className="text-blue-400" /> Top Countries
                    </h3>
                    <div className="space-y-3">
                        {data.countries?.slice(0, 5).map((country, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <span className="text-quest-muted">{country.x || 'Unknown'}</span>
                                <span className="text-quest-gold font-mono">{country.y}</span>
                            </div>
                        ))}
                        {(!data.countries || data.countries.length === 0) && (
                            <div className="text-sm text-quest-muted text-center py-4">No country data</div>
                        )}
                    </div>
                </GlassCard>

                <GlassCard>
                    <h3 className="text-lg font-medium text-quest-parchment mb-4 flex items-center gap-2">
                        <Monitor size={18} className="text-pink-400" /> Browsers
                    </h3>
                    <div className="space-y-3">
                        {data.browsers?.slice(0, 5).map((browser, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <span className="text-quest-muted">{browser.x || 'Unknown'}</span>
                                <span className="text-quest-gold font-mono">{browser.y}</span>
                            </div>
                        ))}
                        {(!data.browsers || data.browsers.length === 0) && (
                            <div className="text-sm text-quest-muted text-center py-4">No browser data</div>
                        )}
                    </div>
                </GlassCard>

                <GlassCard>
                    <h3 className="text-lg font-medium text-quest-parchment mb-4 flex items-center gap-2">
                        <Globe size={18} className="text-purple-400" /> OS
                    </h3>
                    <div className="space-y-3">
                        {data.os?.slice(0, 5).map((os, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <span className="text-quest-muted">{os.x || 'Unknown'}</span>
                                <span className="text-quest-gold font-mono">{os.y}</span>
                            </div>
                        ))}
                        {(!data.os || data.os.length === 0) && (
                            <div className="text-sm text-quest-muted text-center py-4">No OS data</div>
                        )}
                    </div>
                </GlassCard>
            </div>
        </div>
    )
}
