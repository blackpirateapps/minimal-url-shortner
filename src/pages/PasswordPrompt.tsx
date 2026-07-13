import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

export default function PasswordPrompt() {
    const [searchParams] = useSearchParams()
    const slug = searchParams.get('slug')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [pasteContent, setPasteContent] = useState<string | null>(null)
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!slug) return
        setIsLoading(true)
        setError('')

        try {
            const res = await fetch('/api/verify-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug, password }),
            })

            const data = await res.json().catch(() => ({}))

            if (res.ok) {
                if (data.destinationUrl) {
                    window.location.href = data.destinationUrl
                } else if (data.content !== undefined) {
                    setPasteContent(data.content)
                } else {
                    setError('Success, but no content was returned.')
                }
            } else {
                setError(data.error || 'Invalid password. Please try again.')
            }
        } catch {
            setError('Unable to verify password. Please check your network connection.')
        } finally {
            setIsLoading(false)
        }
    }

    if (!slug) {
        return (
            <div className="container" style={{ marginTop: '20px' }}>
                <div className="topbar"><span className="topbar-text"><b>Error</b></span></div>
                <div style={{ padding: '15px' }}>
                    <p style={{ color: '#d32f2f' }}>Invalid link or missing link identifier.</p>
                    <button onClick={() => navigate('/')} style={{ marginTop: '10px' }}>Go Home</button>
                </div>
            </div>
        )
    }

    if (pasteContent !== null) {
        return (
            <div className="container" style={{ marginTop: '20px' }}>
                <div className="topbar">
                    <span className="topbar-text"><b>Unlocked Paste: {slug}</b></span>
                </div>
                <div style={{ padding: '15px' }}>
                    <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', background: '#fff', border: '1px solid #ccc', padding: '12px' }}>
                        {pasteContent}
                    </pre>
                    <div style={{ marginTop: '15px' }}>
                        <button onClick={() => navigator.clipboard.writeText(pasteContent)}>Copy Paste Content</button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="container" style={{ marginTop: '20px' }}>
            <div className="topbar">
                <span className="topbar-text"><b>Password Required</b></span>
            </div>
            <div style={{ padding: '15px', maxWidth: '500px' }}>
                <p style={{ marginBottom: '12px' }}>
                    This item (<b>{slug}</b>) is password protected. Enter the password to access it.
                </p>

                {error && (
                    <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '8px 12px', border: '1px solid #ef9a9a', marginBottom: '12px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <table style={{ width: '100%' }}>
                        <tbody>
                            <tr>
                                <td style={{ width: '90px', paddingBottom: '8px' }}>Password:</td>
                                <td style={{ paddingBottom: '8px' }}>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            autoFocus
                                            placeholder="Enter password"
                                            style={{ width: '100%', padding: '4px' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{ fontSize: '9pt', whiteSpace: 'nowrap' }}
                                        >
                                            {showPassword ? 'Hide' : 'Show'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td></td>
                                <td>
                                    <button type="submit" disabled={isLoading} style={{ fontWeight: 'bold' }}>
                                        {isLoading ? 'Unlocking...' : 'Unlock'}
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </form>
            </div>
        </div>
    )
}
