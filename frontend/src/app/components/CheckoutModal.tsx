import { X, CreditCard, DollarSign, Smartphone } from 'lucide-react';
import { CartItem } from './Cart';

interface CheckoutModalProps {
  items: CartItem[];
  total: number;
  onClose: () => void;
  onComplete: (paymentMethod: string) => void;
}

export function CheckoutModal({ items, total, onClose, onComplete }: CheckoutModalProps) {
  const paymentMethods = [
    { id: 'card', name: 'Tarjeta de Crédito', icon: CreditCard },
    { id: 'cash', name: 'Efectivo', icon: DollarSign },
    { id: 'mobile', name: 'Pago Móvil', icon: Smartphone },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Pagar</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-gray-700 mb-3">Resumen del Pedido</h3>
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.name} x{item.quantity}
                </span>
                <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span className="text-teal-600">${total.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Seleccionar Método de Pago</h3>
            <div className="space-y-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => onComplete(method.name)}
                    className="w-full bg-white border-2 border-gray-200 hover:border-teal-500 hover:bg-teal-50 rounded-lg p-4 flex items-center gap-3 transition-all"
                  >
                    <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                      <Icon className="w-6 h-6 text-teal-600" />
                    </div>
                    <span className="font-semibold text-gray-800">{method.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}