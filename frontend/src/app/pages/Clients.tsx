import { useEffect, useState } from "react";
import { Edit2, Mail, Phone, Plus, Search, Trash2, UserRound, X } from "lucide-react";
import { apiRequest } from "../lib/api";

type Client = {
  id: number;
  name: string;
  email: string;
  phone: string;
  salesCount: number;
  totalPurchases: number;
};

type ClientPayload = {
  clientes?: Array<{
    cc_cliente: number;
    nombre: string;
    telefono: string | null;
    correo: string | null;
    total_ventas: number | string;
    total_compras: number | string;
  }>;
};

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
  });

  const loadClients = async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await apiRequest<ClientPayload>(`/clientes/list.php?q=${encodeURIComponent(searchQuery)}`);
      setClients(
        (data.clientes ?? []).map((client) => ({
          id: Number(client.cc_cliente),
          name: client.nombre,
          email: client.correo ?? "",
          phone: client.telefono ?? "",
          salesCount: Number(client.total_ventas),
          totalPurchases: Number(client.total_compras),
        })),
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudieron cargar los clientes.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadClients();
  }, [searchQuery]);

  const resetForm = () => {
    setFormData({ id: "", name: "", email: "", phone: "" });
    setEditingClient(null);
    setShowForm(false);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      id: String(client.id),
      name: client.name,
      email: client.email,
      phone: client.phone,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar este cliente?")) {
      return;
    }

    try {
      await apiRequest("/clientes/delete.php", {
        method: "POST",
        body: { cc_cliente: id },
      });
      await loadClients();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo eliminar el cliente.");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      if (editingClient) {
        await apiRequest("/clientes/update.php", {
          method: "PUT",
          body: {
            cc_cliente: editingClient.id,
            nombre: formData.name.trim(),
            correo: formData.email.trim(),
            telefono: formData.phone.trim(),
          },
        });
      } else {
        await apiRequest("/clientes/create.php", {
          method: "POST",
          body: {
            cc_cliente: Number(formData.id),
            nombre: formData.name.trim(),
            correo: formData.email.trim(),
            telefono: formData.phone.trim(),
          },
        });
      }

      resetForm();
      await loadClients();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo guardar el cliente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-3xl font-bold text-gray-800">Gestion de Clientes</h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-teal-700"
          >
            <Plus className="h-5 w-5" />
            Agregar Cliente
          </button>
        </div>

        {error ? <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cedula, nombre, correo o telefono..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-lg border-2 border-gray-200 py-2 pl-10 pr-4 focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <p className="py-8 text-center text-gray-500 md:col-span-2 lg:col-span-3">Cargando clientes...</p>
          ) : clients.length === 0 ? (
            <p className="py-8 text-center text-gray-500 md:col-span-2 lg:col-span-3">No hay clientes registrados.</p>
          ) : (
            clients.map((client) => (
              <div key={client.id} className="rounded-lg bg-gray-50 p-4 transition-shadow hover:shadow-md">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{client.name}</h3>
                    <p className="text-sm text-gray-500">CC: {client.id}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(client)} className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => void handleDelete(client.id)} className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{client.email || "Sin correo"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{client.phone || "Sin telefono"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <UserRound className="h-4 w-4" />
                    <span>{client.salesCount} ventas registradas</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">
                  <span className="text-sm text-gray-500">Total Compras</span>
                  <div className="text-right">
                    <span className="font-bold text-teal-600">${client.totalPurchases.toFixed(2)}</span>
                    {client.salesCount >= 3 || client.totalPurchases >= 200 ? (
                      <p className="text-xs font-semibold text-amber-700">Cliente recurrente</p>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-2xl font-bold text-gray-800">{editingClient ? "Editar Cliente" : "Agregar Cliente"}</h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4 p-6">
              {!editingClient ? (
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Cedula</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.id}
                    onChange={(event) => setFormData({ ...formData, id: event.target.value })}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              ) : null}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Nombre</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Telefono</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={resetForm} className="flex-1 rounded-lg border-2 border-gray-200 px-4 py-2 font-semibold text-gray-700 transition-colors hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-60">
                  {isSubmitting ? "Guardando..." : editingClient ? "Actualizar" : "Agregar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
