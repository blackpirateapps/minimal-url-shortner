import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, Trash2, Lock, ExternalLink, Clock, AlertTriangle } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

interface Paste {
    slug: string
    hostname: string
    hasPassword: boolean
    expiresAt: string | null
    createdAt: string
    isExpired: boolean
}

interface PasteListProps {
    pastes: Paste[]
    isLoading: boolean
    onUpdate: () => void
}

export default function PasteList({ pastes, isLoading, onUpdate }: PasteListProps) {
    const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
    const [showExpired, setShowExpired] = useState(false)

    const copyToClipboard = async (slug: string, hostname: string) => {
        const url = `https://${hostname}/p/${slug}`
        await navigator.clipboard.writeText(url)
        setCopiedSlug(slug)
        setTimeout(() => setCopiedSlug(null), 2000)
    }

    const deletePaste = async (slug: string) => {
        if (!confirm(`Delete paste "${slug}"?`)) return
        try {
            const res = await fetch('/api/pastes', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug }),
            })
            if (res.ok) onUpdate()
        } catch (err) {
            console.error('Failed to delete:', err)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const formatExpiry = (expiresAt: string | null, isExpired: boolean) => {
        if (!expiresAt) return 'Never'
        if (isExpired) return 'Expired'
        return formatDate(expiresAt)
    }

    // Filter pastes based on showExpired toggle
    const filteredPastes = showExpired ? pastes : pastes.filter(p => !p.isExpired)
    const expiredCount = pastes.filter(p => p.isExpired).length

    return (
        <GlassCard className="mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-quest-parchment">Your Pastes</h2>
                {expiredCount > 0 && (
                    <button
                        onClick={() => setShowExpired(!showExpired)}
                        className="flex items-center gap-2 text-sm text-quest-muted hover:text-quest-parchment transition-colors"
                    >
                        <AlertTriangle size={14} />
                        {showExpired ? 'Hide' : 'Show'} {expiredCount} expired
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="text-center py-8 text-quest-muted">Loading pastes...</div>
            ) : filteredPastes.length === 0 ? (
                <div className="text-center py-8 text-quest-muted">
                    {pastes.length === 0 ? 'No pastes yet' : 'No active pastes'}
                </div>
            ) : (
                <div className="space-y-2">
                    <AnimatePresence>
                        {filteredPastes.map((paste) => (
                            <motion.div
                                key={paste.slug}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={`p-3 sm:p-4 rounded border transition-colors ${paste.isExpired
                                        ? 'bg-red-500/5 border-red-500/20'
                                        : 'quest-row'
                                    }`}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                    {/* Main content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <a
                                                href={`https://${paste.hostname}/p/${paste.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`font-mono text-sm flex items-center gap-1 ${paste.isExpired
                                                        ? 'text-red-400/70 line-through'
                                                        : 'text-quest-gold hover:text-quest-goldLight'
                                                    }`}
                                            >
                                                <span className="truncate">{paste.hostname}/p/{paste.slug}</span>
                                                <ExternalLink size={12} className="flex-shrink-0" />
                                            </a>
                                            {paste.hasPassword && (
                                                <Lock size={14} className="text-quest-muted flex-shrink-0" />
                                            )}
                                            {paste.isExpired && (
                                                <span className="quest-chip quest-chip-error">
                                                    Expired
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-quest-muted">
                                            <span>Created: {formatDate(paste.createdAt)}</span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={10} />
                                                Expires: {formatExpiry(paste.expiresAt, paste.isExpired)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 self-end sm:self-center">
                                        <button
                                            onClick={() => copyToClipboard(paste.slug, paste.hostname)}
                                            className="p-2 rounded hover:bg-quest-elevated text-quest-muted hover:text-quest-parchment transition-colors"
                                            title="Copy link"
                                        >
                                            {copiedSlug === paste.slug ? (
                                                <Check size={16} className="text-green-400" />
                                            ) : (
                                                <Copy size={16} />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => deletePaste(paste.slug)}
                                            className="p-2 rounded hover:bg-red-500/20 text-quest-muted hover:text-red-400 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </GlassCard>
    )
}
