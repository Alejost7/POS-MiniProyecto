import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoginForm } from '../components/auth/LoginForm'
import { API_BASE } from '../config/api'

export default function LoginPage() {
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const verifySession = async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/me.php`, {
          method: 'GET',
          credentials: 'include',
        })

        if (response.ok) {
          navigate('/inicio', { replace: true })
          return
        }
      } catch {
        // ignore
      }

      setLoading(false)
    }

    void verifySession()
  }, [navigate])

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/auth/login.php`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ correo, password }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(data.error ?? 'No fue posible iniciar sesión')
        return
      }

      setCorreo('')
      setPassword('')
      navigate('/inicio', { replace: true })
    } catch {
      setError('No fue posible conectar con el servidor')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <main className="app-shell">Validando sesión...</main>
  }

  return (
    <main className="app-shell">
      <section className="panel">
        <h1>Iniciar sesión</h1>
        <p>Accede al POS con tu usuario.</p>

        <LoginForm
          correo={correo}
          password={password}
          error={error}
          submitting={submitting}
          onCorreoChange={setCorreo}
          onPasswordChange={setPassword}
          onSubmit={handleLogin}
        />
      </section>
    </main>
  )
}

