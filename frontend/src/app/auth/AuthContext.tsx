import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";

export const AVAILABLE_PERMISSIONS = [
  "view_pos",
  "view_products",
  "view_clients",
  "view_sales",
  "view_purchases",
  "manage_roles",
  "manage_users",
] as const;

export type Permission = (typeof AVAILABLE_PERMISSIONS)[number];

export type Role = {
  id: number;
  name: string;
};

export type SessionUser = {
  id: number;
  roleId: number;
  roleName: string;
  name: string;
  email: string;
};

type ActionResult = {
  success: boolean;
  message?: string;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  isInitializing: boolean;
  currentUser: SessionUser | null;
  currentRole: Role | null;
  permissions: Permission[];
  defaultPath: string;
  roles: Role[];
  availablePermissions: readonly Permission[];
  login: (email: string, password: string) => Promise<ActionResult>;
  logout: () => Promise<void>;
  can: (permission: Permission) => boolean;
  refreshSession: () => Promise<void>;
  getPermissionsForRole: (roleId: number) => Permission[];
  updateRolePermissions: (roleId: number, permissions: Permission[]) => ActionResult;
  createUser: (payload: {
    username: string;
    email: string;
    password: string;
    roleId: number;
  }) => Promise<ActionResult>;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/$/, "");
