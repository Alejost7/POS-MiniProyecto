import { useState } from 'react';
import { Search, Eye, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';

interface Sale {
  id: string;
  clientName: string;
  date: string;
  items: number;
  total: number;
  paymentMethod: string;
  status: 'completed' | 'pending' | 'refunded';
}

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([
    { id: '0001', clientName: 'Juan Pérez', date: '2026-02-22 10:30', items: 3, total: 45.50, paymentMethod: 'Tarjeta de Crédito', status: 'completed' },
    { id: '0002', clientName: 'María García', date: '2026-02-22 11:15', items: 5, total: 67.25, paymentMethod: 'Efectivo', status: 'completed' },
    { id: '0003', clientName: 'Carlos López', date: '2026-02-22 12:45', items: 2, total: 28.99, paymentMethod: 'Pago Móvil', status: 'completed' },
    { id: '0004', clientName: 'Cliente', date: '2026-02-22 13:20', items: 1, total: 12.99, paymentMethod: 'Efectivo', status: 'completed' },
    { id: '0005', clientName: 'Ana Martínez', date: '2026-02-22 14:00', items: 4, total: 55.80, paymentMethod: 'Tarjeta de Crédito', status: 'pending' },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.id.includes(searchQuery) || 
                         sale.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || sale.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const todaysSales = sales.length;
  const averageSale = totalRevenue / todaysSales;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Ingresos Totales</p>
              <p className="text-3xl font-bold text-teal-600">${totalRevenue.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-teal-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Ventas</p>
              <p className="text-3xl font-bold text-teal-600">{todaysSales}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Venta Promedio</p>
              <p className="text-3xl font-bold text-teal-600">${averageSale.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Sales List */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Historial de Ventas</h1>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por ID o nombre de cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none"
          >
            <option value="all">Todos los Estados</option>
            <option value="completed">Completado</option>
            <option value="pending">Pendiente</option>
            <option value="refunded">Reembolsado</option>
          </select>
        </div>

        {/* Sales Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Cliente</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Fecha</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Artículos</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Total</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Pago</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Estado</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-600">#{sale.id}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{sale.clientName}</td>
                  <td className="px-4 py-3 text-gray-600">{sale.date}</td>
                  <td className="px-4 py-3 text-gray-600">{sale.items}</td>
                  <td className="px-4 py-3 font-bold text-teal-600">${sale.total.toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-600">{sale.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      sale.status === 'completed' ? 'bg-green-100 text-green-700' :
                      sale.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {sale.status === 'completed' ? 'Completado' : 
                       sale.status === 'pending' ? 'Pendiente' : 'Reembolsado'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}