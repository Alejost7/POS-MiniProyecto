import { FormEvent, useEffect, useState } from "react";
import { Navigate } from "react-router";
import { ShieldCheck, UserPlus, Users } from "lucide-react";
import { Permission, useAuth } from "../auth/AuthContext";

export default function Admin() {
  const {
    roles,
    currentUser,
    can,
    availablePermissions,
    getPermissionsForRole,
    updateRolePermissions,
    createUser,
    isInitializing,
  } = useAuth();

  const canManageRoles = can("manage_roles");
  const canManageUsers = can("manage_users");

  const [selectedRoleId, setSelectedRoleId] = useState<number>(0);
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
  const [roleMessage, setRoleMessage] = useState("");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState<number>(0);
  const [userMessage, setUserMessage] = useState("");
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  useEffect(() => {
    if (roles.length > 0 && selectedRoleId === 0) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  useEffect(() => {
    if (!selectedRoleId) {
      return;
    }

    setRolePermissions(getPermissionsForRole(selectedRoleId));
  }, [selectedRoleId, roles]);

  if (isInitializing) {
    return null;
  }

  if (!canManageRoles && !canManageUsers) {
    return <Navigate to="/" replace />;
  }

  const togglePermission = (permission: Permission) => {
    setRolePermissions((current) =>
      current.includes(permission) ? current.filter((value) => value !== permission) : [...current, permission],
    );
  };

  const handleSaveRolePermissions = (event: FormEvent) => {
    event.preventDefault();
    setRoleMessage("");

    if (!selectedRoleId) {
      setRoleMessage("Selecciona un rol.");
      return;
    }

    const result = updateRolePermissions(selectedRoleId, rolePermissions);
    setRoleMessage(result.success ? "Permisos actualizados." : result.message ?? "No se pudo actualizar.");
  };

  const handleUserSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setUserMessage("");
    setIsCreatingUser(true);

    const result = await createUser({ username, email, password, roleId });
    setUserMessage(result.success ? "Usuario creado correctamente." : result.message ?? "No se pudo crear.");

    if (result.success) {
      setUsername("");
      setEmail("");
      setPassword("");
      setRoleId(0);
    }

    setIsCreatingUser(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800">Administracion de Accesos</h1>
        <p className="text-gray-600 mt-2">
          Usuario actual: <span className="font-semibold">{currentUser?.name}</span>
        </p>
      </div>

      {canManageRoles ? (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <h2 className="text-2xl font-bold text-gray-800">Roles y Permisos</h2>
          </div>

          <form onSubmit={handleSaveRolePermissions} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Rol</label>
              <select
                value={selectedRoleId || ""}
                onChange={(event) => setSelectedRoleId(Number(event.target.value))}
                className="w-full md:max-w-md px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="block text-sm font-semibold text-gray-700 mb-2">Permisos frontend</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {availablePermissions.map((permission) => (
                  <label key={permission} className="flex items-center gap-2 p-2 border rounded-lg">
                    <input
                      type="checkbox"
                      checked={rolePermissions.includes(permission)}
                      onChange={() => togglePermission(permission)}
                    />
                    <span className="text-sm text-gray-700">{permission}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Estos permisos controlan acceso en frontend. Los roles base se cargan desde el backend.
              </p>
            </div>

            {roleMessage ? <p className="text-sm text-teal-700">{roleMessage}</p> : null}

            <div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors"
              >
                Guardar permisos
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {canManageUsers ? (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-teal-600" />
            <h2 className="text-2xl font-bold text-gray-800">Crear Usuario</h2>
          </div>

          <form onSubmit={handleUserSubmit} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Usuario</label>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none"
                placeholder="Nombre unico"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Correo</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none"
                placeholder="correo@dominio.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Contrasena</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Rol</label>
              <select
                value={roleId || ""}
                onChange={(event) => setRoleId(Number(event.target.value))}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none"
              >
                <option value="">Selecciona un rol</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isCreatingUser}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-60"
              >
                <UserPlus className="w-4 h-4" />
                {isCreatingUser ? "Creando..." : "Crear usuario"}
              </button>
            </div>
          </form>

          {userMessage ? <p className="text-sm text-teal-700 mt-4">{userMessage}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
