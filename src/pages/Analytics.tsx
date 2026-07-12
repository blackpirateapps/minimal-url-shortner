import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

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
                    setData(await res.json())
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
            <div style={{ padding: '10px' }}>
                <p style={{ color: 'red' }}>{error}</p>
                <Link to="/dashboard">[back to dashboard]</Link>
            </div>
        )
    }

    if (isLoading || !data) {
        return <div style={{ padding: '10px' }}>Loading...</div>
    }

    const stats = data.stats;

    return (
        <div>
            <div style={{ marginBottom: '20px' }}>
                <b>Stats for: {slug} (Last 30 Days)</b>
                <br/>
                <Link to="/dashboard" style={{ fontSize: '9pt' }}>[back to dashboard]</Link>
            </div>

            <div className="table-responsive">
                <table border={1} cellPadding={5} style={{ width: '100%', minWidth: '400px', marginBottom: '20px', borderCollapse: 'collapse', borderColor: '#ccc' }}>
                    <tbody>
                        <tr style={{ backgroundColor: '#eee' }}>
                            <th>Views</th>
                            <th>Visitors</th>
                            <th>Countries</th>
                            <th>Browsers</th>
                        </tr>
                        <tr>
                            <td align="center">{stats?.pageviews?.value || 0}</td>
                            <td align="center">{stats?.visitors?.value || 0}</td>
                            <td align="center">{data.countries?.length || 0}</td>
                            <td align="center">{data.browsers?.length || 0}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="table-responsive">
                <table width="100%" style={{ minWidth: '500px' }}>
                    <tbody>
                        <tr>
                            <td valign="top" width="50%">
                                <b>Top Referrers</b>
                                <table width="90%" border={1} cellPadding={3} style={{ borderCollapse: 'collapse', borderColor: '#eee', marginTop: '5px' }}>
                                    <tbody>
                                        <tr className="table-header"><th>Referrer</th><th>Views</th></tr>
                                        {data.referrers?.slice(0, 5).map((ref, i) => (
                                            <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f6f6ef' : '#fff' }}>
                                                <td>{ref.x || 'Direct'}</td>
                                                <td align="right">{ref.y}</td>
                                            </tr>
                                        ))}
                                        {(!data.referrers || data.referrers.length === 0) && <tr><td colSpan={2}>No data</td></tr>}
                                    </tbody>
                                </table>
                            </td>
                            <td valign="top" width="50%">
                                <b>Top Countries</b>
                                <table width="90%" border={1} cellPadding={3} style={{ borderCollapse: 'collapse', borderColor: '#eee', marginTop: '5px' }}>
                                    <tbody>
                                        <tr className="table-header"><th>Country</th><th>Views</th></tr>
                                        {data.countries?.slice(0, 5).map((c, i) => (
                                            <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f6f6ef' : '#fff' }}>
                                                <td>{c.x || 'Unknown'}</td>
                                                <td align="right">{c.y}</td>
                                            </tr>
                                        ))}
                                        {(!data.countries || data.countries.length === 0) && <tr><td colSpan={2}>No data</td></tr>}
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}
