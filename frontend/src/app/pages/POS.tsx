import { useEffect, useState } from "react";
import { History, Search } from "lucide-react";
import { Cart, CartItem } from "../components/Cart";
import { CheckoutModal } from "../components/CheckoutModal";
import { ProductGrid, type CatalogProduct } from "../components/ProductGrid";
import { TransactionHistory, type Transaction } from "../components/TransactionHistory";
import { apiRequest } from "../lib/api";

type ProductResponse = {
  productos?: Array<{
    id_producto: number;
    nombre_producto: string;
    marca: string | null;
    precio_venta: number | string;
    stock_actual: number | string;
  }>;
};

type SaleResponse = {
  ventas?: Array<{
    id_venta: number;
    fecha: string;
    nombre_cliente: string | null;
    total_items: number | string;
    valor_total: number | string;
    estado_venta: string;
  }>;
};

type CatalogOptionsResponse = {
  clientes?: Array<{
    cc_cliente: number;
    nombre: string;
  }>;
};

type CreatedClientResponse = {
  cliente: {
    cc_cliente: number;
    nombre: string;
  };
};

type CreatedSaleResponse = {
  venta: {
    id_venta: number;
    fecha: string;
    id_cliente: number | null;
    nombre_cliente: string | null;
    valor_total: number;
    estado_venta: string;
    items: Array<{
      id_producto: number;
      nombre_producto: string;
      cantidad: number;
      precio_unitario_momento: number;
      subtotal: number;
    }>;
  };
  email?: {
    attempted: boolean;
    sent: boolean;
    error: string | null;
  };
};

function printReceipt(sale: CreatedSaleResponse["venta"]) {
  const receiptWindow = window.open("", "_blank", "width=420,height=760");
  if (!receiptWindow) {
    return;
  }

  const rows = sale.items
    .map(
      (item) => `
        <tr>
          <td>${item.nombre_producto}</td>
          <td style="text-align:center;">${item.cantidad}</td>
          <td style="text-align:right;">$${item.precio_unitario_momento.toFixed(2)}</td>
          <td style="text-align:right;">$${item.subtotal.toFixed(2)}</td>
        </tr>`,
    )
    .join("");

  receiptWindow.document.write(`
    <html>
      <head>
        <title>Comprobante #${sale.id_venta}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; color: #111827; }
          h1, h2, p { margin: 0; }
          .header { text-align: center; margin-bottom: 16px; }
          .meta { margin-bottom: 16px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th, td { padding: 6px 0; border-bottom: 1px dashed #d1d5db; }
          .total { margin-top: 16px; font-size: 18px; font-weight: bold; text-align: right; }
          .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>M&H Software House POS</h1>
          <p>Comprobante de pago</p>
        </div>
        <div class="meta">
          <p><strong>Venta:</strong> #${sale.id_venta}</p>
          <p><strong>Fecha:</strong> ${new Date(sale.fecha).toLocaleString()}</p>
          <p><strong>Cliente:</strong> ${sale.nombre_cliente || "Cliente general"}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th style="text-align:left;">Producto</th>
              <th style="text-align:center;">Cant.</th>
              <th style="text-align:right;">Precio</th>
              <th style="text-align:right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="total">Total: $${sale.valor_total.toFixed(2)}</div>
        <div class="footer">Gracias por su compra</div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
    </html>
  `);
  receiptWindow.document.close();
}

