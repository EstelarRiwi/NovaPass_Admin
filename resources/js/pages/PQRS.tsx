import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { DEMO_TOKEN } from '../context/AuthContext'
import { MessageSquare, Send, X, Filter } from 'lucide-react'

interface PqrsItem {
  id: number
  user_name: string
  user_email: string
  type: 'peticion' | 'queja' | 'reclamo' | 'sugerencia'
  message: string
  status: 'pendiente' | 'en_proceso' | 'resuelto' | 'cerrado'
  created_at: string
  response?: string
}

const DEMO_PQRS: PqrsItem[] = [
  { id: 1, user_name: 'Ana Gómez', user_email: 'ana@example.com', type: 'queja', message: 'El proceso de compra falló dos veces antes de completarse.', status: 'pendiente', created_at: '2026-05-20T14:30:00' },
  { id: 2, user_name: 'Luis Martínez', user_email: 'luis@example.com', type: 'reclamo', message: 'No recibí mis boletas por correo después de pagar.', status: 'en_proceso', created_at: '2026-05-22T09:15:00' },
  { id: 3, user_name: 'María Torres', user_email: 'maria@example.com', type: 'sugerencia', message: 'Sería útil tener filtros por género musical en los eventos.', status: 'resuelto', created_at: '2026-05-18T16:45:00', response: 'Gracias por la sugerencia, está en nuestro roadmap.' },
  { id: 4, user_name: 'Carlos Ruiz', user_email: 'carlos@example.com', type: 'peticion', message: 'Solicito reembolso por evento cancelado el 15 de mayo.', status: 'cerrado', created_at: '2026-05-16T11:00:00', response: 'Reembolso procesado el 17 de mayo.' },
]

const isDemo = () => localStorage.getItem('token') === DEMO_TOKEN

const TYPE_LABEL: Record<string, string> = { peticion: 'Petición', queja: 'Queja', reclamo: 'Reclamo', sugerencia: 'Sugerencia' }
const TYPE_BADGE: Record<string, string> = { peticion: 'badge-primary', queja: 'badge-error', reclamo: 'badge-warning', sugerencia: 'badge-success' }
const STATUS_LABEL: Record<string, string> = { pendiente: 'Pendiente', en_proceso: 'En proceso', resuelto: 'Resuelto', cerrado: 'Cerrado' }
const STATUS_BADGE: Record<string, string> = { pendiente: 'badge-error', en_proceso: 'badge-warning', resuelto: 'badge-success', cerrado: 'badge-muted' }

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
    if (isDemo()) { setItems(DEMO_PQRS); setLoading(false); return }
    try {
      const data = await api.get<PqrsItem[]>('/pqrs')
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openItem = (item: PqrsItem) => {
    setSelected(item)
    setResponse(item.response ?? '')
    setNewStatus(item.status)
  }

  const sendResponse = async () => {
    if (!selected) return
    setSaving(true)
    try {
      if (isDemo()) {
        const updated = { ...selected, response, status: newStatus as PqrsItem['status'] }
        setItems(it => it.map(i => i.id === selected.id ? updated : i))
        setSelected(null)
        return
      }
      if (newStatus === 'cerrado') {
        await api.put(`/pqrs/${selected.id}/close`)
      } else {
        await api.put(`/pqrs/${selected.id}/respond`, { message: response, status: newStatus })
      }
      await load()
      setSelected(null)
    } finally {
      setSaving(false)
    }
  }

  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter)

  const fmt = (d: string) => new Date(d).toLocaleDateString('es-CO', { dateStyle: 'medium' })

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
            <option value="pendiente">Pendientes</option>
            <option value="en_proceso">En proceso</option>
            <option value="resuelto">Resueltos</option>
            <option value="cerrado">Cerrados</option>
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
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{item.user_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.user_email}</div>
                  </td>
                  <td><span className={`badge ${TYPE_BADGE[item.type]}`}>{TYPE_LABEL[item.type]}</span></td>
                  <td style={{ maxWidth: 280 }}>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.message}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{fmt(item.created_at)}</td>
                  <td><span className={`badge ${STATUS_BADGE[item.status]}`}>{STATUS_LABEL[item.status]}</span></td>
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
                <span className={`badge ${TYPE_BADGE[selected.type]}`}>{TYPE_LABEL[selected.type]}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{fmt(selected.created_at)}</span>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelected(null)}><X size={18} /></button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{selected.user_name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.875rem' }}>{selected.user_email}</div>
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
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Respuesta</label>
              <textarea
                value={response}
                onChange={e => setResponse(e.target.value)}
                rows={4}
                placeholder="Escribe tu respuesta aquí..."
                disabled={selected.status === 'cerrado'}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label>Cambiar estado</label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)} disabled={selected.status === 'cerrado'}>
                <option value="pendiente">Pendiente</option>
                <option value="en_proceso">En proceso</option>
                <option value="resuelto">Resuelto</option>
                <option value="cerrado">Cerrado</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setSelected(null)}>Cancelar</button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={sendResponse}
                disabled={saving || selected.status === 'cerrado'}
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
