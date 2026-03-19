import { Receipt, X } from "lucide-react";

export interface Transaction {
  id: string;
  date: string;
  items: number;
  total: number;
  customer: string;
  status: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  onClose: () => void;
}

function formatStatus(status: string) {
  if (status === "completada") return "Completada";
  if (status === "pendiente") return "Pendiente";
  if (status === "anulada") return "Anulada";
  return status;
}

export function TransactionHistory({ transactions, onClose }: TransactionHistoryProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b bg-white px-6 py-4">
          <div className="flex items-center gap-2">
            <Receipt className="h-6 w-6 text-teal-600" />
            <h2 className="text-2xl font-bold text-gray-800">Historial de Transacciones</h2>
          </div>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {transactions.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Receipt className="mx-auto mb-3 h-16 w-16 opacity-30" />
              <p>No hay transacciones todavia</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">Venta #{transaction.id}</p>
                      <p className="text-sm text-gray-500">{transaction.date}</p>
                    </div>
                    <span className="text-lg font-bold text-teal-600">${transaction.total.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span>{transaction.items} articulos</span>
                    <span>Cliente: {transaction.customer}</span>
                    <span>Estado: {formatStatus(transaction.status)}</span>
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
