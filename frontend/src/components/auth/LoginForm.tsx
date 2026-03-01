import type { FormEvent } from 'react'

type LoginFormProps = {
  correo: string
  password: string
  error: string
  submitting: boolean
  onCorreoChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function LoginForm({
  correo,
  password,
  error,
  submitting,
  onCorreoChange,
  onPasswordChange,
  onSubmit,
}: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="form-grid">
      <label htmlFor="correo">Correo</label>
      <input
        id="correo"
        name="correo"
        type="email"
        autoComplete="username"
        value={correo}
        onChange={(e) => onCorreoChange(e.target.value)}
        required
      />

      <label htmlFor="password">Contraseña</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        required
      />

      {error ? <p className="error-message">{error}</p> : null}

      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? 'Validando...' : 'Entrar'}
      </button>
    </form>
  )
}
