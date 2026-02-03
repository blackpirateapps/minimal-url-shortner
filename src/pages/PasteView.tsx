import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

export default function PasteView() {
    const { slug } = useParams<{ slug: string }>()
    const [content, setContent] = useState('')
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
                    setContent(data.content)
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
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-4xl relative z-10"
            >
                <GlassCard>
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-pink-500/20 to-orange-500/20">
                            <FileText className="w-5 h-5 text-pink-400" />
                        </div>
                        <h1 className="text-xl font-semibold text-white">Paste View</h1>
                        <code className="text-white/40 text-sm font-mono ml-auto">{slug}</code>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-12 text-white/60">Loading paste...</div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-400">{error}</div>
                    ) : (
                        <div
                            className="prose prose-invert max-w-none
                prose-headings:text-white prose-headings:font-semibold
                prose-p:text-white/80 prose-p:leading-relaxed
                prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline
                prose-code:text-pink-400 prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono
                prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-lg
                prose-blockquote:border-l-cyan-400 prose-blockquote:text-white/70
                prose-strong:text-white prose-strong:font-semibold
                prose-ul:text-white/80 prose-ol:text-white/80
                prose-li:marker:text-cyan-400"
                            dangerouslySetInnerHTML={{ __html: html }}
                        />
                    )}
                </GlassCard>
            </motion.div>
        </div>
    )
}
