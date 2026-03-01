import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { ShoppingCart, Package, Users, TrendingUp, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, can } = useAuth();

  const navItems = [
    can('view_pos') ? { path: '/', label: 'PDV', icon: ShoppingCart } : null,
    can('view_products') ? { path: '/products', label: 'Productos', icon: Package } : null,
    can('view_clients') ? { path: '/clients', label: 'Clientes', icon: Users } : null,
    can('view_sales') ? { path: '/sales', label: 'Ventas', icon: TrendingUp } : null,
    can('view_purchases') ? { path: '/purchases', label: 'Compras', icon: ShoppingBag } : null,
    can('manage_roles') || can('manage_users') ? { path: '/admin', label: 'Admin', icon: ShieldCheck } : null,
  ].filter(Boolean) as { path: string; label: string; icon: typeof ShoppingCart }[];

  const handleLogout = () => {
    void logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#103436' }}>
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-8 h-8 text-teal-600" />
              <h1 className="text-xl font-bold text-gray-800">M&H Software House</h1>
            </div>
            <div className="flex gap-2 items-center">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                      isActive
                        ? 'bg-teal-600 text-white'
                        : 'text-gray-700 hover:bg-teal-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg font-semibold text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <div className="p-6">
        <Outlet />
      </div>
    </div>
  );
}
