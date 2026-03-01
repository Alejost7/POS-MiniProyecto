import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_BASE } from '../config/api'
import type { Role, User } from '../types/auth'

export default function UserCreatePage() {
  const [user, setUser] = useState<User | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [idRol, setIdRol] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  const isAdmin = useMemo(() => {
    if (!user) {
      return false
    }

    return user.id_rol === 1 || user.nombre_rol.toLowerCase().includes('admin')
  }, [user])

  useEffect(() => {
    const bootstrapPage = async () => {
      try {
        const meResponse = await fetch(`${API_BASE}/auth/me.php`, {
          method: 'GET',
          credentials: 'include',
        })

        if (!meResponse.ok) {
          navigate('/', { replace: true })
          return
        }

        const meData = await meResponse.json()
        const currentUser = (meData.user ?? null) as User | null
        setUser(currentUser)

        const adminFlag =
          currentUser !== null &&
          (currentUser.id_rol === 1 || currentUser.nombre_rol.toLowerCase().includes('admin'))

        if (!adminFlag) {
          navigate('/inicio', { replace: true })
          return
        }

        const rolesResponse = await fetch(`${API_BASE}/auth/roles.php`, {
          method: 'GET',
          credentials: 'include',
        })

        const rolesData = await rolesResponse.json().catch(() => ({}))

        if (!rolesResponse.ok) {
          setError(rolesData.error ?? 'No fue posible cargar los roles')
          setLoading(false)
          return
        }

        const loadedRoles = Array.isArray(rolesData.roles) ? (rolesData.roles as Role[]) : []
        setRoles(loadedRoles)

        if (loadedRoles.length > 0) {
          setIdRol(String(loadedRoles[0].id_rol))
        }
      } catch {
        setError('No fue posible cargar la pagina de usuarios')
      } finally {
        setLoading(false)
      }
    }

    void bootstrapPage()
  }, [navigate])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${API_BASE}/auth/register.php`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre,
          correo,
          password,
          id_rol: Number(idRol),
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(data.error ?? 'No fue posible registrar el usuario')
        return
      }

      setSuccess('Usuario creado correctamente')
      setNombre('')
      setCorreo('')
      setPassword('')
      if (roles.length > 0) {
        setIdRol(String(roles[0].id_rol))
      }
    } catch {
      setError('No fue posible registrar el usuario')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <main className="app-shell">Cargando...</main>
  }

  if (!user || !isAdmin) {
    return null
  }

  return (
    <main className="app-shell">
      <section className="panel wide-panel">
        <div className="panel-header-row">
          <h1>Crear Usuario</h1>
          <Link to="/inicio" className="btn-primary link-btn">
            Volver
          </Link>
        </div>

        <p>Registra colaboradores y asigna rol (Administrador o Vendedor).</p>

        <form onSubmit={handleSubmit} className="form-grid">
          <label htmlFor="nombre">Nombre de usuario</label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />

          <label htmlFor="correo">Correo electronico</label>
          <input
            id="correo"
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />

          <label htmlFor="password">Contrasena</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label htmlFor="rol">Rol</label>
          <select
            id="rol"
            value={idRol}
            onChange={(e) => setIdRol(e.target.value)}
            required
          >
            {roles.map((role) => (
              <option key={role.id_rol} value={role.id_rol}>
                {role.nombre_rol}
              </option>
            ))}
          </select>

          {error ? <p className="error-message">{error}</p> : null}
          {success ? <p className="success-message">{success}</p> : null}

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Guardando...' : 'Crear usuario'}
          </button>
        </form>
      </section>
    </main>
  )
}

