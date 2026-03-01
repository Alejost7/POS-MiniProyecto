import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
}

export function Cart({ items, onUpdateQuantity, onRemoveItem, onCheckout }: CartProps) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-6">
        <ShoppingCart className="w-6 h-6 text-teal-600" />
        <h2 className="text-xl font-bold text-gray-800">Carrito ({itemCount})</h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-6">
        {items.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <ShoppingCart className="w-16 h-16 mx-auto mb-3 opacity-30" />
            <p>El carrito está vacío</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-800 flex-1">{item.name}</h3>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    className="w-7 h-7 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="font-bold text-teal-600">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t pt-4 space-y-4">
        <div className="flex justify-between items-center text-2xl font-bold">
          <span className="text-gray-800">Total:</span>
          <span className="text-teal-600">${total.toFixed(2)}</span>
        </div>
        <button
          onClick={onCheckout}
          disabled={items.length === 0}
          className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition-colors"
        >
          Pagar
        </button>
      </div>
    </div>
  );
}