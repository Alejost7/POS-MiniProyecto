import { useEffect, useState } from "react";
import { DollarSign, Search, ShoppingCart, TrendingUp } from "lucide-react";
import { apiRequest } from "../lib/api";

type Sale = {
  id: number;
  clientName: string;
  date: string;
  items: number;
  total: number;
  sellerName: string;
  status: "completada" | "pendiente" | "anulada";
};

type SalesPayload = {
  ventas?: Array<{
    id_venta: number;
    nombre_cliente: string | null;
    fecha: string;
    total_items: number | string;
    valor_total: number | string;
    nombre_vendedor: string;
    estado_venta: "completada" | "pendiente" | "anulada";
  }>;
};

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSales = async () => {
    setIsLoading(true);
    setError("");

    try {
      const query = new URLSearchParams();
      if (searchQuery.trim() !== "") query.set("q", searchQuery.trim());
      if (filterStatus !== "all") query.set("estado", filterStatus);
      query.set("limit", "200");

      const data = await apiRequest<SalesPayload>(`/ventas/list.php?${query.toString()}`);
      setSales(
        (data.ventas ?? []).map((sale) => ({
          id: Number(sale.id_venta),
          clientName: sale.nombre_cliente || "Cliente general",
          date: sale.fecha,
          items: Number(sale.total_items),
          total: Number(sale.valor_total),
          sellerName: sale.nombre_vendedor,
          status: sale.estado_venta,
        })),
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudieron cargar las ventas.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSales();
  }, [searchQuery, filterStatus]);

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalSales = sales.length;
  const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-gray-600">Ingresos Totales</p>
              <p className="text-3xl font-bold text-teal-600">${totalRevenue.toFixed(2)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
              <DollarSign className="h-6 w-6 text-teal-600" />
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-gray-600">Total Ventas</p>
              <p className="text-3xl font-bold text-teal-600">{totalSales}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-gray-600">Venta Promedio</p>
              <p className="text-3xl font-bold text-teal-600">${averageSale.toFixed(2)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <TrendingUp className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-lg">
        <h1 className="mb-6 text-3xl font-bold text-gray-800">Historial de Ventas</h1>
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => window.print()}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Imprimir historial
          </button>
        </div>

        {error ? <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por ID, cliente o vendedor..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-lg border-2 border-gray-200 py-2 pl-10 pr-4 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value)}
            className="rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-teal-500 focus:outline-none"
          >
            <option value="all">Todos los Estados</option>
            <option value="completada">Completada</option>
            <option value="pendiente">Pendiente</option>
            <option value="anulada">Anulada</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Cliente</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Fecha</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Articulos</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Total</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Vendedor</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Cargando ventas...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No hay ventas registradas.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-gray-600">#{sale.id}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{sale.clientName}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(sale.date).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600">{sale.items}</td>
                    <td className="px-4 py-3 font-bold text-teal-600">${sale.total.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-600">{sale.sellerName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          sale.status === "completada"
                            ? "bg-green-100 text-green-700"
                            : sale.status === "pendiente"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {sale.status === "completada" ? "Completada" : sale.status === "pendiente" ? "Pendiente" : "Anulada"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
