import { ShoppingCart } from "lucide-react";

export function AppLoader({ label = "Cargando..." }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ backgroundColor: "#103436" }}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl">
        <div className="mb-4 flex items-center justify-center gap-2">
          <ShoppingCart className="h-8 w-8 text-teal-600" />
          <h1 className="text-2xl font-bold text-gray-800">M&H Super Market</h1>
        </div>
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-teal-600" />
        <p className="text-sm font-medium text-gray-600">{label}</p>
      </div>
    </div>
  );
}
