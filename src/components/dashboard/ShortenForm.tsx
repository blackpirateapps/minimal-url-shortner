import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link2, Copy, Check } from 'lucide-react'
import type { Domain } from '@/pages/Dashboard'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'

interface ShortenFormProps {
    domains: Domain[]
    onSuccess: () => void
}

export default function ShortenForm({ domains, onSuccess }: ShortenFormProps) {
    const [form, setForm] = useState({
        url: '',
        slug: '',
        password: '',
        hostname: domains[0]?.hostname || '',
    })
    const [result, setResult] = useState<string | null>(null)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    // Update hostname when domains load
    if (domains.length > 0 && !form.hostname) {
        setForm((f) => ({ ...f, hostname: domains[0].hostname }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setResult(null)
        setIsLoading(true)

        try {
            const payload: Record<string, string> = {
                url: form.url,
                hostname: form.hostname,
            }
            if (form.slug) payload.slug = form.slug
            if (form.password) payload.password = form.password

            const res = await fetch('/api/shorten', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const data = await res.json()

            if (res.ok) {
                setResult(data.shortUrl)
                setForm((f) => ({ ...f, url: '', slug: '', password: '' }))
                onSuccess()
            } else {
                setError(data.error || 'Failed to create link')
            }
        } catch {
            setError('Something went wrong')
        } finally {
            setIsLoading(false)
        }
    }

    const copyResult = async () => {
        if (result) {
            await navigator.clipboard.writeText(result)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const domainOptions = domains.map((d) => ({
        value: d.hostname,
        label: d.hostname,
    }))

    return (
        <GlassCard>
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-ocean-500/20 to-ocean-600/20">
                    <Link2 className="w-5 h-5 text-ocean-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Shorten URL</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {domains.length > 0 && (
                    <Select
                        label="Domain"
                        id="domain"
                        options={domainOptions}
                        value={form.hostname}
                        onChange={(e) => setForm((f) => ({ ...f, hostname: e.target.value }))}
                    />
                )}

                <Input
                    label="Destination URL"
                    id="url"
                    type="url"
                    placeholder="https://example.com/your-long-url"
                    value={form.url}
                    onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                    required
                />

                <Input
                    label="Custom Slug (optional)"
                    id="slug"
                    placeholder="my-custom-link"
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                />

                <Input
                    label="Password (optional)"
                    id="password"
                    type="password"
                    placeholder="Protect this link"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />

                <Button type="submit" isLoading={isLoading} className="w-full">
                    Generate Short URL
                </Button>
            </form>

            {error && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 text-red-400 text-sm"
                >
                    {error}
                </motion.p>
            )}

            {result && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20"
                >
                    <p className="text-green-400 text-sm font-medium mb-2">Success!</p>
                    <div className="flex items-center gap-2">
                        <a
                            href={result}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 font-mono text-sm break-all flex-1"
                        >
                            {result}
                        </a>
                        <button
                            onClick={copyResult}
                            className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors flex-shrink-0"
                        >
                            {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                        </button>
                    </div>
                </motion.div>
            )}
        </GlassCard>
    )
}
