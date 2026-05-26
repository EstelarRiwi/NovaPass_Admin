import { createContext, useContext, useState } from 'react'
import { api } from '../api/client'

interface User {
  id: string
  name: string
  email: string
  role: string
  permissions?: string[]
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  demoLogin: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const DEMO_TOKEN = 'demo_admin_token_2026'

const DEMO_USER: User = {
  id: 'demo',
  name: 'Admin Demo',
  email: 'admin@novapass.com',
  role: 'admin',
  permissions: ['taquilla', 'acceso'],
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user')
    return stored ? (JSON.parse(stored) as User) : null
  })
  const [loading, setLoading] = useState(false)

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password })
      if (res.user.role !== 'admin') {
        throw new Error('Acceso solo para administradores')
      }
      api.setToken(res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      setUser(res.user)
    } finally {
      setLoading(false)
    }
  }

  const demoLogin = () => {
    localStorage.setItem('token', DEMO_TOKEN)
    localStorage.setItem('user', JSON.stringify(DEMO_USER))
    setUser(DEMO_USER)
  }

  const logout = () => {
    api.setToken(null)
    localStorage.removeItem('user')
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, demoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
