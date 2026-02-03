import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link2, Clipboard, ChevronDown, ChevronUp } from 'lucide-react'
import Button from '@/components/ui/Button'
import LinkList from '@/components/dashboard/LinkList'
import ShortenForm from '@/components/dashboard/ShortenForm'
import DomainManager from '@/components/dashboard/DomainManager'
import PasteForm from '@/components/dashboard/PasteForm'
import PasteList from '@/components/dashboard/PasteList'

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

export interface Paste {
    slug: string
    hostname: string
    hasPassword: boolean
    expiresAt: string | null
    createdAt: string
    isExpired: boolean
}

export default function Dashboard() {
    const [domains, setDomains] = useState<Domain[]>([])
    const [links, setLinks] = useState<Link[]>([])
    const [pastes, setPastes] = useState<Paste[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isPastesLoading, setIsPastesLoading] = useState(true)
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

    const fetchPastes = async () => {
        try {
            const res = await fetch('/api/pastes')
            if (res.ok) {
                const data = await res.json()
                setPastes(data)
            }
        } catch (err) {
            console.error('Failed to fetch pastes:', err)
        } finally {
            setIsPastesLoading(false)
        }
    }

    useEffect(() => {
        fetchDomains()
        fetchLinks()
        fetchPastes()
    }, [])

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard</h1>
                    <p className="text-white/60 mt-1 text-sm sm:text-base">Manage your short links and pastes</p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant={activeTab === 'links' ? 'primary' : 'secondary'}
                        onClick={() => setActiveTab('links')}
                        className="flex items-center gap-2 flex-1 sm:flex-none justify-center"
                    >
                        <Link2 size={18} />
                        <span>Links</span>
                    </Button>
                    <Button
                        variant={activeTab === 'paste' ? 'primary' : 'secondary'}
                        onClick={() => setActiveTab('paste')}
                        className="flex items-center gap-2 flex-1 sm:flex-none justify-center"
                    >
                        <Clipboard size={18} />
                        <span>Paste</span>
                    </Button>
                </div>
            </div>

            {/* Domain Manager Toggle */}
            <button
                onClick={() => setShowDomains(!showDomains)}
                className="flex items-center gap-2 text-ocean-400 hover:text-ocean-300 transition-colors text-sm"
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
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
                <div>
                    <PasteForm domains={domains} onSuccess={fetchPastes} />
                    <PasteList pastes={pastes} isLoading={isPastesLoading} onUpdate={fetchPastes} />
                </div>
            )}
        </div>
    )
}
