import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import { api } from '../api/client'
import { TrendingUp, Users, Ticket, DollarSign } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler)

interface SalesData  { labels: string[]; values: number[] }
interface OccupancyRow { event: string; total: number; sold: number }
interface UserData   { labels: string[]; values: number[] }

const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1A1828', titleColor: '#F3F0FF', bodyColor: '#C084FC', borderColor: 'rgba(147,51,234,0.3)', borderWidth: 1 } },
  scales: {
    x: { grid: { color: 'rgba(147,51,234,0.07)' }, ticks: { color: '#7C7A99' } },
    y: { grid: { color: 'rgba(147,51,234,0.07)' }, ticks: { color: '#7C7A99' } },
  },
}

function mapSales(raw: any): SalesData | null {
  if (!raw) return null
  const items: any[] = Array.isArray(raw) ? raw : (raw.data ?? [])
  if (!items.length) return null
  return {
    labels: items.map((i: any) => i.month ?? i.label ?? i.date ?? String(i)),
    values: items.map((i: any) => i.total ?? i.value ?? i.amount ?? 0),
  }
}

function mapOccupancy(raw: any): OccupancyRow[] | null {
  if (!raw) return null
  const items: any[] = Array.isArray(raw) ? raw : (raw.data ?? [])
  if (!items.length) return null
  return items.map((i: any) => ({
    event: i.eventTitle ?? i.event ?? '—',
    total: i.totalCapacity ?? i.total ?? 0,
    sold:  i.totalSold ?? i.sold ?? 0,
  }))
}

function mapUsers(raw: any): UserData | null {
  if (!raw) return null
  const items: any[] = Array.isArray(raw) ? raw : (raw.data ?? [])
  if (!items.length) return null
  return {
    labels: items.map((i: any) => i.month ?? i.label ?? i.date ?? String(i)),
    values: items.map((i: any) => i.count ?? i.value ?? i.total ?? 0),
  }
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <div style={{
        width: 48, height: 48, borderRadius: 'var(--radius-md)',
        background: `${color}18`,
        border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{label}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{sub}</div>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [sales, setSales]     = useState<SalesData | null>(null)
  const [occ, setOcc]         = useState<OccupancyRow[] | null>(null)
  const [users, setUsers]     = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [rawSales, rawOcc, rawUsers] = await Promise.allSettled([
          api.get<any>('/reports/sales'),
          api.get<any>('/reports/occupancy'),
          api.get<any>('/reports/users'),
        ])
        if (rawSales.status === 'fulfilled') setSales(mapSales(rawSales.value))
        if (rawOcc.status === 'fulfilled')   setOcc(mapOccupancy(rawOcc.value))
        if (rawUsers.status === 'fulfilled') setUsers(mapUsers(rawUsers.value))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalSales   = sales ? sales.values.reduce((a, b) => a + b, 0) : 0
  const totalTickets = occ ? occ.reduce((a, o) => a + o.sold, 0) : 0
  const totalUsers   = users ? users.values.reduce((a, b) => a + b, 0) : 0

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Dashboard</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Resumen de operaciones de NovaPass</p>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 96, borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <StatCard icon={DollarSign} label="Ventas totales" value={totalSales ? `$${(totalSales / 1000000).toFixed(1)}M` : '—'} sub="Últimos 6 meses" color="#9333EA" />
          <StatCard icon={Ticket}     label="Boletas vendidas" value={totalTickets ? totalTickets.toLocaleString() : '—'} sub="Todos los eventos" color="#F59E0B" />
          <StatCard icon={Users}      label="Nuevos usuarios" value={totalUsers ? totalUsers.toLocaleString() : '—'} sub="Últimos 6 meses" color="#22C55E" />
          <StatCard icon={TrendingUp} label="Ocupación media" value={occ && occ.length ? `${Math.round(occ.reduce((a, o) => a + o.sold / o.total, 0) / occ.length * 100)}%` : '—'} sub="Promedio eventos" color="#60A5FA" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>Ventas mensuales</h3>
          <div style={{ height: 220 }}>
            {loading ? <div className="skeleton" style={{ height: '100%' }} /> : sales ? (
              <Bar
                data={{
                  labels: sales.labels,
                  datasets: [{
                    data: sales.values,
                    backgroundColor: 'rgba(147, 51, 234, 0.5)',
                    borderColor: 'rgba(192, 132, 252, 0.8)',
                    borderWidth: 1,
                    borderRadius: 6,
                  }],
                }}
                options={CHART_OPTS as any}
              />
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                Sin datos de ventas
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>Registro de usuarios</h3>
          <div style={{ height: 220 }}>
            {loading ? <div className="skeleton" style={{ height: '100%' }} /> : users ? (
              <Line
                data={{
                  labels: users.labels,
                  datasets: [{
                    data: users.values,
                    borderColor: '#F59E0B',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#F59E0B',
                    pointRadius: 4,
                  }],
                }}
                options={CHART_OPTS as any}
              />
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                Sin datos de usuarios
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(147,51,234,0.1)' }}>
          <h3 style={{ fontSize: '1rem' }}>Ocupación por evento</h3>
        </div>
        <div className="table-wrap" style={{ borderRadius: 0, border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Evento</th>
                <th>Capacidad</th>
                <th>Vendidas</th>
                <th>Ocupación</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4}><div className="skeleton" style={{ height: 20 }} /></td></tr>
              ) : occ && occ.length ? occ.map((row, i) => {
                const pct = row.total ? Math.round(row.sold / row.total * 100) : 0
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{row.event}</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{row.total}</td>
                    <td>{row.sold}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: pct >= 90 ? '#22C55E' : pct >= 60 ? '#F59E0B' : '#9333EA', borderRadius: 999 }} />
                        </div>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, minWidth: 36 }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              }) : (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>Sin datos de ocupación</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
