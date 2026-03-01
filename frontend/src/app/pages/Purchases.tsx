import { useState } from 'react';
import { Plus, Edit2, Trash2, X, Search } from 'lucide-react';

interface Purchase {
  id: string;
  supplier: string;
  product: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  date: string;
  status: 'received' | 'pending' | 'cancelled';
}

export default function Purchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([
    { id: '1', supplier: 'Distribuidora de Alimentos SA', product: 'Carne para Hamburguesas', quantity: 100, unitCost: 3.50, totalCost: 350.00, date: '2026-02-20', status: 'received' },
    { id: '2', supplier: 'Bebidas al Mayor CA', product: 'Coca Cola Cajas', quantity: 50, unitCost: 8.00, totalCost: 400.00, date: '2026-02-21', status: 'received' },
    { id: '3', supplier: 'Productos Frescos Ltda', product: 'Lechuga (cajas)', quantity: 20, unitCost: 12.00, totalCost: 240.00, date: '2026-02-22', status: 'pending' },
    { id: '4', supplier: 'Snacks Proveedores', product: 'Papas Fritas Cajas', quantity: 30, unitCost: 15.50, totalCost: 465.00, date: '2026-02-22', status: 'received' },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<Omit<Purchase, 'id' | 'totalCost'>>({
    supplier: '',
    product: '',
    quantity: 0,
    unitCost: 0,
    date: new Date().toISOString().split('T')[0],
    status: 'pending',
  });

  const filteredPurchases = purchases.filter(purchase =>
    purchase.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
    purchase.product.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalCost = formData.quantity * formData.unitCost;
    
    if (editingPurchase) {
      setPurchases(purchases.map(p => p.id === editingPurchase.id ? {
        ...formData,
        id: editingPurchase.id,
        totalCost
      } : p));
    } else {
      const newPurchase: Purchase = {
        ...formData,
        id: Date.now().toString(),
        totalCost,
      };
      setPurchases([...purchases, newPurchase]);
    }
    resetForm();
  };

  const handleEdit = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setFormData({
      supplier: purchase.supplier,
      product: purchase.product,
      quantity: purchase.quantity,
      unitCost: purchase.unitCost,
      date: purchase.date,
      status: purchase.status,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de que desea eliminar esta compra?')) {
      setPurchases(purchases.filter(p => p.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({
      supplier: '',
      product: '',
      quantity: 0,
      unitCost: 0,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
    });
    setEditingPurchase(null);
    setShowForm(false);
  };

  const totalSpent = purchases.reduce((sum, p) => sum + p.totalCost, 0);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Valor Total de Compras</p>
            <p className="text-3xl font-bold text-teal-600">${totalSpent.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Compras</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold transition-colors"
          >
            <Plus className="w-5 h-5" />
            Agregar Compra
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por proveedor o producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Purchases Table */}
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
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Estado</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPurchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{new Date(purchase.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{purchase.supplier}</td>
                  <td className="px-4 py-3 text-gray-600">{purchase.product}</td>
                  <td className="px-4 py-3 text-gray-600">{purchase.quantity}</td>
                  <td className="px-4 py-3 text-gray-600">${purchase.unitCost.toFixed(2)}</td>
                  <td className="px-4 py-3 font-bold text-teal-600">${purchase.totalCost.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      purchase.status === 'received' ? 'bg-green-100 text-green-700' :
                      purchase.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {purchase.status === 'received' ? 'Recibido' : 
                       purchase.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(purchase)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(purchase.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingPurchase ? 'Editar Compra' : 'Agregar Compra'}
              </h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Proveedor</label>
                <input
                  type="text"
                  required
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Producto</label>
                <input
                  type="text"
                  required
                  value={formData.product}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Cantidad</label>
                  <input
                    type="number"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Costo Unitario</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Estado</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Purchase['status'] })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none"
                >
                  <option value="pending">Pendiente</option>
                  <option value="received">Recibido</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Costo Total:</span>
                  <span className="text-lg font-bold text-teal-600">
                    ${(formData.quantity * formData.unitCost).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors"
                >
                  {editingPurchase ? 'Actualizar' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}