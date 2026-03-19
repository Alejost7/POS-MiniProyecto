import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { ShoppingCart } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { AppLoader } from "../components/AppLoader";

export default function Login() {
  const { isAuthenticated, login, defaultPath, isInitializing } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";

  if (isInitializing) {
    return <AppLoader label="Preparando acceso..." />;
  }

  if (isAuthenticated) {
    return <Navigate to={defaultPath} replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    const result = await login(email, password);

    if (!result.success) {
      setError(result.message ?? "No se pudo iniciar sesion.");
      setIsSubmitting(false);
      return;
    }

    navigate(redirectTo, { replace: true });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#103436" }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex items-center justify-center gap-2 mb-6">
          <ShoppingCart className="w-8 h-8 text-teal-600" />
          <h1 className="text-2xl font-bold text-gray-800">M&H Software House</h1>
        </div>

        <h2 className="text-lg font-semibold text-gray-700 mb-6 text-center">Iniciar sesion</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="email">
              Correo
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Ingresa tu correo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="password">
              Contrasena
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Ingresa tu contrasena"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {isSubmitting ? "Ingresando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
