import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Plus, Pencil, Trash2, X, Calendar, MapPin, Tag, Ban } from 'lucide-react'

interface Category {
  id: number
  name: string
  price: number
  capacity: number
}

interface Event {
  id: number
  title: string
  description: string
  date: string
  venue: string
  status: 'active' | 'published' | 'draft' | 'cancelled'
  categories: Category[]
  image_url?: string
}

interface EventsResponse {
  events: Event[]
  total: number
  page: number
  perPage: number
}

const STATUS_BADGE: Record<string, string> = {
  active: 'badge-success',
  published: 'badge-success',
  draft: 'badge-warning',
  cancelled: 'badge-error',
}
const STATUS_LABEL: Record<string, string> = {
  active: 'Activo',
  published: 'Publicado',
  draft: 'Borrador',
  cancelled: 'Cancelado',
}

const EMPTY: Omit<Event, 'id'> = {
  title: '', description: '', date: '', venue: '', status: 'draft',
  categories: [{ id: Date.now(), name: '', price: 0, capacity: 0 }],
}

export default function Events() {
  const [events, setEvents]   = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState<{ mode: 'create' | 'edit'; data: Partial<Event> } | null>(null)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [confirmDel, setConfirmDel] = useState<number | null>(null)
  const [confirmClose, setConfirmClose] = useState<Event | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const resp = await api.get<EventsResponse | Event[]>('/events')
      const list = Array.isArray(resp) ? resp : (resp as EventsResponse).events ?? []
      setEvents(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => setModal({ mode: 'create', data: { ...EMPTY, categories: [{ id: Date.now(), name: '', price: 0, capacity: 0 }] } })
  const openEdit   = (ev: Event) => setModal({ mode: 'edit', data: { ...ev } })

  const updateField = (key: string, value: any) =>
    setModal(m => m ? { ...m, data: { ...m.data, [key]: value } } : m)

  const updateCat = (idx: number, key: keyof Category, value: any) =>
    setModal(m => {
      if (!m) return m
      const cats = [...(m.data.categories ?? [])]
      cats[idx] = { ...cats[idx], [key]: value }
      return { ...m, data: { ...m.data, categories: cats } }
    })

  const addCat = () =>
    setModal(m => m ? { ...m, data: { ...m.data, categories: [...(m.data.categories ?? []), { id: Date.now(), name: '', price: 0, capacity: 0 }] } } : m)

  const removeCat = (idx: number) =>
    setModal(m => {
      if (!m) return m
      const cats = (m.data.categories ?? []).filter((_, i) => i !== idx)
      return { ...m, data: { ...m.data, categories: cats } }
    })

  const save = async () => {
    if (!modal) return
    setSaving(true); setError('')
    try {
      const payload = { ...modal.data }
      if (modal.mode === 'create') {
        const resp = await api.post<any>('/events', payload)
        const created: Event = resp.events ? resp.events[0] : resp
        setEvents(ev => [...ev, created])
      } else {
        const resp = await api.put<any>(`/events/${modal.data.id}`, payload)
        const updated: Event = resp.events ? resp.events[0] : resp
        setEvents(ev => ev.map(e => e.id === updated.id ? updated : e))
      }
      setModal(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const deleteEvent = async (id: number) => {
    try {
      await api.delete(`/events/${id}`)
      setEvents(ev => ev.filter(e => e.id !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al eliminar')
    }
    setConfirmDel(null)
  }

  const closeEvent = async (ev: Event) => {
    try {
      const resp = await api.put<any>(`/events/${ev.id}`, { ...ev, status: 'cancelled' })
      const updated: Event = resp.events ? resp.events[0] : resp
      setEvents(evs => evs.map(e => e.id === updated.id ? updated : e))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al cancelar evento')
    }
    setConfirmClose(null)
  }

  const fmt = (d: string) => new Date(d).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
  const fmtPrice = (n: number) => `$${n.toLocaleString('es-CO')}`

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Eventos</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Gestión de eventos y categorías</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Nuevo evento
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 88, borderRadius: 'var(--radius-md)' }} />)}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Evento</th>
                <th>Fecha</th>
                <th>Lugar</th>
                <th>Categorías</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev.id}>
                  <td style={{ fontWeight: 600 }}>{ev.title}</td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Calendar size={13} />{fmt(ev.date)}
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <MapPin size={13} />{ev.venue}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {ev.categories.map((c, i) => (
                        <span key={c.id ?? i} className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                          {c.name} · {fmtPrice(c.price)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td><span className={`badge ${STATUS_BADGE[ev.status] ?? 'badge-muted'}`}>{STATUS_LABEL[ev.status] ?? ev.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(ev)} title="Editar">
                        <Pencil size={14} />
                      </button>
                      {ev.status !== 'cancelled' && (
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setConfirmClose(ev)} title="Cancelar evento" style={{ color: 'var(--color-warning)' }}>
                          <Ban size={14} />
                        </button>
                      )}
                      <button className="btn btn-danger btn-icon btn-sm" onClick={() => setConfirmDel(ev.id)} title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>Sin eventos registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDel !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1.5rem' }}>
          <div className="card" style={{ maxWidth: 380, width: '100%' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>¿Eliminar evento?</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setConfirmDel(null)}>Cancelar</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => deleteEvent(confirmDel)}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Close/cancel confirm */}
      {confirmClose !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1.5rem' }}>
          <div className="card" style={{ maxWidth: 380, width: '100%' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>¿Cancelar evento?</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              El evento <strong>{confirmClose.title}</strong> pasará a estado Cancelado. No se elimina.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setConfirmClose(null)}>Volver</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => closeEvent(confirmClose)}>Cancelar evento</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal create/edit */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 200, padding: '2rem 1.5rem', overflowY: 'auto' }}>
          <div className="card slide-in-up" style={{ maxWidth: 540, width: '100%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3>{modal.mode === 'create' ? 'Nuevo evento' : 'Editar evento'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(null)}><X size={18} /></button>
            </div>

            {error && <div className="alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Nombre del evento</label>
                <input value={modal.data.title ?? ''} onChange={e => updateField('title', e.target.value)} placeholder="Ej. Noche de Jazz" />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={modal.data.description ?? ''}
                  onChange={e => updateField('description', e.target.value)}
                  placeholder="Descripción del evento..."
                  rows={2}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Fecha y hora</label>
                  <input type="datetime-local" value={modal.data.date ?? ''} onChange={e => updateField('date', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select value={modal.data.status ?? 'draft'} onChange={e => updateField('status', e.target.value)}>
                    <option value="draft">Borrador</option>
                    <option value="active">Activo</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Lugar / Venue</label>
                <input value={modal.data.venue ?? ''} onChange={e => updateField('venue', e.target.value)} placeholder="Teatro Metropolitano" />
              </div>

              {/* Categories */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <label style={{ margin: 0 }}><Tag size={13} style={{ display: 'inline', marginRight: 4 }} />Categorías</label>
                  <button className="btn btn-ghost btn-sm" onClick={addCat}><Plus size={13} /> Agregar</button>
                </div>
                {(modal.data.categories ?? []).map((cat, idx) => (
                  <div key={cat.id ?? idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      {idx === 0 && <label>Nombre</label>}
                      <input value={cat.name} onChange={e => updateCat(idx, 'name', e.target.value)} placeholder="General" />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      {idx === 0 && <label>Precio</label>}
                      <input type="number" value={cat.price} onChange={e => updateCat(idx, 'price', +e.target.value)} placeholder="80000" />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      {idx === 0 && <label>Capacidad</label>}
                      <input type="number" value={cat.capacity} onChange={e => updateCat(idx, 'capacity', +e.target.value)} placeholder="300" />
                    </div>
                    <button className="btn btn-danger btn-icon btn-sm" style={{ alignSelf: 'flex-end' }} onClick={() => removeCat(idx)} disabled={(modal.data.categories?.length ?? 0) <= 1}>
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving}>
                {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : null}
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
