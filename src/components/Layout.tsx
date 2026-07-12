import { Outlet, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function Layout() {
    const { logout } = useAuth()
    return (
        <div className="container">
            <div className="topbar">
                <span className="topbar-text">
                    <Link to="/dashboard" className="header-link"><b>RapidLink</b></Link> | 
                    <Link to="/dashboard" className="header-link">Dashboard</Link>
                </span>
                <span style={{ float: 'right' }}>
                    <button onClick={logout} style={{background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold'}}>Logout</button>
                </span>
            </div>
            <div style={{ padding: '10px' }}>
                <Outlet />
            </div>
        </div>
    )
}
