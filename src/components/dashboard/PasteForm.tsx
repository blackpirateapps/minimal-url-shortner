import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clipboard, Copy, Check } from 'lucide-react'
import type { Domain } from '@/pages/Dashboard'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'

interface PasteFormProps {
    domains: Domain[]
}

export default function PasteForm({ domains }: PasteFormProps) {
    const [form, setForm] = useState({
        content: '',
        hostname: domains[0]?.hostname || '',
        password: '',
        expires: 'never',
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
                content: form.content,
                hostname: form.hostname,
                expires: form.expires,
            }
            if (form.password) payload.password = form.password

            const res = await fetch('/api/create-paste', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const data = await res.json()

            if (res.ok) {
                setResult(data.pasteUrl)
                setForm((f) => ({ ...f, content: '', password: '' }))
            } else {
                setError(data.error || 'Failed to create paste')
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

    const expiresOptions = [
        { value: 'never', label: 'Never' },
        { value: '1hour', label: 'After 1 Hour' },
        { value: '1day', label: 'After 1 Day' },
        { value: '1week', label: 'After 1 Week' },
    ]

    return (
        <GlassCard className="max-w-4xl">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-ocean-500/20 to-ocean-600/20">
                    <Clipboard className="w-5 h-5 text-ocean-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Create a Paste</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-white/70">Content (Markdown supported)</label>
                    <textarea
                        value={form.content}
                        onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                        rows={12}
                        required
                        className="w-full px-4 py-3 rounded-lg glass-input text-white placeholder:text-white/40 outline-none font-mono text-sm resize-y"
                        placeholder="# Your markdown content here..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {domains.length > 0 && (
                        <Select
                            label="Domain"
                            options={domainOptions}
                            value={form.hostname}
                            onChange={(e) => setForm((f) => ({ ...f, hostname: e.target.value }))}
                        />
                    )}

                    <Input
                        label="Password (optional)"
                        type="password"
                        placeholder="Protect this paste"
                        value={form.password}
                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    />

                    <Select
                        label="Auto-Delete"
                        options={expiresOptions}
                        value={form.expires}
                        onChange={(e) => setForm((f) => ({ ...f, expires: e.target.value }))}
                    />
                </div>

                <Button type="submit" isLoading={isLoading} className="w-full">
                    Create Paste Link
                </Button>
            </form>

            {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-red-400 text-sm">
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