export default function POS() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [clientOptions, setClientOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    setError("");

    try {
      const [productData, salesData, optionsData] = await Promise.all([
        apiRequest<ProductResponse>(`/productos/read.php?q=${encodeURIComponent(searchQuery)}`),
        apiRequest<SaleResponse>("/ventas/list.php?limit=20"),
        apiRequest<CatalogOptionsResponse>("/catalogos/options.php"),
      ]);

      setProducts(
        (productData.productos ?? []).map((product) => ({
          id: String(product.id_producto),
          name: product.nombre_producto,
          brand: product.marca,
          price: Number(product.precio_venta),
          stock: Number(product.stock_actual),
        })),
      );

      setTransactions(
        (salesData.ventas ?? []).map((sale) => ({
          id: String(sale.id_venta),
          date: new Date(sale.fecha).toLocaleString(),
          items: Number(sale.total_items),
          total: Number(sale.valor_total),
          customer: sale.nombre_cliente || "Cliente general",
          status: sale.estado_venta,
        })),
      );
      setClientOptions(
        (optionsData.clientes ?? []).map((client) => ({
          id: String(client.cc_cliente),
          name: client.nombre,
        })),
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudieron cargar los datos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [searchQuery]);

  const addToCart = (product: CatalogProduct) => {
    if (product.stock <= 0) {
      return;
    }

    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      const reservedQuantity = existingItem?.quantity ?? 0;

      if (reservedQuantity >= product.stock) {
        return prevItems;
      }

      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }

      return [...prevItems, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    const product = products.find((item) => item.id === id);
    if (!product) {
      return;
    }

    const nextQuantity = Math.min(Math.max(1, quantity), product.stock);
    setCartItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, quantity: nextQuantity } : item)),
    );
  };

  const removeItem = (id: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const completeTransaction = async () => {
    setIsSubmitting(true);
    setError("");
    setNotice("");

    try {
      const result = await apiRequest<CreatedSaleResponse>("/ventas/create.php", {
        method: "POST",
        body: {
          id_cliente: selectedClient.trim() === "" ? null : Number(selectedClient),
          items: cartItems.map((item) => ({
            id_producto: Number(item.id),
            cantidad: item.quantity,
          })),
        },
      });

      setCartItems([]);
      setSelectedClient("");
      setShowCheckout(false);
      await loadData();
      printReceipt(result.venta);

      if (result.email?.attempted && result.email.sent) {
        setNotice("Venta registrada y correo de confirmacion enviado al cliente.");
      } else if (result.email?.attempted && !result.email.sent) {
        setNotice(`Venta registrada, pero no se pudo enviar el correo: ${result.email.error ?? "error desconocido"}.`);
      } else {
        setNotice("Venta registrada correctamente.");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo registrar la venta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const createClient = async (payload: {
    cc_cliente: number;
    nombre: string;
    telefono: string;
    correo: string;
  }) => {
    const result = await apiRequest<CreatedClientResponse>("/clientes/create.php", {
      method: "POST",
      body: payload,
    });

    const nextClient = {
      id: String(result.cliente.cc_cliente),
      name: result.cliente.nombre,
    };

    setClientOptions((current) => {
      const withoutDuplicate = current.filter((client) => client.id !== nextClient.id);
      return [...withoutDuplicate, nextClient].sort((a, b) => a.name.localeCompare(b.name));
    });
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Punto de Venta</h1>
            <p className="mt-1 text-sm text-gray-500">Inventario y ventas en tiempo real</p>
          </div>
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-teal-700"
          >
            <History className="h-5 w-5" />
            Ver Historial ({transactions.length})
          </button>
        </div>
      </div>

      {error ? <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}
      {notice ? <p className="mb-4 rounded-lg bg-teal-50 px-4 py-3 text-sm text-teal-700">{notice}</p> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-lg bg-white p-4 shadow-lg">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full rounded-lg border-2 border-gray-200 py-2 pl-10 pr-4 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-lg">
            {isLoading ? (
              <p className="py-8 text-center text-gray-500">Cargando productos...</p>
            ) : (
              <ProductGrid products={products} onAddToCart={addToCart} />
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <Cart
              items={cartItems}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeItem}
              onCheckout={() => setShowCheckout(true)}
            />
          </div>
        </div>
      </div>

      {showCheckout && (
        <CheckoutModal
          items={cartItems}
          total={cartTotal}
          clients={clientOptions}
          selectedClient={selectedClient}
          isSubmitting={isSubmitting}
          onClientChange={setSelectedClient}
          onClose={() => setShowCheckout(false)}
          onCreateClient={createClient}
          onComplete={() => void completeTransaction()}
        />
      )}

      {showHistory && <TransactionHistory transactions={transactions} onClose={() => setShowHistory(false)} />}

      {isSubmitting ? <p className="mt-4 text-sm text-gray-500">Procesando venta...</p> : null}
    </div>
  );
}
