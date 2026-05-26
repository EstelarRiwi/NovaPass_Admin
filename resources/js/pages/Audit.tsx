import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { DEMO_TOKEN } from '../context/AuthContext'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

interface AuditEntry {
  id: number
  user_name: string
  user_email: string
  action: string
  entity: string
  entity_id: string
  details?: string
  created_at: string
  ip?: string
}

const DEMO_AUDIT: AuditEntry[] = [
  { id: 1,  user_name: 'Admin Demo', user_email: 'admin@novapass.com', action: 'CREATE', entity: 'Event',    entity_id: '3', details: 'Creó evento Ballet Gala',           created_at: '2026-05-25T10:15:00', ip: '192.168.1.10' },
  { id: 2,  user_name: 'Admin Demo', user_email: 'admin@novapass.com', action: 'UPDATE', entity: 'Event',    entity_id: '1', details: 'Actualizó precio categoría VIP',    created_at: '2026-05-25T09:42:00', ip: '192.168.1.10' },
  { id: 3,  user_name: 'Admin Demo', user_email: 'admin@novapass.com', action: 'RESPOND', entity: 'PQRS',   entity_id: '3', details: 'Respondió queja de María Torres',    created_at: '2026-05-24T16:30:00', ip: '192.168.1.10' },
  { id: 4,  user_name: 'Admin Demo', user_email: 'admin@novapass.com', action: 'CREATE', entity: 'Employee', entity_id: '2', details: 'Creó empleado Tomás Scanner',       created_at: '2026-05-23T11:00:00', ip: '192.168.1.10' },
  { id: 5,  user_name: 'Admin Demo', user_email: 'admin@novapass.com', action: 'DELETE', entity: 'Event',    entity_id: '5', details: 'Canceló evento Feria de Verano',    created_at: '2026-05-22T14:20:00', ip: '192.168.1.10' },
  { id: 6,  user_name: 'Admin Demo', user_email: 'admin@novapass.com', action: 'UPDATE', entity: 'Employee', entity_id: '3', details: 'Desactivó empleado Paula Dual',     created_at: '2026-05-21T08:55:00', ip: '192.168.1.10' },
  { id: 7,  user_name: 'Admin Demo', user_email: 'admin@novapass.com', action: 'CLOSE',  entity: 'PQRS',    entity_id: '4', details: 'Cerró reclamo de Carlos Ruiz',       created_at: '2026-05-20T17:10:00', ip: '192.168.1.10' },
  { id: 8,  user_name: 'Admin Demo', user_email: 'admin@novapass.com', action: 'CREATE', entity: 'Event',    entity_id: '2', details: 'Creó evento Rock Clásico',          created_at: '2026-05-19T13:00:00', ip: '192.168.1.10' },
  { id: 9,  user_name: 'Admin Demo', user_email: 'admin@novapass.com', action: 'UPDATE', entity: 'Event',    entity_id: '2', details: 'Publicó evento Rock Clásico',       created_at: '2026-05-19T13:30:00', ip: '192.168.1.10' },
  { id: 10, user_name: 'Admin Demo', user_email: 'admin@novapass.com', action: 'CREATE', entity: 'Employee', entity_id: '1', details: 'Creó empleado Sofía Vendedora',     created_at: '2026-05-18T10:00:00', ip: '192.168.1.10' },
  { id: 11, user_name: 'Admin Demo', user_email: 'admin@novapass.com', action: 'RESPOND', entity: 'PQRS',   entity_id: '2', details: 'Inició proceso reclamo Luis Martínez', created_at: '2026-05-17T15:45:00', ip: '192.168.1.10' },
  { id: 12, user_name: 'Admin Demo', user_email: 'admin@novapass.com', action: 'UPDATE', entity: 'Employee', entity_id: '1', details: 'Asignó portal taquilla a Sofía',    created_at: '2026-05-16T09:20:00', ip: '192.168.1.10' },
]

const isDemo = () => localStorage.getItem('token') === DEMO_TOKEN

const ACTION_BADGE: Record<string, string> = {
  CREATE: 'badge-success',
  UPDATE: 'badge-primary',
  DELETE: 'badge-error',
  RESPOND: 'badge-warning',
  CLOSE: 'badge-muted',
}

const PAGE_SIZE = 8

export default function Audit() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)
  const [search, setSearch]   = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      if (isDemo()) { setEntries(DEMO_AUDIT); setLoading(false); return }
      try {
        const data = await api.get<AuditEntry[]>('/reports/audit')
        setEntries(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = entries.filter(e => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      e.user_name.toLowerCase().includes(q) ||
      e.action.toLowerCase().includes(q) ||
      e.entity.toLowerCase().includes(q) ||
      (e.details ?? '').toLowerCase().includes(q)
    )
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageEntries = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const fmt = (d: string) => new Date(d).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })

  const handleSearch = (q: string) => { setSearch(q); setPage(1) }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Auditoría</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Registro de acciones administrativas</p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Buscar en log..."
            style={{ width: 220, paddingLeft: '2.25rem' }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 'var(--radius-md)' }} />)}
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Usuario</th>
                  <th>Acción</th>
                  <th>Entidad</th>
                  <th>Detalle</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {pageEntries.map(entry => (
                  <tr key={entry.id}>
                    <td style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{fmt(entry.created_at)}</td>
                    <td>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{entry.user_name}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>{entry.user_email}</div>
                    </td>
                    <td><span className={`badge ${ACTION_BADGE[entry.action] ?? 'badge-muted'}`}>{entry.action}</span></td>
                    <td style={{ fontSize: '0.8125rem' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>{entry.entity}</span>
                      {entry.entity_id && <span style={{ color: 'var(--color-primary-light)', marginLeft: '0.25rem' }}>#{entry.entity_id}</span>}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', maxWidth: 220 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        {entry.details ?? '—'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{entry.ip ?? '—'}</td>
                  </tr>
                ))}
                {pageEntries.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>Sin resultados</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              {filtered.length} registros · página {page} de {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-outline btn-icon btn-sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={15} />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  className={`btn btn-sm ${page === i + 1 ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setPage(i + 1)}
                  style={{ minWidth: 34 }}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="btn btn-outline btn-icon btn-sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
