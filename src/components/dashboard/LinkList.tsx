import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, Trash2, Edit2, Lock, ExternalLink, Search } from 'lucide-react'
import type { Link as LinkType, Domain } from '@/pages/Dashboard'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'

interface LinkListProps {
    links: LinkType[]
    domains: Domain[]
    isLoading: boolean
    onUpdate: () => void
}

export default function LinkList({ links, domains, isLoading, onUpdate }: LinkListProps) {
    const [search, setSearch] = useState('')
    const [domainFilter, setDomainFilter] = useState('all')
    const [passwordFilter, setPasswordFilter] = useState('all')
    const [sortBy, setSortBy] = useState('created_at_desc')
    const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
    const [editingLink, setEditingLink] = useState<LinkType | null>(null)
    const [editForm, setEditForm] = useState({ destinationUrl: '', newSlug: '', password: '' })

    const copyToClipboard = async (slug: string, hostname: string) => {
        const url = `https://${hostname}/${slug}`
        await navigator.clipboard.writeText(url)
        setCopiedSlug(slug)
        setTimeout(() => setCopiedSlug(null), 2000)
    }

    const deleteLink = async (slug: string) => {
        if (!confirm(`Delete link "${slug}"?`)) return
        try {
            const res = await fetch('/api/links', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug }),
            })
            if (res.ok) onUpdate()
        } catch (err) {
            console.error('Failed to delete:', err)
        }
    }

    const openEditModal = (link: LinkType) => {
        setEditingLink(link)
        setEditForm({
            destinationUrl: link.url,
            newSlug: link.slug,
            password: '',
        })
    }

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingLink) return

        try {
            const res = await fetch('/api/links', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    originalSlug: editingLink.slug,
                    destinationUrl: editForm.destinationUrl,
                    newSlug: editForm.newSlug,
                    ...(editForm.password !== '' && { password: editForm.password }),
                }),
            })
            if (res.ok) {
                setEditingLink(null)
                onUpdate()
            }
        } catch (err) {
            console.error('Failed to update:', err)
        }
    }

    // Filter and sort
    const filteredLinks = links
        .filter((link) => {
            const matchesSearch =
                link.slug.toLowerCase().includes(search.toLowerCase()) ||
                link.url.toLowerCase().includes(search.toLowerCase())
            const matchesDomain = domainFilter === 'all' || link.hostname === domainFilter
            const matchesPassword =
                passwordFilter === 'all' ||
                (passwordFilter === 'protected' && link.password) ||
                (passwordFilter === 'not-protected' && !link.password)
            return matchesSearch && matchesDomain && matchesPassword
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'created_at_asc':
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                case 'clicks_desc':
                    return (b.click_count || 0) - (a.click_count || 0)
                case 'clicks_asc':
                    return (a.click_count || 0) - (b.click_count || 0)
                default:
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            }
        })

    const domainOptions = [
        { value: 'all', label: 'All Domains' },
        ...domains.map((d) => ({ value: d.hostname, label: d.hostname })),
    ]

    const passwordOptions = [
        { value: 'all', label: 'All Links' },
        { value: 'protected', label: 'Password Protected' },
        { value: 'not-protected', label: 'Not Protected' },
    ]

    const sortOptions = [
        { value: 'created_at_desc', label: 'Newest First' },
        { value: 'created_at_asc', label: 'Oldest First' },
        { value: 'clicks_desc', label: 'Most Clicks' },
        { value: 'clicks_asc', label: 'Least Clicks' },
    ]

    return (
        <>
            <GlassCard>
                <h2 className="text-xl font-semibold text-white mb-4">Active Links</h2>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg glass-input text-white placeholder:text-white/40 outline-none"
                        />
                    </div>
                    <Select options={domainOptions} value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)} />
                    <Select options={passwordOptions} value={passwordFilter} onChange={(e) => setPasswordFilter(e.target.value)} />
                    <Select options={sortOptions} value={sortBy} onChange={(e) => setSortBy(e.target.value)} />
                </div>

                {/* Links Table */}
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="text-center py-8 text-white/60">Loading links...</div>
                    ) : filteredLinks.length === 0 ? (
                        <div className="text-center py-8 text-white/60">No links found</div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-2 text-xs font-medium text-white/50 uppercase">Short Link</th>
                                    <th className="text-left py-3 px-2 text-xs font-medium text-white/50 uppercase">Destination</th>
                                    <th className="text-left py-3 px-2 text-xs font-medium text-white/50 uppercase">Clicks</th>
                                    <th className="text-left py-3 px-2 text-xs font-medium text-white/50 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {filteredLinks.map((link) => (
                                        <motion.tr
                                            key={link.slug}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                        >
                                            <td className="py-3 px-2">
                                                <div className="flex items-center gap-2">
                                                    <a
                                                        href={`https://${link.hostname}/${link.slug}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-cyan-400 hover:text-cyan-300 font-mono text-sm flex items-center gap-1"
                                                    >
                                                        {link.hostname}/{link.slug}
                                                        <ExternalLink size={12} />
                                                    </a>
                                                    {link.password && <Lock size={14} className="text-white/40" />}
                                                </div>
                                            </td>
                                            <td className="py-3 px-2">
                                                <span className="text-white/70 text-sm truncate block max-w-[200px]" title={link.url}>
                                                    {link.url}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2">
                                                <Link
                                                    to={`/details/${link.slug}`}
                                                    className="text-ocean-400 hover:text-ocean-300 font-medium"
                                                >
                                                    {link.click_count || 0}
                                                </Link>
                                            </td>
                                            <td className="py-3 px-2">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => copyToClipboard(link.slug, link.hostname)}
                                                        className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                                        title="Copy"
                                                    >
                                                        {copiedSlug === link.slug ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(link)}
                                                        className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteLink(link.slug)}
                                                        className="p-2 rounded-lg hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    )}
                </div>
            </GlassCard>

            {/* Edit Modal */}
            <Modal isOpen={!!editingLink} onClose={() => setEditingLink(null)} title="Edit Link">
                <form onSubmit={handleEdit} className="space-y-4">
                    <Input
                        label="Destination URL"
                        type="url"
                        value={editForm.destinationUrl}
                        onChange={(e) => setEditForm((f) => ({ ...f, destinationUrl: e.target.value }))}
                        required
                    />
                    <Input
                        label="Slug"
                        value={editForm.newSlug}
                        onChange={(e) => setEditForm((f) => ({ ...f, newSlug: e.target.value }))}
                        required
                    />
                    <Input
                        label="New Password (leave blank to keep)"
                        type="password"
                        value={editForm.password}
                        onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                        placeholder="Leave blank to keep current"
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={() => setEditingLink(null)}>
                            Cancel
                        </Button>
                        <Button type="submit">Save Changes</Button>
                    </div>
                </form>
            </Modal>
        </>
    )
}
