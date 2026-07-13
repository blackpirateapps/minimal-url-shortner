import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export default function PasteView() {
    const { slug } = useParams<{ slug: string }>()
    const [content, setContent] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        const fetchPaste = async () => {
            if (!slug) return
            try {
                const res = await fetch(`/api/get-paste?slug=${slug}`)
                if (res.ok) {
                    const data = await res.json()
                    setContent(data.content)
                } else if (res.status === 403) {
                    navigate(`/password?slug=${slug}`)
                } else {
                    setError('Paste not found')
                }
            } catch {
                setError('Error fetching paste')
            }
        }
        fetchPaste()
    }, [slug, navigate])

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
