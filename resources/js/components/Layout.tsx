import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{
        flex: 1,
        marginLeft: 'var(--sidebar-width)',
        background: 'var(--color-bg)',
        minHeight: '100vh',
        overflowX: 'hidden',
      }}>
        <Outlet />
      </main>
    </div>
  )
}
