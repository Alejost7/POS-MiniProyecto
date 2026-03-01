import { Receipt, X } from 'lucide-react';

export interface Transaction {
  id: string;
  date: string;
  items: number;
  total: number;
  paymentMethod: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  onClose: () => void;
}

export function TransactionHistory({ transactions, onClose }: TransactionHistoryProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Receipt className="w-6 h-6 text-teal-600" />
            <h2 className="text-2xl font-bold text-gray-800">Historial de Transacciones</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Receipt className="w-16 h-16 mx-auto mb-3 opacity-30" />
              <p>No hay transacciones todavía</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">Transacción #{transaction.id}</p>
                      <p className="text-sm text-gray-500">{transaction.date}</p>
                    </div>
                    <span className="font-bold text-teal-600 text-lg">
                      ${transaction.total.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>{transaction.items} artículos</span>
                    <span>•</span>
                    <span>{transaction.paymentMethod}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}