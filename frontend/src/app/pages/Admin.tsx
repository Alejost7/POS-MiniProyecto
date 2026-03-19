import { FormEvent, useEffect, useState } from "react";
import { Navigate } from "react-router";
import { BarChart3, DollarSign, FolderTree, Pencil, ShieldCheck, Trash2, UserPlus, Users, X } from "lucide-react";
import { Permission, useAuth } from "../auth/AuthContext";
import { apiRequest } from "../lib/api";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../components/ui/chart";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

type DashboardResponse = {
  resumen: {
    total_ventas: number;
    ingresos_totales: number;
    ganancia_bruta_estimada: number;
  };
  serie_ingresos: Array<{
    fecha: string;
    ventas: number | string;
    ingresos: number | string;
  }>;
  producto_mas_vendido: {
    id_producto: number;
    nombre_producto: string;
    cantidad_vendida: number | string;
    ingresos_generados: number | string;
  } | null;
};

type CategoriesResponse = {
  categorias?: Array<{
    id_categoria: number;
    nombre_categoria: string;
    total_productos: number | string;
  }>;
};

type Category = {
  id: number;
  name: string;
  totalProducts: number;
};

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
  const [periodDays, setPeriodDays] = useState(30);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [dashboardError, setDashboardError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryError, setCategoryError] = useState("");
  const [categoryMessage, setCategoryMessage] = useState("");
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");

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

  useEffect(() => {
    if (!canManageRoles) {
      return;
    }

    const loadDashboard = async () => {
      try {
        setDashboardError("");
        const data = await apiRequest<DashboardResponse>(`/reportes/dashboard.php?periodo=${periodDays}`);
        setDashboard(data);
      } catch (error) {
        setDashboardError(error instanceof Error ? error.message : "No se pudieron cargar las metricas.");
      }
    };

    void loadDashboard();
  }, [canManageRoles, periodDays]);

  const loadCategories = async () => {
    try {
      setCategoryError("");
      const data = await apiRequest<CategoriesResponse>("/categorias/list.php");
      setCategories(
        (data.categorias ?? []).map((category) => ({
          id: Number(category.id_categoria),
          name: category.nombre_categoria,
          totalProducts: Number(category.total_productos),
        })),
      );
    } catch (error) {
      setCategoryError(error instanceof Error ? error.message : "No se pudieron cargar las categorias.");
    }
  };

  useEffect(() => {
    if (!canManageRoles) {
      return;
    }

    void loadCategories();
  }, [canManageRoles]);

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

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryName("");
    setShowCategoryForm(false);
  };

  const handleCategorySubmit = async (event: FormEvent) => {
    event.preventDefault();
    setCategoryError("");
    setCategoryMessage("");
    setIsSavingCategory(true);

    try {
      await apiRequest(editingCategory ? "/categorias/update.php" : "/categorias/create.php", {
        method: editingCategory ? "PUT" : "POST",
        body: editingCategory
          ? { id_categoria: editingCategory.id, nombre_categoria: categoryName.trim() }
          : { nombre_categoria: categoryName.trim() },
      });
      setCategoryMessage(editingCategory ? "Categoria actualizada." : "Categoria creada.");
      resetCategoryForm();
      await loadCategories();
    } catch (error) {
      setCategoryError(error instanceof Error ? error.message : "No se pudo guardar la categoria.");
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`¿Eliminar la categoria "${category.name}"?`)) {
      return;
    }

    try {
      setCategoryError("");
      setCategoryMessage("");
      await apiRequest("/categorias/delete.php", {
        method: "POST",
        body: { id_categoria: category.id },
      });
      setCategoryMessage("Categoria eliminada.");
      await loadCategories();
    } catch (error) {
      setCategoryError(error instanceof Error ? error.message : "No se pudo eliminar la categoria.");
    }
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
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-600" />
              <h2 className="text-2xl font-bold text-gray-800">Dashboard de Ventas</h2>
            </div>
            <select
              value={periodDays}
              onChange={(event) => setPeriodDays(Number(event.target.value))}
              className="w-full md:w-auto px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none"
            >
              <option value={7}>Ultimos 7 dias</option>
              <option value={30}>Ultimos 30 dias</option>
              <option value={90}>Ultimos 90 dias</option>
            </select>
          </div>

          {dashboardError ? <p className="text-sm text-red-600">{dashboardError}</p> : null}

          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Ventas realizadas</p>
              <p className="mt-2 text-3xl font-bold text-gray-800">{dashboard?.resumen.total_ventas ?? 0}</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Ingresos</p>
              <p className="mt-2 text-3xl font-bold text-teal-600">
                ${(dashboard?.resumen.ingresos_totales ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <DollarSign className="w-4 h-4" />
                Ganancia bruta estimada
              </div>
              <p className="mt-2 text-3xl font-bold text-amber-600">
                ${(dashboard?.resumen.ganancia_bruta_estimada ?? 0).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div>
              <h3 className="mb-3 text-lg font-semibold text-gray-800">Ingresos por dia</h3>
              <ChartContainer
                config={{
                  ingresos: { label: "Ingresos", color: "#0f766e" },
                }}
                className="h-[260px] w-full"
              >
                <LineChart data={(dashboard?.serie_ingresos ?? []).map((item) => ({
                  fecha: new Date(item.fecha).toLocaleDateString(),
                  ingresos: Number(item.ingresos),
                }))}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="fecha" tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="ingresos" stroke="var(--color-ingresos)" strokeWidth={3} dot={false} />
                </LineChart>
              </ChartContainer>
            </div>

            <div>
              <h3 className="mb-3 text-lg font-semibold text-gray-800">Ventas por dia</h3>
              <ChartContainer
                config={{
                  ventas: { label: "Ventas", color: "#f59e0b" },
                }}
                className="h-[260px] w-full"
              >
                <BarChart data={(dashboard?.serie_ingresos ?? []).map((item) => ({
                  fecha: new Date(item.fecha).toLocaleDateString(),
                  ventas: Number(item.ventas),
                }))}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="fecha" tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="ventas" fill="var(--color-ventas)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Producto mas vendido del periodo</p>
            {dashboard?.producto_mas_vendido ? (
              <>
                <p className="mt-2 text-xl font-bold text-gray-800">
                  {dashboard.producto_mas_vendido.nombre_producto}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Cantidad vendida: {Number(dashboard.producto_mas_vendido.cantidad_vendida)}
                </p>
                <p className="text-sm text-gray-600">
                  Ingresos: ${Number(dashboard.producto_mas_vendido.ingresos_generados).toFixed(2)}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-gray-500">Aun no hay datos suficientes.</p>
            )}
          </div>
        </div>
      ) : null}

      {canManageRoles ? (
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-teal-600" />
              <h2 className="text-2xl font-bold text-gray-800">Categorias</h2>
            </div>
            <button
              onClick={() => {
                setEditingCategory(null);
                setCategoryName("");
                setShowCategoryForm(true);
              }}
              className="rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-teal-700"
            >
              Nueva categoria
            </button>
          </div>

          {categoryError ? <p className="text-sm text-red-600">{categoryError}</p> : null}
          {categoryMessage ? <p className="text-sm text-teal-700">{categoryMessage}</p> : null}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Nombre</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Productos</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      No hay categorias registradas.
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{category.id}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{category.name}</td>
                      <td className="px-4 py-3 text-gray-600">{category.totalProducts}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingCategory(category);
                              setCategoryName(category.name);
                              setShowCategoryForm(true);
                            }}
                            className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => void handleDeleteCategory(category)}
                            className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {showCategoryForm ? (
            <form onSubmit={(event) => void handleCategorySubmit(event)} className="rounded-lg border border-gray-200 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  {editingCategory ? "Editar categoria" : "Nueva categoria"}
                </h3>
                <button type="button" onClick={resetCategoryForm} className="text-gray-500 hover:text-gray-700">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Nombre de categoria</label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={(event) => setCategoryName(event.target.value)}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={resetCategoryForm}
                  className="rounded-lg border-2 border-gray-200 px-4 py-2 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingCategory}
                  className="rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
                >
                  {isSavingCategory ? "Guardando..." : editingCategory ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      ) : null}

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
