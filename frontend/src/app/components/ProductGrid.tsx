import { Plus } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <button
          key={product.id}
          onClick={() => onAddToCart(product)}
          className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left group"
        >
          <div className="flex flex-col h-full">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-1">{product.name}</h3>
              <p className="text-sm text-gray-500 mb-2">{product.category}</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-teal-600">
                ${product.price.toFixed(2)}
              </span>
              <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center group-hover:bg-teal-600 transition-colors">
                <Plus className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}