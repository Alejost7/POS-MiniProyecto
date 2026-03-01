import { useState } from 'react';
import { ProductGrid } from '../components/ProductGrid';
import { Cart, CartItem } from '../components/Cart';
import { CheckoutModal } from '../components/CheckoutModal';
import { TransactionHistory, Transaction } from '../components/TransactionHistory';
import { History, Search } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

const MOCK_PRODUCTS: Product[] = [
  // Food
  { id: '1', name: 'Hamburguesa', price: 12.99, category: 'Comida' },
  { id: '2', name: 'Pizza Porción', price: 8.50, category: 'Comida' },
  { id: '3', name: 'Sándwich', price: 9.99, category: 'Comida' },
  { id: '4', name: 'Ensalada', price: 11.50, category: 'Comida' },
  { id: '5', name: 'Pasta', price: 13.99, category: 'Comida' },
  { id: '6', name: 'Tacos (3pc)', price: 10.99, category: 'Comida' },
  
  // Drinks
  { id: '7', name: 'Coca Cola', price: 2.99, category: 'Bebidas' },
  { id: '8', name: 'Jugo de Naranja', price: 3.99, category: 'Bebidas' },
  { id: '9', name: 'Café', price: 4.50, category: 'Bebidas' },
  { id: '10', name: 'Té Helado', price: 3.50, category: 'Bebidas' },
  { id: '11', name: 'Agua', price: 1.99, category: 'Bebidas' },
  { id: '12', name: 'Batido', price: 5.99, category: 'Bebidas' },
  
  // Snacks
  { id: '13', name: 'Papas Fritas', price: 3.99, category: 'Snacks' },
  { id: '14', name: 'Galletas', price: 4.50, category: 'Snacks' },
  { id: '15', name: 'Barra de Chocolate', price: 2.50, category: 'Snacks' },
  { id: '16', name: 'Palomitas', price: 3.50, category: 'Snacks' },
  
  // Desserts
  { id: '17', name: 'Helado', price: 6.99, category: 'Postres' },
  { id: '18', name: 'Porción de Pastel', price: 7.50, category: 'Postres' },
  { id: '19', name: 'Brownie', price: 5.50, category: 'Postres' },
  { id: '20', name: 'Donut', price: 3.99, category: 'Postres' },
];

export default function POS() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['Todos', ...Array.from(new Set(MOCK_PRODUCTS.map(p => p.category)))];

  const filteredProducts = MOCK_PRODUCTS.filter(product => {
    const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: Product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const handleCheckout = () => {
    setShowCheckout(true);
  };

  const completeTransaction = (paymentMethod: string) => {
    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    const newTransaction: Transaction = {
      id: (transactions.length + 1).toString().padStart(4, '0'),
      date: new Date().toLocaleString(),
      items: itemCount,
      total,
      paymentMethod,
    };

    setTransactions(prev => [newTransaction, ...prev]);
    setCartItems([]);
    setShowCheckout(false);
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Punto de Venta</h1>
          <button
            onClick={() => setShowHistory(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold transition-colors"
          >
            <History className="w-5 h-5" />
            Ver Historial ({transactions.length})
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-3 flex-wrap">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    selectedCategory === category
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <ProductGrid products={filteredProducts} onAddToCart={addToCart} />
          </div>
        </div>

        {/* Cart Section */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <Cart
              items={cartItems}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeItem}
              onCheckout={handleCheckout}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCheckout && (
        <CheckoutModal
          items={cartItems}
          total={cartTotal}
          onClose={() => setShowCheckout(false)}
          onComplete={completeTransaction}
        />
      )}

      {showHistory && (
        <TransactionHistory
          transactions={transactions}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}