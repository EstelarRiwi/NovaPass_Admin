import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { MessageSquare, Send, X, Filter } from 'lucide-react'

interface PqrsResponse {
  id: string
  message: string
  adminId: string
  createdAt: string
}

interface PqrsItem {
  id: string
  userName?: string
  userEmail?: string
  type: 'question' | 'complaint' | 'claim' | 'suggestion'
  message: string
  status: 'pending' | 'in_progress' | 'resolved' | 'closed'
  createdAt: string
  responses?: PqrsResponse[]
  latestResponse?: string
}

const TYPE_LABEL: Record<string, string> = { question: 'Petición', complaint: 'Queja', claim: 'Reclamo', suggestion: 'Sugerencia' }
const TYPE_BADGE: Record<string, string> = { question: 'badge-primary', complaint: 'badge-error', claim: 'badge-warning', suggestion: 'badge-success' }
const STATUS_LABEL: Record<string, string> = { pending: 'Pendiente', in_progress: 'En proceso', resolved: 'Resuelto', closed: 'Cerrado' }
const STATUS_BADGE: Record<string, string> = { pending: 'badge-error', in_progress: 'badge-warning', resolved: 'badge-success', closed: 'badge-muted' }

export default function PQRS() {
  const [items, setItems]       = useState<PqrsItem[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState<string>('all')
  const [selected, setSelected] = useState<PqrsItem | null>(null)
  const [response, setResponse] = useState('')
  const [newStatus, setNewStatus] = useState<string>('')
  const [saving, setSaving]     = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get<PqrsItem[]>('/pqrs')
      setItems(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openItem = (item: PqrsItem) => {
    setSelected(item)
    const lastResp = item.responses?.length ? item.responses[item.responses.length - 1].message : (item.latestResponse ?? '')
    setResponse(lastResp)
    setNewStatus(item.status)
  }

  const sendResponse = async () => {
    if (!selected) return
    setSaving(true)
    try {
      if (newStatus === 'closed') {
        await api.post(`/pqrs/${selected.id}/close`, {})
      } else {
        await api.post(`/pqrs/${selected.id}/respond`, { message: response, newStatus })
      }
      await load()
      setSelected(null)
    } finally {
      setSaving(false)
    }
  }

  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter)

  const fmt = (d: string) => new Date(d).toLocaleDateString('es-CO', { dateStyle: 'medium' as const })

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>PQRS</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Peticiones, quejas, reclamos y sugerencias</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={14} style={{ color: 'var(--color-text-muted)' }} />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ width: 'auto', padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}
          >
            <option value="all">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="in_progress">En proceso</option>
            <option value="resolved">Resueltos</option>
            <option value="closed">Cerrados</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 'var(--radius-md)' }} />)}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Tipo</th>
                <th>Mensaje</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{item.userName ?? '—'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.userEmail ?? item.id.slice(0, 8)}</div>
                  </td>
                  <td><span className={`badge ${TYPE_BADGE[item.type] ?? 'badge-muted'}`}>{TYPE_LABEL[item.type] ?? item.type}</span></td>
                  <td style={{ maxWidth: 280 }}>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.message}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{fmt(item.createdAt)}</td>
                  <td><span className={`badge ${STATUS_BADGE[item.status] ?? 'badge-muted'}`}>{STATUS_LABEL[item.status] ?? item.status}</span></td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => openItem(item)}>
                      <MessageSquare size={13} /> Ver
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>Sin PQRS en esta categoría</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1.5rem' }}>
          <div className="card slide-in-up" style={{ maxWidth: 500, width: '100%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span className={`badge ${TYPE_BADGE[selected.type] ?? 'badge-muted'}`}>{TYPE_LABEL[selected.type] ?? selected.type}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{fmt(selected.createdAt)}</span>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelected(null)}><X size={18} /></button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              {selected.userName && <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{selected.userName}</div>}
              {selected.userEmail && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.875rem' }}>{selected.userEmail}</div>}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.875rem 1rem',
                fontSize: '0.875rem',
                color: 'var(--color-text)',
                lineHeight: 1.6,
              }}>
                {selected.message}
              </div>

              {/* Previous responses */}
              {selected.responses && selected.responses.length > 0 && (
                <div style={{ marginTop: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>Respuestas anteriores:</div>
                  {selected.responses.map(r => (
                    <div key={r.id} style={{
                      background: 'rgba(147,51,234,0.06)',
                      border: '1px solid rgba(147,51,234,0.15)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.625rem 0.875rem',
                      fontSize: '0.8125rem',
                      marginBottom: '0.375rem',
                    }}>
                      {r.message}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Nueva respuesta</label>
              <textarea
                value={response}
                onChange={e => setResponse(e.target.value)}
                rows={3}
                placeholder="Escribe tu respuesta aquí..."
                disabled={selected.status === 'closed'}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label>Cambiar estado</label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)} disabled={selected.status === 'closed'}>
                <option value="pending">Pendiente</option>
                <option value="in_progress">En proceso</option>
                <option value="resolved">Resuelto</option>
                <option value="closed">Cerrado</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setSelected(null)}>Cancelar</button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={sendResponse}
                disabled={saving || selected.status === 'closed'}
              >
                {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <Send size={14} />}
                {saving ? 'Enviando...' : 'Guardar respuesta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