const PERMISSIONS_STORAGE_KEY = "mh-role-permissions-map-v1";
const LOCAL_FALLBACK_SESSION_KEY = "mh-local-fallback-session-v1";
const LOCAL_DEV_ADMIN = {
  id: 1,
  roleId: 1,
  roleName: "Administrador",
  name: "Administrador",
  email: "admin@pos.com",
  password: "TuClaveSegura123!",
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type ApiRequestOptions = {
  method?: string;
  body?: Record<string, unknown>;
};

async function apiRequest<T>(path: string, options: ApiRequestOptions = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data: Record<string, unknown> = {};
  try {
    data = (await response.json()) as Record<string, unknown>;
  } catch {
    data = {};
  }

  if (!response.ok) {
    const message = typeof data.error === "string" ? data.error : "Error de servidor.";
    throw new Error(message);
  }

  return data as T;
}

function normalizeUser(payload: Record<string, unknown>): SessionUser {
  return {
    id: Number(payload.id_usuario ?? 0),
    roleId: Number(payload.id_rol ?? 0),
    roleName: String(payload.nombre_rol ?? ""),
    name: String(payload.nombre ?? ""),
    email: String(payload.correo ?? ""),
  };
}

function defaultPermissionsByRoleName(roleName: string): Permission[] {
  const normalizedRoleName = roleName.trim().toLowerCase();

  if (normalizedRoleName.includes("admin")) {
    return [...AVAILABLE_PERMISSIONS];
  }
  if (normalizedRoleName.includes("caj")) {
    return ["view_pos", "view_products", "view_clients"];
  }
  if (normalizedRoleName.includes("anal")) {
    return ["view_sales", "view_purchases", "view_products", "view_clients"];
  }

  return ["view_pos"];
}

function parseStoredPermissionMap() {
  const rawMap = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
  if (!rawMap) {
    return {};
  }

  try {
    return JSON.parse(rawMap) as Record<string, Permission[]>;
  } catch {
    return {};
  }
}

function resolvePermissionMap(roles: Role[]) {
  const stored = parseStoredPermissionMap();
  const map: Record<string, Permission[]> = {};

  for (const role of roles) {
    const key = String(role.id);
    const storedPermissions = stored[key] ?? [];
    const filtered = storedPermissions.filter((permission) =>
      AVAILABLE_PERMISSIONS.includes(permission),
    ) as Permission[];

    map[key] = filtered.length > 0 ? filtered : defaultPermissionsByRoleName(role.name);
  }

  localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(map));
  return map;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissionsByRole, setPermissionsByRole] = useState<Record<string, Permission[]>>({});
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const currentRole = useMemo(
    () => roles.find((role) => role.id === currentUser?.roleId) ?? null,
    [roles, currentUser],
  );
  const permissions = useMemo(
    () => (currentUser ? permissionsByRole[String(currentUser.roleId)] ?? [] : []),
    [currentUser, permissionsByRole],
  );
  const isAuthenticated = Boolean(currentUser);
  const defaultPath = useMemo(() => {
    if (permissions.includes("view_pos")) return "/";
    if (permissions.includes("view_products")) return "/products";
    if (permissions.includes("view_clients")) return "/clients";
    if (permissions.includes("view_sales")) return "/sales";
    if (permissions.includes("view_purchases")) return "/purchases";
    if (permissions.includes("manage_roles") || permissions.includes("manage_users")) return "/admin";
    return "/";
  }, [permissions]);

  const refreshSession = async () => {
    setIsInitializing(true);

    try {
      const meData = await apiRequest<{ authenticated?: boolean; user?: Record<string, unknown> }>(
        "/auth/me.php",
      );
      if (!meData.authenticated || !meData.user) {
        setCurrentUser(null);
        setRoles([]);
        setPermissionsByRole({});
        return;
      }

      const normalizedUser = normalizeUser(meData.user);
      setCurrentUser(normalizedUser);

      let mappedRoles: Role[] = [{ id: normalizedUser.roleId, name: normalizedUser.roleName }];
      try {
        const rolesData = await apiRequest<{ roles?: Array<{ id_rol: number; nombre_rol: string }> }>(
          "/auth/roles.php",
        );
        if (rolesData.roles && rolesData.roles.length > 0) {
          mappedRoles = rolesData.roles.map((role) => ({
            id: Number(role.id_rol),
            name: String(role.nombre_rol),
          }));
        }
      } catch {
        // Non-admin users cannot read roles endpoint. Keep current role only.
      }

      setRoles(mappedRoles);
      setPermissionsByRole(resolvePermissionMap(mappedRoles));
    } catch {
      const fallbackRaw = localStorage.getItem(LOCAL_FALLBACK_SESSION_KEY);

      if (fallbackRaw) {
        try {
          const fallbackUser = JSON.parse(fallbackRaw) as SessionUser;
          const fallbackRoles: Role[] = [{ id: fallbackUser.roleId, name: fallbackUser.roleName }];
          setCurrentUser(fallbackUser);
          setRoles(fallbackRoles);
          setPermissionsByRole(resolvePermissionMap(fallbackRoles));
          return;
        } catch {
          localStorage.removeItem(LOCAL_FALLBACK_SESSION_KEY);
        }
      }

      setCurrentUser(null);
      setRoles([]);
      setPermissionsByRole({});
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    void refreshSession();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      isInitializing,
      currentUser,
      currentRole,
      permissions,
      defaultPath,
      roles,
      availablePermissions: AVAILABLE_PERMISSIONS,
      login: async (email: string, password: string) => {
        if (!email.trim() || !password.trim()) {
          return { success: false, message: "Ingresa correo y contrasena." };
        }

        try {
          const loginData = await apiRequest<{ user?: Record<string, unknown> }>("/auth/login.php", {
            method: "POST",
            body: { correo: email.trim().toLowerCase(), password },
          });
          const userPayload = loginData.user;

          if (!userPayload) {
            return { success: false, message: "No se recibio sesion del servidor." };
          }

          const normalizedUser = normalizeUser(userPayload);
          setCurrentUser(normalizedUser);

          let mappedRoles: Role[] = [{ id: normalizedUser.roleId, name: normalizedUser.roleName }];
          try {
            const rolesData = await apiRequest<{ roles?: Array<{ id_rol: number; nombre_rol: string }> }>(
              "/auth/roles.php",
            );
            if (rolesData.roles && rolesData.roles.length > 0) {
              mappedRoles = rolesData.roles.map((role) => ({
                id: Number(role.id_rol),
                name: String(role.nombre_rol),
              }));
            }
          } catch {
            // Non-admin users may receive 403 on this endpoint.
          }

          setRoles(mappedRoles);
          setPermissionsByRole(resolvePermissionMap(mappedRoles));
          localStorage.removeItem(LOCAL_FALLBACK_SESSION_KEY);
          return { success: true };
        } catch (error) {
          const normalizedEmail = email.trim().toLowerCase();
          const isLocalAdmin =
            normalizedEmail === LOCAL_DEV_ADMIN.email.toLowerCase() &&
            password === LOCAL_DEV_ADMIN.password;

          if (isLocalAdmin) {
            const fallbackUser: SessionUser = {
              id: LOCAL_DEV_ADMIN.id,
              roleId: LOCAL_DEV_ADMIN.roleId,
              roleName: LOCAL_DEV_ADMIN.roleName,
              name: LOCAL_DEV_ADMIN.name,
              email: LOCAL_DEV_ADMIN.email,
            };
            const fallbackRoles: Role[] = [{ id: fallbackUser.roleId, name: fallbackUser.roleName }];
            setCurrentUser(fallbackUser);
            setRoles(fallbackRoles);
            setPermissionsByRole(resolvePermissionMap(fallbackRoles));
            localStorage.setItem(LOCAL_FALLBACK_SESSION_KEY, JSON.stringify(fallbackUser));
            return { success: true };
          }

          return {
            success: false,
            message: error instanceof Error ? error.message : "No se pudo iniciar sesion.",
          };
        }
      },
      logout: async () => {
        try {
          await apiRequest("/auth/logout.php", { method: "POST" });
        } catch {
          // Clear local state even if backend logout fails.
        } finally {
          setCurrentUser(null);
          setRoles([]);
          setPermissionsByRole({});
          localStorage.removeItem(LOCAL_FALLBACK_SESSION_KEY);
        }
      },
      can: (permission: Permission) => permissions.includes(permission),
      refreshSession,
      getPermissionsForRole: (roleId: number) => {
        const role = roles.find((candidate) => candidate.id === roleId);
        if (!role) {
          return [];
        }

        const stored = permissionsByRole[String(roleId)] ?? [];
        if (stored.length > 0) {
          return stored;
        }

        return defaultPermissionsByRoleName(role.name);
      },
      updateRolePermissions: (roleId: number, rolePermissions: Permission[]) => {
        if (rolePermissions.length === 0) {
          return { success: false, message: "Selecciona al menos un permiso." };
        }

        const roleExists = roles.some((role) => role.id === roleId);
        if (!roleExists) {
          return { success: false, message: "El rol no existe." };
        }

        const nextMap = { ...permissionsByRole, [String(roleId)]: rolePermissions };
        setPermissionsByRole(nextMap);
        localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(nextMap));
        return { success: true };
      },
      createUser: async ({ username, email, password, roleId }) => {
        if (!username.trim() || !email.trim() || !password.trim() || roleId <= 0) {
          return { success: false, message: "Completa todos los campos del usuario." };
        }

        try {
          await apiRequest("/auth/register.php", {
            method: "POST",
            body: {
              nombre: username.trim(),
              correo: email.trim().toLowerCase(),
              password: password.trim(),
              id_rol: roleId,
            },
          });
          return { success: true };
        } catch (error) {
          return {
            success: false,
            message: error instanceof Error ? error.message : "No se pudo crear el usuario.",
          };
        }
      },
    }),
    [
      currentRole,
      currentUser,
      defaultPath,
      isAuthenticated,
      isInitializing,
      permissions,
      permissionsByRole,
      roles,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
