import { useState } from 'react'
import { motion } from 'framer-motion'
import { Globe, Plus, Trash2 } from 'lucide-react'
import type { Domain } from '@/pages/Dashboard'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface DomainManagerProps {
    domains: Domain[]
    onUpdate: () => void
}

export default function DomainManager({ domains, onUpdate }: DomainManagerProps) {
    const [newDomain, setNewDomain] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const addDomain = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setIsLoading(true)

        try {
            const res = await fetch('/api/add-domain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hostname: newDomain }),
            })

            const data = await res.json()

            if (res.ok) {
                setSuccess('Domain added successfully')
                setNewDomain('')
                onUpdate()
            } else {
                setError(data.error || 'Failed to add domain')
            }
        } catch {
            setError('Something went wrong')
        } finally {
            setIsLoading(false)
        }
    }

    const deleteDomain = async (hostname: string) => {
        if (!confirm(`Delete domain "${hostname}"?`)) return

        try {
            const res = await fetch('/api/domains', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hostname }),
            })

            const data = await res.json()

            if (res.ok) {
                onUpdate()
            } else {
                alert(data.error || 'Failed to delete domain')
            }
        } catch {
            alert('Something went wrong')
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Add Domain */}
            <GlassCard>
                <div className="quest-card-title">
                    <div className="quest-icon">
                        <Plus className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-quest-parchment">Add Domain</h3>
                </div>

                <form onSubmit={addDomain} className="space-y-4">
                    <Input
                        placeholder="link.yourdomain.com"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        required
                    />
                    <Button type="submit" isLoading={isLoading} className="w-full">
                        Add Domain
                    </Button>
                </form>

                {error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-red-400 text-sm">
                        {error}
                    </motion.p>
                )}
                {success && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-green-400 text-sm">
                        {success}
                    </motion.p>
                )}
            </GlassCard>

            {/* Domain List */}
            <GlassCard>
                <div className="quest-card-title">
                    <div className="quest-icon quest-icon-purple">
                        <Globe className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-quest-parchment">Your Domains</h3>
                </div>

                {domains.length === 0 ? (
                    <p className="text-quest-muted text-sm">No domains added yet</p>
                ) : (
                    <div className="space-y-2">
                        {domains.map((domain) => (
                            <motion.div
                                key={domain.hostname}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="quest-row flex items-center justify-between p-3"
                            >
                                <span className="text-quest-parchment font-medium">{domain.hostname}</span>
                                <button
                                    onClick={() => deleteDomain(domain.hostname)}
                                    className="p-1.5 rounded hover:bg-red-500/20 text-quest-muted hover:text-red-400 transition-colors"
                                    title="Delete domain"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </GlassCard>
        </div>
    )
}
