import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function PasswordPrompt() {
    const [searchParams] = useSearchParams()
    const slug = searchParams.get('slug')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

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
            if (res.ok) {
                const data = await res.json()
                window.location.href = data.destinationUrl
            } else {
                setError('Invalid password')
            }
        } catch {
            setError('Verification failed')
        } finally {
            setIsLoading(false)
        }
    }

    if (!slug) return <div className="container">Invalid link.</div>

    return (
        <div className="container" style={{ marginTop: '20px' }}>
            <div className="topbar"><span className="topbar-text"><b>Protected Link</b></span></div>
            <div style={{ padding: '10px' }}>
                <p>This link requires a password.</p>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <form onSubmit={handleSubmit}>
                    <table>
                        <tbody>
                            <tr>
                                <td>Password:</td>
                                <td><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></td>
                            </tr>
                            <tr>
                                <td></td>
                                <td><button type="submit" disabled={isLoading}>submit</button></td>
                            </tr>
                        </tbody>
                    </table>
                </form>
            </div>
        </div>
    )
}
