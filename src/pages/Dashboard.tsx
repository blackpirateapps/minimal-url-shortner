import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Link2, Clipboard, ChevronDown, ChevronUp } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import LinkList from '@/components/dashboard/LinkList'
import ShortenForm from '@/components/dashboard/ShortenForm'
import DomainManager from '@/components/dashboard/DomainManager'
import PasteForm from '@/components/dashboard/PasteForm'

export interface Domain {
    hostname: string
}

export interface Link {
    slug: string
    url: string
    hostname: string
    password: string | null
    click_count: number
    created_at: string
}

export default function Dashboard() {
    const [domains, setDomains] = useState<Domain[]>([])
    const [links, setLinks] = useState<Link[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showDomains, setShowDomains] = useState(false)
    const [activeTab, setActiveTab] = useState<'links' | 'paste'>('links')

    const fetchDomains = async () => {
        try {
            const res = await fetch('/api/domains')
            if (res.ok) {
                const data = await res.json()
                setDomains(data)
            }
        } catch (err) {
            console.error('Failed to fetch domains:', err)
        }
    }

    const fetchLinks = async () => {
        try {
            const res = await fetch('/api/links')
            if (res.ok) {
                const data = await res.json()
                setLinks(data)
            }
        } catch (err) {
            console.error('Failed to fetch links:', err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchDomains()
        fetchLinks()
    }, [])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                    <p className="text-white/60 mt-1">Manage your short links and pastes</p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant={activeTab === 'links' ? 'primary' : 'secondary'}
                        onClick={() => setActiveTab('links')}
                        className="flex items-center gap-2"
                    >
                        <Link2 size={18} />
                        Links
                    </Button>
                    <Button
                        variant={activeTab === 'paste' ? 'primary' : 'secondary'}
                        onClick={() => setActiveTab('paste')}
                        className="flex items-center gap-2"
                    >
                        <Clipboard size={18} />
                        Paste
                    </Button>
                </div>
            </div>

            {/* Domain Manager Toggle */}
            <button
                onClick={() => setShowDomains(!showDomains)}
                className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
                {showDomains ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                Manage Domains
            </button>

            {/* Domain Manager */}
            {showDomains && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                >
                    <DomainManager domains={domains} onUpdate={fetchDomains} />
                </motion.div>
            )}

            {/* Main Content */}
            {activeTab === 'links' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Shorten Form */}
                    <div className="lg:col-span-1">
                        <ShortenForm domains={domains} onSuccess={fetchLinks} />
                    </div>

                    {/* Links List */}
                    <div className="lg:col-span-2">
                        <LinkList
                            links={links}
                            domains={domains}
                            isLoading={isLoading}
                            onUpdate={fetchLinks}
                        />
                    </div>
                </div>
            ) : (
                <PasteForm domains={domains} />
            )}
        </div>
    )
}
