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
