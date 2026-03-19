import { useEffect, useState } from "react";
import { Edit2, Plus, Search, Trash2, X } from "lucide-react";
import { apiRequest } from "../lib/api";

type Product = {
  id: number;
  name: string;
  brand: string;
  barcode: string;
  price: number;
  stock: number;
  description: string;
  supplierId: string;
  categoryId: string;
  categoryName: string;
};

type ProductPayload = {
  productos?: Array<{
    id_producto: number;
    nombre_producto: string;
    marca: string | null;
    precio_venta: number | string;
    stock_actual: number | string;
    descripcion: string | null;
    codigo_barras: string | null;
    id_proveedor: number | null;
    id_categoria: number | null;
    nombre_categoria: string | null;
  }>;
};

type OptionsPayload = {
  categorias?: Array<{
    id_categoria: number;
    nombre_categoria: string;
  }>;
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    barcode: "",
    price: "0",
    stock: "0",
    description: "",
    supplierId: "",
    categoryId: "",
  });

  const loadCategories = async () => {
    try {
      const data = await apiRequest<OptionsPayload>("/catalogos/options.php");
      setCategories(
        (data.categorias ?? []).map((category) => ({
          id: String(category.id_categoria),
          name: category.nombre_categoria,
        })),
      );
    } catch {
      setCategories([]);
    }
  };

  const loadProducts = async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await apiRequest<ProductPayload>(`/productos/read.php?q=${encodeURIComponent(searchQuery)}`);
      const mappedProducts = (data.productos ?? []).map((product) => ({
        id: Number(product.id_producto),
        name: product.nombre_producto,
        brand: product.marca ?? "",
        barcode: product.codigo_barras ?? "",
        price: Number(product.precio_venta),
        stock: Number(product.stock_actual),
        description: product.descripcion ?? "",
        supplierId: product.id_proveedor ? String(product.id_proveedor) : "",
        categoryId: product.id_categoria ? String(product.id_categoria) : "",
        categoryName: product.nombre_categoria ?? "Sin categoria",
      }));

      const filteredProducts = mappedProducts.filter((product) => {
        const matchesLowStock = !showLowStockOnly || product.stock < 5;
        const matchesCategory = selectedCategoryFilter === "" || product.categoryId === selectedCategoryFilter;
        return matchesLowStock && matchesCategory;
      });

      setProducts(filteredProducts);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudieron cargar los productos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [searchQuery, showLowStockOnly, selectedCategoryFilter]);

  const resetForm = () => {
    setFormData({
      name: "",
      brand: "",
      barcode: "",
      price: "0",
      stock: "0",
      description: "",
      supplierId: "",
      categoryId: "",
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      brand: product.brand,
      barcode: product.barcode,
      price: String(product.price),
      stock: String(product.stock),
      description: product.description,
      supplierId: product.supplierId,
      categoryId: product.categoryId,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar este producto?")) {
      return;
    }

    try {
      await apiRequest("/productos/delete.php", {
        method: "POST",
        body: { id_producto: id },
      });
      await loadProducts();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo eliminar el producto.");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    const body = {
      nombre_producto: formData.name.trim(),
      marca: formData.brand.trim(),
      codigo_barras: formData.barcode.trim(),
      precio_venta: Number(formData.price),
      stock_actual: Number(formData.stock),
      descripcion: formData.description.trim(),
      id_proveedor: formData.supplierId.trim() === "" ? null : Number(formData.supplierId),
      id_categoria: formData.categoryId.trim() === "" ? null : Number(formData.categoryId),
      ...(editingProduct ? { id_producto: editingProduct.id } : {}),
    };

    try {
      await apiRequest(editingProduct ? "/productos/update.php" : "/productos/create.php", {
        method: editingProduct ? "PUT" : "POST",
        body,
      });
      resetForm();
      await loadProducts();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo guardar el producto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-3xl font-bold text-gray-800">Gestion de Productos</h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-teal-700"
          >
            <Plus className="h-5 w-5" />
            Agregar Producto
          </button>
        </div>

        {error ? <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}

        <div className="mb-6">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, marca, categoria o ID..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-lg border-2 border-gray-200 py-2 pl-10 pr-4 focus:border-teal-500 focus:outline-none"
              />
            </div>
            <select
              value={selectedCategoryFilter}
              onChange={(event) => setSelectedCategoryFilter(event.target.value)}
              className="rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-teal-500 focus:outline-none"
            >
              <option value="">Todas las categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 rounded-lg border-2 border-gray-200 px-4 py-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={showLowStockOnly}
                onChange={(event) => setShowLowStockOnly(event.target.checked)}
              />
              Solo stock bajo (&lt; 5)
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Nombre</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Categoria</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Marca</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Precio</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Stock</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Proveedor</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Cargando productos...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No hay productos registrados.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{product.id}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{product.name}</td>
                    <td className="px-4 py-3 text-gray-600">{product.categoryName}</td>
                    <td className="px-4 py-3 text-gray-600">{product.brand || "Sin marca"}</td>
                    <td className="px-4 py-3 font-semibold text-teal-600">${product.price.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-sm font-semibold ${product.stock < 5 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{product.supplierId || "Sin proveedor"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(product)} className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => void handleDelete(product.id)} className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50">
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
              <h2 className="text-2xl font-bold text-gray-800">{editingProduct ? "Editar Producto" : "Agregar Producto"}</h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4 p-6">
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
                <label className="mb-1 block text-sm font-semibold text-gray-700">Categoria</label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(event) => setFormData({ ...formData, categoryId: event.target.value })}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-teal-500 focus:outline-none"
                >
                  <option value="">Selecciona una categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Marca</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(event) => setFormData({ ...formData, brand: event.target.value })}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Codigo de barras</label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(event) => setFormData({ ...formData, barcode: event.target.value })}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Precio</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(event) => setFormData({ ...formData, price: event.target.value })}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Stock</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={(event) => setFormData({ ...formData, stock: event.target.value })}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">ID Proveedor</label>
                <input
                  type="number"
                  min="1"
                  value={formData.supplierId}
                  onChange={(event) => setFormData({ ...formData, supplierId: event.target.value })}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Descripcion</label>
                <textarea
                  value={formData.description}
                  onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-teal-500 focus:outline-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={resetForm} className="flex-1 rounded-lg border-2 border-gray-200 px-4 py-2 font-semibold text-gray-700 transition-colors hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-60">
                  {isSubmitting ? "Guardando..." : editingProduct ? "Actualizar" : "Agregar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
