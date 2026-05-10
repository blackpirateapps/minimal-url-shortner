import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

export default function PasteView() {
    const { slug } = useParams<{ slug: string }>()
    const [html, setHtml] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchPaste = async () => {
            if (!slug) return

            try {
                const res = await fetch(`/api/get-paste?slug=${slug}`)
                const data = await res.json()

                if (res.ok) {
                    // Dynamically import marked for markdown parsing
                    const { marked } = await import('marked')
                    setHtml(await marked(data.content))
                } else {
                    setError(data.error || 'Paste not found')
                }
            } catch {
                setError('Failed to load paste')
            } finally {
                setIsLoading(false)
            }
        }

        fetchPaste()
    }, [slug])

    return (
        <div className="min-h-screen bg-animated flex items-center justify-center p-4 relative overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-4xl relative z-10"
            >
                <GlassCard>
                    <div className="flex items-center gap-2 mb-6">
                        <div className="quest-icon">
                            <FileText className="w-5 h-5" />
                        </div>
                        <h1 className="text-xl font-semibold text-quest-parchment">Paste View</h1>
                        <code className="text-quest-muted text-sm font-mono ml-auto">{slug}</code>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-12 text-quest-muted">Loading paste...</div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-400">{error}</div>
                    ) : (
                        <div
                            className="quest-prose max-w-none"
                            dangerouslySetInnerHTML={{ __html: html }}
                        />
                    )}
                </GlassCard>
            </motion.div>
        </div>
    )
}
