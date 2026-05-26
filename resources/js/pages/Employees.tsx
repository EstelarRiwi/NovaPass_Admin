import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { DEMO_TOKEN } from '../context/AuthContext'
import { Plus, UserX, UserCheck, X, Shield } from 'lucide-react'

interface Employee {
  id: string
  name: string
  email: string
  permissions: ('taquilla' | 'acceso')[]
  active: boolean
  created_at: string
}

const DEMO_EMP: Employee[] = [
  { id: '1', name: 'Sofía Vendedora', email: 'sofia@novapass.com', permissions: ['taquilla'], active: true, created_at: '2026-03-10' },
  { id: '2', name: 'Tomás Scanner', email: 'tomas@novapass.com', permissions: ['acceso'], active: true, created_at: '2026-03-15' },
  { id: '3', name: 'Paula Dual', email: 'paula@novapass.com', permissions: ['taquilla', 'acceso'], active: false, created_at: '2026-02-01' },
]

const isDemo = () => localStorage.getItem('token') === DEMO_TOKEN

const PERM_LABEL: Record<string, string> = { taquilla: 'Taquilla', acceso: 'Acceso' }
const PERM_COLOR: Record<string, string> = { taquilla: 'badge-warning', acceso: 'badge-primary' }

const EMPTY = { name: '', email: '', password: '', permissions: [] as ('taquilla' | 'acceso')[] }

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState<typeof EMPTY | null>(null)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [permModal, setPermModal] = useState<Employee | null>(null)
  const [permEdit, setPermEdit]   = useState<('taquilla' | 'acceso')[]>([])

  const load = async () => {
    setLoading(true)
    if (isDemo()) { setEmployees(DEMO_EMP); setLoading(false); return }
    try {
      const data = await api.get<Employee[]>('/users/employees')
      setEmployees(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    if (!modal) return
    setSaving(true); setError('')
    try {
      if (isDemo()) {
        const newEmp: Employee = { id: String(Date.now()), ...modal, active: true, created_at: new Date().toISOString().slice(0, 10) }
        setEmployees(e => [...e, newEmp]); setModal(null); return
      }
      const created = await api.post<Employee>('/users/employees', modal)
      setEmployees(e => [...e, created])
      setModal(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al crear empleado')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (emp: Employee) => {
    if (isDemo()) {
      setEmployees(e => e.map(x => x.id === emp.id ? { ...x, active: !x.active } : x))
      return
    }
    try {
      if (emp.active) {
        await api.delete(`/users/employees/${emp.id}`)
      } else {
        await api.put(`/users/employees/${emp.id}/permissions`, { permissions: emp.permissions })
      }
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error')
    }
  }

  const openPermModal = (emp: Employee) => {
    setPermModal(emp)
    setPermEdit([...emp.permissions])
  }

  const savePerms = async () => {
    if (!permModal) return
    setSaving(true)
    try {
      if (isDemo()) {
        setEmployees(e => e.map(x => x.id === permModal.id ? { ...x, permissions: permEdit } : x))
        setPermModal(null); return
      }
      await api.put(`/users/employees/${permModal.id}/permissions`, { portals: permEdit })
      await load()
      setPermModal(null)
    } finally {
      setSaving(false)
    }
  }

  const togglePerm = (p: 'taquilla' | 'acceso') =>
    setPermEdit(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])

  const fmt = (d: string) => new Date(d).toLocaleDateString('es-CO', { dateStyle: 'medium' })

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Empleados</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Gestión de vendedores y escáneres</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ ...EMPTY })}>
          <Plus size={16} /> Nuevo empleado
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 'var(--radius-md)' }} />)}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Portales</th>
                <th>Alta</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id} style={{ opacity: emp.active ? 1 : 0.5 }}>
                  <td style={{ fontWeight: 600 }}>{emp.name}</td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{emp.email}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {emp.permissions.length === 0
                        ? <span className="badge badge-muted">Sin portales</span>
                        : emp.permissions.map(p => <span key={p} className={`badge ${PERM_COLOR[p]}`}>{PERM_LABEL[p]}</span>)
                      }
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{fmt(emp.created_at)}</td>
                  <td>
                    <span className={`badge ${emp.active ? 'badge-success' : 'badge-muted'}`}>
                      {emp.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openPermModal(emp)} title="Permisos">
                        <Shield size={14} />
                      </button>
                      <button
                        className={`btn btn-icon btn-sm ${emp.active ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => toggleActive(emp)}
                        title={emp.active ? 'Desactivar' : 'Activar'}
                      >
                        {emp.active ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>Sin empleados registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1.5rem' }}>
          <div className="card slide-in-up" style={{ maxWidth: 440, width: '100%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3>Nuevo empleado</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            {error && <div className="alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Nombre completo</label>
                <input value={modal.name} onChange={e => setModal(m => m ? { ...m, name: e.target.value } : m)} placeholder="Sofía López" />
              </div>
              <div className="form-group">
                <label>Correo electrónico</label>
                <input type="email" value={modal.email} onChange={e => setModal(m => m ? { ...m, email: e.target.value } : m)} placeholder="sofia@novapass.com" />
              </div>
              <div className="form-group">
                <label>Contraseña temporal</label>
                <input type="password" value={modal.password} onChange={e => setModal(m => m ? { ...m, password: e.target.value } : m)} placeholder="••••••••" />
              </div>
              <div>
                <label style={{ marginBottom: '0.5rem' }}>Portales de acceso</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {(['taquilla', 'acceso'] as const).map(p => (
                    <label key={p} style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      cursor: 'pointer', margin: 0, color: 'var(--color-text)',
                    }}>
                      <input
                        type="checkbox"
                        checked={modal.permissions.includes(p)}
                        onChange={() => setModal(m => m ? { ...m, permissions: m.permissions.includes(p) ? m.permissions.filter(x => x !== p) : [...m.permissions, p] } : m)}
                        style={{ width: 'auto', padding: 0 }}
                      />
                      {PERM_LABEL[p]}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={create} disabled={saving}>
                {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <Plus size={15} />}
                {saving ? 'Creando...' : 'Crear empleado'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions modal */}
      {permModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1.5rem' }}>
          <div className="card slide-in-up" style={{ maxWidth: 360, width: '100%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3>Permisos — {permModal.name}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setPermModal(null)}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {(['taquilla', 'acceso'] as const).map(p => (
                <label key={p} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  border: `1px solid ${permEdit.includes(p) ? 'rgba(147,51,234,0.35)' : 'var(--glass-border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  background: permEdit.includes(p) ? 'rgba(147,51,234,0.08)' : 'transparent',
                  cursor: 'pointer', margin: 0,
                  transition: 'all var(--transition-fast)',
                }}>
                  <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>{PERM_LABEL[p]}</span>
                  <input
                    type="checkbox"
                    checked={permEdit.includes(p)}
                    onChange={() => togglePerm(p)}
                    style={{ width: 'auto', padding: 0 }}
                  />
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setPermModal(null)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={savePerms} disabled={saving}>
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
