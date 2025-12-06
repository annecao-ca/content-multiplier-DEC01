'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast, SkeletonList, ConfirmModal } from '../../components/ui'

// API URL - backend running on port 3001
const API_URL = 'http://localhost:3001';

export default function BriefDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [brief, setBrief] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [initialLoading, setInitialLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const toast = useToast()

    async function loadBrief() {
        try {
            const r = await fetch(`${API_URL}/api/briefs/${params.id}`)
            if (!r.ok) {
                throw new Error('Failed to load brief')
            }
            const data = await r.json()
            setBrief(data)
        } catch (err: any) {
            console.error('Error loading brief:', err)
            setError(err.message || 'Failed to load brief')
            toast.error('Failed to load brief', err.message)
        } finally {
            setInitialLoading(false)
        }
    }

    async function approveBrief() {
        setLoading(true)
        setError(null)
        try {
            const r = await fetch(`${API_URL}/api/briefs/${params.id}/approve`, { method: 'POST' })
            if (!r.ok) {
                throw new Error('Failed to approve brief')
            }
            toast.success('Brief approved successfully!')
            router.push(`/packs/new?brief_id=${params.id}`)
        } catch (err: any) {
            console.error('Error approving brief:', err)
            const errorMsg = err.message || 'Failed to approve brief'
            setError(errorMsg)
            toast.error('Failed to approve brief', errorMsg)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadBrief() }, [])

    if (error) {
        return (
            <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                <Link href="/briefs" style={{ color: '#3b82f6', textDecoration: 'none' }}>← Back to Briefs</Link>
                <div style={{
                    marginTop: '2rem',
                    background: '#fee2e2',
                    border: '1px solid #ef4444',
                    borderRadius: '8px',
                    padding: '2rem',
                    color: '#991b1b'
                }}>
                    <h2 style={{ margin: '0 0 1rem 0' }}>❌ Error Loading Brief</h2>
                    <p>{error}</p>
                </div>
            </main>
        )
    }

    if (initialLoading) {
        return (
            <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                <SkeletonList type="briefs" count={1} />
            </main>
        )
    }

    if (!brief) {
        return null
    }

    return (
        <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <Link href="/briefs" style={{ 
                color: '#3b82f6', 
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '600'
            }}>← Back to Briefs</Link>
            
            <h1 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Brief Details</h1>

            <div style={{ marginTop: '2rem' }}>
                <h2>Key Points</h2>
                <ul>{brief.key_points?.map((p: string, i: number) => <li key={i}>{p}</li>)}</ul>

                <h2>Outline</h2>
                <ol>{brief.outline?.map((section: any, i: number) => (
                    <li key={i}>
                        <b>{section.h2 || section}</b>
                        {section.bullets && (
                            <ul>
                                {section.bullets.map((bullet: string, j: number) => (
                                    <li key={j}>{bullet}</li>
                                ))}
                            </ul>
                        )}
                    </li>
                ))}</ol>

                <h2>Claims ({brief.claims_ledger?.length || 0})</h2>
                <ul>
                    {brief.claims_ledger?.map((c: any, i: number) => (
                        <li key={i}>
                            {c.claim}
                            <small style={{ marginLeft: '1rem' }}>
                                [{c.sources?.map((s: any) => s.url).join(', ')}]
                            </small>
                        </li>
                    ))}
                </ul>

                <button
                    style={{ marginTop: '2rem', padding: '0.5rem 1rem', cursor: 'pointer' }}
                    onClick={approveBrief}
                    disabled={loading}
                >
                    {loading ? 'Approving...' : 'Approve & Create Draft →'}
                </button>
            </div>
        </main>
    )
}

