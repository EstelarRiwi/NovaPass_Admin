import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays, MessageSquare,
  Users, ClipboardList, LogOut, Shield,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/events',    icon: CalendarDays,    label: 'Eventos' },
  { to: '/pqrs',      icon: MessageSquare,   label: 'PQRS' },
  { to: '/employees', icon: Users,           label: 'Empleados' },
  { to: '/audit',     icon: ClipboardList,   label: 'Auditoría' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0F0E18 0%, #0A0A0F 100%)',
      borderRight: '1px solid rgba(147, 51, 234, 0.15)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{
        padding: '1.5rem 1.25rem',
        borderBottom: '1px solid rgba(147, 51, 234, 0.12)',
      }}>
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1.5rem',
          color: 'var(--color-primary-light)',
          textShadow: '0 0 30px rgba(192, 132, 252, 0.4)',
          marginBottom: '0.25rem',
        }}>
          NovaPass
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          fontSize: '0.6875rem',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          <Shield size={11} />
          Panel Admin
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.625rem 0.875rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
              background: isActive ? 'rgba(147, 51, 234, 0.12)' : 'transparent',
              border: isActive ? '1px solid rgba(147, 51, 234, 0.25)' : '1px solid transparent',
              textDecoration: 'none',
              transition: 'all var(--transition-fast)',
            })}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div style={{
        padding: '1rem 0.75rem',
        borderTop: '1px solid rgba(147, 51, 234, 0.12)',
      }}>
        {user && (
          <div style={{
            padding: '0.625rem 0.875rem',
            marginBottom: '0.5rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255,255,255,0.03)',
          }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.3 }}>
              {user.name}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>
              {user.email}
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="btn btn-ghost"
          style={{ width: '100%', justifyContent: 'flex-start', gap: '0.75rem', fontSize: '0.875rem' }}
        >
          <LogOut size={17} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
