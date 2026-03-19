import { useMemo, useState } from "react";
import { CreditCard, DollarSign, PlusCircle, Smartphone, UserPlus, X } from "lucide-react";
import { CartItem } from "./Cart";

type ClientOption = {
  id: string;
  name: string;
};

type NewClientPayload = {
  cc_cliente: number;
  nombre: string;
  telefono: string;
  correo: string;
};

interface CheckoutModalProps {
  items: CartItem[];
  total: number;
  clients: ClientOption[];
  selectedClient: string;
  isSubmitting?: boolean;
  onClientChange: (clientId: string) => void;
  onClose: () => void;
  onCreateClient: (payload: NewClientPayload) => Promise<void>;
  onComplete: () => void;
}

export function CheckoutModal({
  items,
  total,
  clients,
  selectedClient,
  isSubmitting = false,
  onClientChange,
  onClose,
  onCreateClient,
  onComplete,
}: CheckoutModalProps) {
  const paymentMethods = [
    { id: "card", name: "Tarjeta de Credito", icon: CreditCard },
    { id: "cash", name: "Efectivo", icon: DollarSign },
    { id: "mobile", name: "Pago Movil", icon: Smartphone },
  ];

  const [showCreateClient, setShowCreateClient] = useState(false);
  const [clientError, setClientError] = useState("");
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClient, setNewClient] = useState({
    cc_cliente: "",
    nombre: "",
    telefono: "",
    correo: "",
  });

  const selectedClientName = useMemo(
    () => clients.find((client) => client.id === selectedClient)?.name ?? "",
    [clients, selectedClient],
  );

  const handleCreateClient = async (event: React.FormEvent) => {
    event.preventDefault();
    setClientError("");

    const ccCliente = Number(newClient.cc_cliente);
    if (!Number.isInteger(ccCliente) || ccCliente <= 0 || newClient.nombre.trim() === "") {
      setClientError("Cedula y nombre son obligatorios.");
      return;
    }

    setIsCreatingClient(true);
    try {
      await onCreateClient({
        cc_cliente: ccCliente,
        nombre: newClient.nombre.trim(),
        telefono: newClient.telefono.trim(),
        correo: newClient.correo.trim(),
      });
      onClientChange(String(ccCliente));
      setNewClient({ cc_cliente: "", nombre: "", telefono: "", correo: "" });
      setShowCreateClient(false);
    } catch (error) {
      setClientError(error instanceof Error ? error.message : "No se pudo crear el cliente.");
    } finally {
      setIsCreatingClient(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
          <h2 className="text-2xl font-bold text-gray-800">Pagar</h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="space-y-2 rounded-lg bg-gray-50 p-4">
            <h3 className="mb-3 font-semibold text-gray-700">Resumen del Pedido</h3>
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.name} x{item.quantity}
                </span>
                <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t pt-2 text-lg font-bold">
              <span>Total:</span>
              <span className="text-teal-600">${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-700">Cliente</h3>
              <button
                type="button"
                onClick={() => setShowCreateClient((current) => !current)}
                className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-800"
              >
                <UserPlus className="h-4 w-4" />
                {showCreateClient ? "Cerrar formulario" : "Crear cliente"}
              </button>
            </div>

            <select
              value={selectedClient}
              onChange={(event) => onClientChange(event.target.value)}
              className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-teal-500 focus:outline-none"
            >
              <option value="">Cliente general</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.id})
                </option>
              ))}
            </select>

            {selectedClientName ? (
              <p className="text-sm text-gray-500">
                Seleccionado: <span className="font-semibold">{selectedClientName}</span>
              </p>
            ) : null}

            {showCreateClient ? (
              <form onSubmit={(event) => void handleCreateClient(event)} className="space-y-3 rounded-lg border border-gray-200 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Cedula</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newClient.cc_cliente}
                      onChange={(event) => setNewClient({ ...newClient, cc_cliente: event.target.value })}
                      className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Nombre</label>
                    <input
                      type="text"
                      required
                      value={newClient.nombre}
                      onChange={(event) => setNewClient({ ...newClient, nombre: event.target.value })}
                      className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Telefono</label>
                    <input
                      type="tel"
                      value={newClient.telefono}
                      onChange={(event) => setNewClient({ ...newClient, telefono: event.target.value })}
                      className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Correo</label>
                    <input
                      type="email"
                      value={newClient.correo}
                      onChange={(event) => setNewClient({ ...newClient, correo: event.target.value })}
                      className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
                {clientError ? <p className="text-sm text-red-600">{clientError}</p> : null}
                <button
                  type="submit"
                  disabled={isCreatingClient}
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
                >
                  <PlusCircle className="h-4 w-4" />
                  {isCreatingClient ? "Creando..." : "Guardar cliente"}
                </button>
              </form>
            ) : null}
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-gray-700">Finalizar Venta</h3>
            <div className="space-y-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => onComplete()}
                    disabled={isSubmitting}
                    className="flex w-full items-center gap-3 rounded-lg border-2 border-gray-200 bg-white p-4 transition-all hover:border-teal-500 hover:bg-teal-50 disabled:opacity-60"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
                      <Icon className="h-6 w-6 text-teal-600" />
                    </div>
                    <span className="font-semibold text-gray-800">
                      {isSubmitting ? "Procesando..." : method.name}
                    </span>
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
