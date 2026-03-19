import { useEffect, useState } from "react";
import { Plus, Search, Trash2, UserPlus, X } from "lucide-react";
import { apiRequest } from "../lib/api";

type Purchase = {
  id: number;
  supplierId: number;
  supplierName: string;
  productId: number;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  date: string;
};

type PurchasePayload = {
  compras?: Array<{
    id_compra: number;
    fecha: string;
    id_producto: number;
    nombre_producto: string;
    id_proveedor: number;
    nombre_proveedor: string;
    cantidad: number | string;
    precio_unitario_compra: number | string;
    total_compra: number | string;
  }>;
};

type OptionsPayload = {
  productos?: Array<{ id_producto: number; nombre_producto: string }>;
  proveedores?: Array<{ rut_proveedor: number; nombre: string }>;
};

export default function Purchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Array<{ id: number; name: string }>>([]);
  const [suppliers, setSuppliers] = useState<Array<{ id: number; name: string }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingSupplier, setIsCreatingSupplier] = useState(false);
  const [error, setError] = useState("");
  const [supplierError, setSupplierError] = useState("");
  const [showCreateSupplier, setShowCreateSupplier] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    supplierId: "",
    productId: "",
    quantity: "1",
    unitCost: "0",
  });
  const [newSupplier, setNewSupplier] = useState({
    rut: "",
    name: "",
    phone: "",
    email: "",
  });

  const loadOptions = async () => {
    const data = await apiRequest<OptionsPayload>("/catalogos/options.php");
    setProducts((data.productos ?? []).map((product) => ({ id: product.id_producto, name: product.nombre_producto })));
    setSuppliers((data.proveedores ?? []).map((provider) => ({ id: provider.rut_proveedor, name: provider.nombre })));
  };

  const loadPurchases = async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await apiRequest<PurchasePayload>(`/compras/list.php?q=${encodeURIComponent(searchQuery)}`);
      setPurchases(
        (data.compras ?? []).map((purchase) => ({
          id: Number(purchase.id_compra),
          supplierId: Number(purchase.id_proveedor),
          supplierName: purchase.nombre_proveedor,
          productId: Number(purchase.id_producto),
          productName: purchase.nombre_producto,
          quantity: Number(purchase.cantidad),
          unitCost: Number(purchase.precio_unitario_compra),
          totalCost: Number(purchase.total_compra),
          date: purchase.fecha,
        })),
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudieron cargar las compras.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPurchases();
  }, [searchQuery]);

  useEffect(() => {
    void loadOptions();
  }, []);

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      supplierId: "",
      productId: "",
      quantity: "1",
      unitCost: "0",
    });
    setShowCreateSupplier(false);
    setSupplierError("");
    setNewSupplier({ rut: "", name: "", phone: "", email: "" });
    setShowForm(false);
  };

  const handleCreateSupplier = async () => {
    setSupplierError("");

    const rutProveedor = Number(newSupplier.rut);
    if (!Number.isInteger(rutProveedor) || rutProveedor <= 0 || newSupplier.name.trim() === "") {
      setSupplierError("Identificacion y nombre son obligatorios.");
      return;
    }

    setIsCreatingSupplier(true);
    try {
      await apiRequest("/proveedores/create.php", {
        method: "POST",
        body: {
          rut_proveedor: rutProveedor,
          nombre: newSupplier.name.trim(),
          telefono: newSupplier.phone.trim(),
          correo: newSupplier.email.trim(),
        },
      });
      await loadOptions();
      setFormData((current) => ({ ...current, supplierId: String(rutProveedor) }));
      setNewSupplier({ rut: "", name: "", phone: "", email: "" });
      setShowCreateSupplier(false);
    } catch (requestError) {
      setSupplierError(requestError instanceof Error ? requestError.message : "No se pudo crear el proveedor.");
    } finally {
      setIsCreatingSupplier(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar esta compra?")) {
      return;
    }

    try {
      await apiRequest("/compras/delete.php", {
        method: "POST",
        body: { id_compra: id },
      });
      await loadPurchases();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo eliminar la compra.");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await apiRequest("/compras/create.php", {
        method: "POST",
        body: {
          fecha: formData.date,
          id_proveedor: Number(formData.supplierId),
          id_producto: Number(formData.productId),
          cantidad: Number(formData.quantity),
          precio_unitario_compra: Number(formData.unitCost),
        },
      });
      resetForm();
      await loadPurchases();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo registrar la compra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalSpent = purchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-1 text-sm text-gray-600">Valor Total de Compras</p>
            <p className="text-3xl font-bold text-teal-600">${totalSpent.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-3xl font-bold text-gray-800">Gestion de Compras</h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-teal-700"
          >
            <Plus className="h-5 w-5" />
            Agregar Compra
          </button>
        </div>

        {error ? <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por proveedor o producto..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-lg border-2 border-gray-200 py-2 pl-10 pr-4 focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Fecha</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Proveedor</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Producto</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Cantidad</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Costo Unitario</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Total</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Cargando compras...
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No hay compras registradas.
                  </td>
                </tr>
              ) : (
                purchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{new Date(purchase.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{purchase.supplierName}</td>
                    <td className="px-4 py-3 text-gray-600">{purchase.productName}</td>
                    <td className="px-4 py-3 text-gray-600">{purchase.quantity}</td>
                    <td className="px-4 py-3 text-gray-600">${purchase.unitCost.toFixed(2)}</td>
                    <td className="px-4 py-3 font-bold text-teal-600">${purchase.totalCost.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => void handleDelete(purchase.id)} className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50">
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
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-2xl font-bold text-gray-800">Agregar Compra</h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Fecha</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(event) => setFormData({ ...formData, date: event.target.value })}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-sm font-semibold text-gray-700">Proveedor</label>
                  <button
                    type="button"
                    onClick={() => setShowCreateSupplier((current) => !current)}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-800"
                  >
                    <UserPlus className="h-4 w-4" />
                    {showCreateSupplier ? "Cerrar formulario" : "Crear proveedor"}
                  </button>
                </div>
                <select
                  required
                  value={formData.supplierId}
                  onChange={(event) => setFormData({ ...formData, supplierId: event.target.value })}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-teal-500 focus:outline-none"
                >
                  <option value="">Selecciona un proveedor</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
              {showCreateSupplier ? (
                <div className="space-y-3 rounded-lg border border-gray-200 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-700">Identificacion</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={newSupplier.rut}
                        onChange={(event) => setNewSupplier({ ...newSupplier, rut: event.target.value })}
                        className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-700">Nombre</label>
                      <input
                        type="text"
                        required
                        value={newSupplier.name}
                        onChange={(event) => setNewSupplier({ ...newSupplier, name: event.target.value })}
                        className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-700">Telefono</label>
                      <input
                        type="tel"
                        value={newSupplier.phone}
                        onChange={(event) => setNewSupplier({ ...newSupplier, phone: event.target.value })}
                        className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-700">Correo</label>
                      <input
                        type="email"
                        value={newSupplier.email}
                        onChange={(event) => setNewSupplier({ ...newSupplier, email: event.target.value })}
                        className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  {supplierError ? <p className="text-sm text-red-600">{supplierError}</p> : null}
                  <button
                    type="button"
                    onClick={() => void handleCreateSupplier()}
                    disabled={isCreatingSupplier}
                    className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
                  >
                    <Plus className="h-4 w-4" />
                    {isCreatingSupplier ? "Creando..." : "Guardar proveedor"}
                  </button>
                </div>
              ) : null}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Producto</label>
                <select
                  required
                  value={formData.productId}
                  onChange={(event) => setFormData({ ...formData, productId: event.target.value })}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-teal-500 focus:outline-none"
                >
                  <option value="">Selecciona un producto</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(event) => setFormData({ ...formData, quantity: event.target.value })}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Costo Unitario</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.unitCost}
                    onChange={(event) => setFormData({ ...formData, unitCost: event.target.value })}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Costo Total:</span>
                  <span className="text-lg font-bold text-teal-600">
                    ${(Number(formData.quantity || 0) * Number(formData.unitCost || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={resetForm} className="flex-1 rounded-lg border-2 border-gray-200 px-4 py-2 font-semibold text-gray-700 transition-colors hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-60">
                  {isSubmitting ? "Guardando..." : "Agregar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
