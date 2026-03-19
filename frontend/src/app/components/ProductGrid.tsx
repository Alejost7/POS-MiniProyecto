import { Package, Plus } from "lucide-react";

export interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  brand: string | null;
  stock: number;
}

interface ProductGridProps {
  products: CatalogProduct[];
  onAddToCart: (product: CatalogProduct) => void;
}

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400">
        <Package className="mx-auto mb-3 h-16 w-16 opacity-30" />
        <p>No hay productos disponibles</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <button
          key={product.id}
          onClick={() => onAddToCart(product)}
          disabled={product.stock <= 0}
          className="group rounded-lg bg-white p-4 text-left shadow-md transition-shadow hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          <div className="flex h-full flex-col">
            <div className="flex-1">
              <h3 className="mb-1 font-semibold text-gray-800">{product.name}</h3>
              <p className="mb-2 text-sm text-gray-500">{product.brand || "Sin marca"}</p>
              <p className="text-xs text-gray-400">Stock: {product.stock}</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-teal-600">${product.price.toFixed(2)}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500 transition-colors group-hover:bg-teal-600">
                <Plus className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
