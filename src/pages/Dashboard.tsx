import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'

export interface Domain { hostname: string }
export interface LinkItem { slug: string, url: string, hostname: string, password: string | null, click_count: number, created_at: string }
export interface PasteItem { slug: string, hostname: string, hasPassword: boolean, expiresAt: string | null, createdAt: string, isExpired: boolean }

export default function Dashboard() {
    const [domains, setDomains] = useState<Domain[]>([])
    const [links, setLinks] = useState<LinkItem[]>([])
    const [pastes, setPastes] = useState<PasteItem[]>([])
    
    const [newDomain, setNewDomain] = useState('')
    
    // Shorten form state
    const [longUrl, setLongUrl] = useState('')
    const [customSlug, setCustomSlug] = useState('')
    const [selectedDomain, setSelectedDomain] = useState('')
    const [linkPassword, setLinkPassword] = useState('')
    
    // Paste form state
    const [pasteContent, setPasteContent] = useState('')
    const [pasteSlug, setPasteSlug] = useState('')
    const [pasteDomain, setPasteDomain] = useState('')
    const [pastePassword, setPastePassword] = useState('')

    const [view, setView] = useState<'links' | 'pastes' | 'domains'>('links')

    // List viewing options
    const [searchQuery, setSearchQuery] = useState('')
    const [sortField, setSortField] = useState<'date' | 'clicks' | 'slug'>('date')
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [currentPage, setCurrentPage] = useState(1)

    // Similar states for pastes
    const [pasteSearchQuery, setPasteSearchQuery] = useState('')
    const [pasteCurrentPage, setPasteCurrentPage] = useState(1)

    const fetchDomains = async () => {
        const res = await fetch('/api/domains')
        if (res.ok) {
            const data = await res.json()
            setDomains(data)
            if (data.length > 0 && !selectedDomain) setSelectedDomain(data[0].hostname)
            if (data.length > 0 && !pasteDomain) setPasteDomain(data[0].hostname)
        }
    }

    const fetchLinks = async () => {
        const res = await fetch('/api/links')
        if (res.ok) setLinks(await res.json())
    }

    const fetchPastes = async () => {
        const res = await fetch('/api/pastes')
        if (res.ok) setPastes(await res.json())
    }

    useEffect(() => {
        fetchDomains()
        fetchLinks()
        fetchPastes()
    }, [])

    const handleAddDomain = async (e: React.FormEvent) => {
        e.preventDefault()
        await fetch('/api/add-domain', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({hostname: newDomain}) })
        setNewDomain('')
        fetchDomains()
    }

    const handleDeleteDomain = async (hostname: string) => {
        if (!confirm('Delete domain ' + hostname + '?')) return
        await fetch('/api/domains', { method: 'DELETE', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({hostname}) })
        fetchDomains()
    }

    const handleShorten = async (e: React.FormEvent) => {
        e.preventDefault()
        await fetch('/api/shorten', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ url: longUrl, slug: customSlug, hostname: selectedDomain, password: linkPassword })
        })
        setLongUrl('')
        setCustomSlug('')
        setLinkPassword('')
        fetchLinks()
    }

    const handleDeleteLink = async (slug: string) => {
        if (!confirm('Delete link ' + slug + '?')) return
        await fetch('/api/links', { method: 'DELETE', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({slug}) })
        fetchLinks()
    }

    const handleCreatePaste = async (e: React.FormEvent) => {
        e.preventDefault()
        await fetch('/api/create-paste', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ content: pasteContent, slug: pasteSlug, hostname: pasteDomain, password: pastePassword })
        })
        setPasteContent('')
        setPasteSlug('')
        setPastePassword('')
        fetchPastes()
    }

    const handleDeletePaste = async (slug: string) => {
        if (!confirm('Delete paste ' + slug + '?')) return
        await fetch('/api/pastes', { method: 'DELETE', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({slug}) })
        fetchPastes()
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    // Prepare Links Data
    const processedLinks = useMemo(() => {
        let l = links.filter(link => 
            link.slug.toLowerCase().includes(searchQuery.toLowerCase()) || 
            link.url.toLowerCase().includes(searchQuery.toLowerCase())
        )
        l.sort((a, b) => {
            let comp = 0
            if (sortField === 'slug') comp = a.slug.localeCompare(b.slug)
            else if (sortField === 'clicks') comp = a.click_count - b.click_count
            else comp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            return sortOrder === 'asc' ? comp : -comp
        })
        return l
    }, [links, searchQuery, sortField, sortOrder])

    const totalPages = Math.ceil(processedLinks.length / itemsPerPage)
    const paginatedLinks = processedLinks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    // Prepare Pastes Data
    const processedPastes = useMemo(() => {
        return pastes.filter(paste => paste.slug.toLowerCase().includes(pasteSearchQuery.toLowerCase()))
    }, [pastes, pasteSearchQuery])

    const pasteTotalPages = Math.ceil(processedPastes.length / itemsPerPage)
    const paginatedPastes = processedPastes.slice((pasteCurrentPage - 1) * itemsPerPage, pasteCurrentPage * itemsPerPage)

    // Reset pagination when data changes
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, sortField, sortOrder, itemsPerPage])

    useEffect(() => {
        setPasteCurrentPage(1)
    }, [pasteSearchQuery, itemsPerPage])

    return (
        <div>
            <div style={{ marginBottom: '10px' }}>
                <a href="#" onClick={(e) => {e.preventDefault(); setView('links')}}>Links</a> | 
                <a href="#" onClick={(e) => {e.preventDefault(); setView('pastes')}}> Pastes</a> | 
                <a href="#" onClick={(e) => {e.preventDefault(); setView('domains')}}> Domains</a>
            </div>

            {view === 'domains' && (
                <div>
                    <b>Manage Domains</b>
                    <ul>
                        {domains.map(d => (
                            <li key={d.hostname}>
                                {d.hostname} [<a href="#" onClick={(e) => {e.preventDefault(); handleDeleteDomain(d.hostname)}}>delete</a>]
                            </li>
                        ))}
                    </ul>
                    <form onSubmit={handleAddDomain} style={{ marginTop: '10px' }}>
                        <input type="text" placeholder="example.com" value={newDomain} onChange={e => setNewDomain(e.target.value)} required />
                        <button type="submit">Add Domain</button>
                    </form>
                </div>
            )}

            {view === 'links' && (
                <div>
                    <b>Create Link</b>
                    <form onSubmit={handleShorten} style={{ marginBottom: '20px', backgroundColor: '#eee', padding: '10px' }}>
                        <table>
                            <tbody>
                                <tr>
                                    <td>URL:</td>
                                    <td><input type="url" value={longUrl} onChange={e => setLongUrl(e.target.value)} required style={{width: '300px'}} /></td>
                                </tr>
                                <tr>
                                    <td>Domain:</td>
                                    <td>
                                        <select value={selectedDomain} onChange={e => setSelectedDomain(e.target.value)}>
                                            {domains.map(d => <option key={d.hostname} value={d.hostname}>{d.hostname}</option>)}
                                        </select>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Custom Slug:</td>
                                    <td><input type="text" value={customSlug} onChange={e => setCustomSlug(e.target.value)} /></td>
                                </tr>
                                <tr>
                                    <td>Password:</td>
                                    <td><input type="password" value={linkPassword} onChange={e => setLinkPassword(e.target.value)} /></td>
                                </tr>
                                <tr>
                                    <td></td>
                                    <td><button type="submit">Shorten</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </form>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                        <b>Links ({processedLinks.length})</b>
                        <div>
                            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            {' '}Sort:{' '}
                            <select value={sortField} onChange={(e) => setSortField(e.target.value as any)}>
                                <option value="date">Date</option>
                                <option value="clicks">Clicks</option>
                                <option value="slug">Slug</option>
                            </select>
                            {' '}
                            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)}>
                                <option value="desc">Desc</option>
                                <option value="asc">Asc</option>
                            </select>
                            {' '}Per page:{' '}
                            <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}>
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                            </select>
                        </div>
                    </div>

                    <table style={{ width: '100%' }} border={0} cellPadding={3}>
                        <tbody>
                            <tr className="table-header">
                                <th>Slug</th>
                                <th>Destination</th>
                                <th>Clicks</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                            {paginatedLinks.map((link, i) => {
                                const fullUrl = `https://${link.hostname}/${link.slug}`;
                                return (
                                <tr key={link.slug} style={{ backgroundColor: i % 2 === 0 ? '#f6f6ef' : '#eee' }}>
                                    <td>
                                        <a href={fullUrl} target="_blank">{link.slug}</a> 
                                        {link.password ? ' (protected)' : ''}
                                    </td>
                                    <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.url}</td>
                                    <td align="center">{link.click_count}</td>
                                    <td align="center">{new Date(link.created_at).toLocaleDateString()}</td>
                                    <td align="center">
                                        <a href="#" onClick={(e) => {e.preventDefault(); copyToClipboard(fullUrl)}}>[copy]</a>{' '}
                                        <Link to={`/details/${link.slug}`}>[stats]</Link>{' '}
                                        <a href="#" onClick={(e) => {e.preventDefault(); handleDeleteLink(link.slug)}}>[delete]</a>
                                    </td>
                                </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    
                    {totalPages > 1 && (
                        <div style={{ marginTop: '10px' }}>
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</button>
                            {' '}Page {currentPage} of {totalPages}{' '}
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
                        </div>
                    )}
                </div>
            )}

            {view === 'pastes' && (
                <div>
                    <b>Create Paste</b>
                    <form onSubmit={handleCreatePaste} style={{ marginBottom: '20px', backgroundColor: '#eee', padding: '10px' }}>
                        <table>
                            <tbody>
                                <tr>
                                    <td valign="top">Content:</td>
                                    <td><textarea value={pasteContent} onChange={e => setPasteContent(e.target.value)} required style={{width: '400px', height: '100px', fontFamily: 'monospace'}} /></td>
                                </tr>
                                <tr>
                                    <td>Domain:</td>
                                    <td>
                                        <select value={pasteDomain} onChange={e => setPasteDomain(e.target.value)}>
                                            {domains.map(d => <option key={d.hostname} value={d.hostname}>{d.hostname}</option>)}
                                        </select>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Custom Slug:</td>
                                    <td><input type="text" value={pasteSlug} onChange={e => setPasteSlug(e.target.value)} /></td>
                                </tr>
                                <tr>
                                    <td>Password:</td>
                                    <td><input type="password" value={pastePassword} onChange={e => setPastePassword(e.target.value)} /></td>
                                </tr>
                                <tr>
                                    <td></td>
                                    <td><button type="submit">Create Paste</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </form>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                        <b>Pastes ({processedPastes.length})</b>
                        <div>
                            <input type="text" placeholder="Search..." value={pasteSearchQuery} onChange={(e) => setPasteSearchQuery(e.target.value)} />
                        </div>
                    </div>

                    <table style={{ width: '100%' }} border={0} cellPadding={3}>
                        <tbody>
                            <tr className="table-header">
                                <th>Slug</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                            {paginatedPastes.map((paste, i) => {
                                const fullUrl = `https://${paste.hostname}/p/${paste.slug}`;
                                return (
                                <tr key={paste.slug} style={{ backgroundColor: i % 2 === 0 ? '#f6f6ef' : '#eee' }}>
                                    <td><a href={fullUrl} target="_blank">{paste.slug}</a></td>
                                    <td align="center">
                                        {paste.isExpired ? 'Expired' : (paste.hasPassword ? 'Protected' : 'Live')}
                                    </td>
                                    <td align="center">{new Date(paste.createdAt).toLocaleString()}</td>
                                    <td align="center">
                                        <a href="#" onClick={(e) => {e.preventDefault(); copyToClipboard(fullUrl)}}>[copy]</a>{' '}
                                        <a href="#" onClick={(e) => {e.preventDefault(); handleDeletePaste(paste.slug)}}>[delete]</a>
                                    </td>
                                </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    
                    {pasteTotalPages > 1 && (
                        <div style={{ marginTop: '10px' }}>
                            <button disabled={pasteCurrentPage === 1} onClick={() => setPasteCurrentPage(p => p - 1)}>Prev</button>
                            {' '}Page {pasteCurrentPage} of {pasteTotalPages}{' '}
                            <button disabled={pasteCurrentPage === pasteTotalPages} onClick={() => setPasteCurrentPage(p => p + 1)}>Next</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
