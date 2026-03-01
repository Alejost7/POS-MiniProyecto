import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { User } from '../types/auth'
import { API_BASE } from '../config/api'

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/me.php`, {
          method: 'GET',
          credentials: 'include',
        })

        if (!response.ok) {
          navigate('/', { replace: true })
          return
        }

        const data = await response.json()
        setUser(data.user ?? null)
      } catch {
        navigate('/', { replace: true })
      } finally {
        setLoading(false)
      }
    }

    void loadSession()
  }, [navigate])

  const roleLabel = useMemo(() => {
    if (!user) {
      return ''
    }

    return user.nombre_rol || `Rol ${user.id_rol}`
  }, [user])

  const isAdmin = useMemo(() => {
    if (!user) {
      return false
    }

    return user.id_rol === 1 || user.nombre_rol.toLowerCase().includes('admin')
  }, [user])

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout.php`, {
        method: 'POST',
        credentials: 'include',
      })
    } finally {
      navigate('/', { replace: true })
    }
  }

  if (loading) {
    return <main className="app-shell">Cargando...</main>
  }

  if (!user) {
    return null
  }

  return (
    <main className="app-shell">
      <section className="panel wide-panel">
        <h1>Sistema POS</h1>
        <p>Sesion activa: {user.nombre}</p>
        <p>Perfil: {roleLabel}</p>

        <div className="quick-actions">
          <Link to="/inventario" className="btn-primary link-btn">
            Ver inventario
          </Link>
          {isAdmin ? (
            <Link to="/usuarios/nuevo" className="btn-primary link-btn">
              Crear usuario
            </Link>
          ) : null}
        </div>

        <button type="button" onClick={handleLogout} className="btn-primary">
          Cerrar sesion
        </button>
      </section>
    </main>
  )
}
