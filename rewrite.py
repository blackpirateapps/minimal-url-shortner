import os

def write_file(path, content):
    with open(path, 'w') as f:
        f.write(content.strip() + '\n')

write_file('src/components/Layout.tsx', """
import { Outlet, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function Layout() {
    const { logout } = useAuth()
    return (
        <div className="container">
            <div className="topbar">
                <span className="topbar-text">
                    <Link to="/dashboard" className="header-link" style={{color: '#000'}}><b>RapidLink</b></Link> | 
                    <Link to="/dashboard" className="header-link">Dashboard</Link>
                </span>
                <span style={{ float: 'right' }}>
                    <button onClick={logout} style={{background: 'transparent', border: 'none', color: '#000', cursor: 'pointer', fontWeight: 'bold'}}>Logout</button>
                </span>
            </div>
            <div style={{ padding: '10px' }}>
                <Outlet />
            </div>
        </div>
    )
}
""")

write_file('src/pages/Login.tsx', """
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function Login() {
    const [password, setPassword] = useState('')
    const [rememberMe, setRememberMe] = useState(false)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()
    const { login } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')
        try {
            const success = await login(password, rememberMe)
            if (success) navigate('/dashboard')
            else setError('Invalid password')
        } catch {
            setError('Login failed')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="container" style={{ marginTop: '20px' }}>
            <div className="topbar"><span className="topbar-text"><b>RapidLink Login</b></span></div>
            <div style={{ padding: '10px' }}>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <form onSubmit={handleSubmit}>
                    <table>
                        <tbody>
                            <tr>
                                <td>Password:</td>
                                <td><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></td>
                            </tr>
                            <tr>
                                <td>Remember Me:</td>
                                <td><input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} /></td>
                            </tr>
                            <tr>
                                <td></td>
                                <td><button type="submit" disabled={isLoading}>login</button></td>
                            </tr>
                        </tbody>
                    </table>
                </form>
            </div>
        </div>
    )
}
""")

write_file('src/pages/PasswordPrompt.tsx', """
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

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
""")

write_file('src/pages/PasteView.tsx', """
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

export default function PasteView() {
    const { slug } = useParams<{ slug: string }>()
    const [content, setContent] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchPaste = async () => {
            if (!slug) return
            try {
                const res = await fetch(`/api/get-paste?slug=${slug}`)
                if (res.ok) {
                    const data = await res.json()
                    setContent(data.content)
                } else {
                    setError('Paste not found or protected')
                }
            } catch {
                setError('Error fetching paste')
            }
        }
        fetchPaste()
    }, [slug])

    if (error) return <div className="container" style={{padding: '10px'}}>{error}</div>

    return (
        <div className="container" style={{ marginTop: '20px' }}>
            <div className="topbar"><span className="topbar-text"><b>Paste: {slug}</b></span></div>
            <div style={{ padding: '10px' }}>
                <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{content}</pre>
            </div>
        </div>
    )
}
""")
