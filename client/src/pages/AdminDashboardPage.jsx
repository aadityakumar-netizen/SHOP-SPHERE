import React, { useEffect, useState } from 'react';
import adminService from '../services/adminService';
import productService from '../services/productService';
import AdminProductModal from '../components/AdminProductModal';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  Shield,
  DollarSign,
  Package,
  Layers,
  Users,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Clock,
  ArrowRight,
  Loader2,
  Check,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'products' | 'orders'

  // Overview Stats
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Products Table
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productsLoading, setProductsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Orders Table
  const [orders, setOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Feedback notifications
  const [feedback, setFeedback] = useState(null);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Load Dashboard Stats
  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const data = await adminService.getStats();
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      showFeedback('error', err.message || 'Failed to load admin metrics.');
    } finally {
      setStatsLoading(false);
    }
  };

  // Load Products
  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const [prodData, catData] = await Promise.all([
        productService.getProducts({ search: productSearch, limit: 50 }),
        productService.getCategories(),
      ]);
      setProducts(prodData.products || []);
      setCategories(catData.categories || []);
    } catch (err) {
      showFeedback('error', err.message || 'Failed to load products.');
    } finally {
      setProductsLoading(false);
    }
  };

  // Load Orders
  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const data = await adminService.getAllOrders({
        orderStatus: orderFilter,
        paymentStatus: paymentFilter,
        limit: 50,
      });
      setOrders(data.orders || []);
    } catch (err) {
      showFeedback('error', err.message || 'Failed to load orders.');
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'products') {
      loadProducts();
    } else if (activeTab === 'orders') {
      loadOrders();
    }
  }, [activeTab, orderFilter, paymentFilter]);

  // Product CRUD Handlers
  const handleSaveProduct = async (productData, productId) => {
    if (productId) {
      await adminService.updateProduct(productId, productData);
      showFeedback('success', `Product "${productData.name}" updated successfully.`);
    } else {
      await adminService.createProduct(productData);
      showFeedback('success', `Product "${productData.name}" created successfully.`);
    }
    loadProducts();
    loadStats();
  };

  const handleDeleteProduct = async (product) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${product.name}"? This action cannot be undone.`
      )
    ) {
      try {
        await adminService.deleteProduct(product._id);
        showFeedback('success', `Product "${product.name}" was deleted.`);
        loadProducts();
        loadStats();
      } catch (err) {
        showFeedback('error', err.message || 'Failed to delete product.');
      }
    }
  };

  // Order Fulfillment Status Update Handler
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await adminService.updateOrderStatus(orderId, newStatus);
      showFeedback('success', `Order fulfillment status updated to "${newStatus}".`);
      loadOrders();
      loadStats();
    } catch (err) {
      showFeedback('error', err.message || 'Failed to update order status.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200 uppercase tracking-wider flex items-center gap-1">
              <Shield className="w-3 h-3 text-purple-600" /> Admin Access
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            ShopSphere Admin Portal
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage product inventory, track customer purchases, and update fulfillment state transitions.
          </p>
        </div>

        <button
          onClick={() => {
            loadStats();
            if (activeTab === 'products') loadProducts();
            if (activeTab === 'orders') loadOrders();
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Dashboard Overview
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'products'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Inventory & Products ({stats?.inventory?.totalProducts || '...'})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'orders'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Customer Orders ({stats?.totalOrders || '...'})
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {statsLoading ? (
            <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Loading dashboard metrics...</span>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Revenue */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold uppercase tracking-wider">Paid Revenue</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-slate-900">
                  {formatCurrency(stats.revenuePaise)}
                </p>
                <p className="text-[11px] text-slate-400 font-mono">
                  ({stats.revenuePaise} integer paise)
                </p>
              </div>

              {/* Total Orders */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold uppercase tracking-wider">Total Orders</span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-slate-900">{stats.totalOrders}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded font-bold">
                    {stats.statusCounts?.placed || 0} Placed
                  </span>
                  <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded font-bold">
                    {stats.statusCounts?.processing || 0} Processing
                  </span>
                </div>
              </div>

              {/* Active Products */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold uppercase tracking-wider">Active Inventory</span>
                  <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-slate-900">
                  {stats.inventory?.totalProducts} Items
                </p>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-amber-600 font-semibold">
                    {stats.inventory?.lowStockProducts} low stock
                  </span>
                  <span>•</span>
                  <span className="text-rose-600 font-semibold">
                    {stats.inventory?.outOfStockProducts} out of stock
                  </span>
                </div>
              </div>

              {/* Customers */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold uppercase tracking-wider">Registered Users</span>
                  <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-slate-900">{stats.totalCustomers}</p>
                <p className="text-[11px] text-slate-400">Customer accounts</p>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Tab 2: Products Management */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            {/* Search */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products by title or category..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadProducts}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Search
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedProduct(null);
                  setModalOpen(true);
                }}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productsLoading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-600 mx-auto mb-2" />
                        <span>Loading inventory...</span>
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        No products found matching your search.
                      </td>
                    </tr>
                  ) : (
                    products.map((prod) => {
                      const isOutOfStock = prod.stock === 0;
                      const isLowStock = prod.stock > 0 && prod.stock <= 5;

                      return (
                        <tr key={prod._id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={prod.imageUrl}
                                alt={prod.name}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                              />
                              <div>
                                <p className="font-semibold text-slate-900 line-clamp-1">
                                  {prod.name}
                                </p>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  ID: {prod._id.slice(-8)}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200">
                              {prod.category}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">
                              {formatCurrency(prod.pricePaise)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {prod.pricePaise} paise
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {isOutOfStock ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                                Out of Stock (0)
                              </span>
                            ) : isLowStock ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold animate-pulse">
                                Low Stock ({prod.stock})
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                {prod.stock} in stock
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProduct(prod);
                                  setModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                                title="Edit Product"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(prod)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Orders & Fulfillment Management */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-xs">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-700">Filters:</span>
              <select
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">All Fulfillment Statuses</option>
                <option value="placed">Placed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">All Payment Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <span className="text-slate-400">Total: {orders.length} orders listed</span>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Order ID & Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Fulfillment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ordersLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-600 mx-auto mb-2" />
                        <span>Loading orders...</span>
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        No orders found matching the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    orders.map((ord) => {
                      const isPaid = ord.paymentStatus === 'paid';

                      return (
                        <tr key={ord._id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono text-slate-800 font-semibold block">
                              {ord._id}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {formatDate(ord.createdAt)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-800">
                              {ord.user?.name || ord.shippingAddress?.fullName}
                            </p>
                            <p className="text-[10px] text-slate-400">{ord.user?.email}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800">
                              {ord.orderItems?.length || 0} items
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {formatCurrency(ord.totalAmountPaise)}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                isPaid
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {ord.paymentStatus.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {/* State Transition Dropdown */}
                            <select
                              value={ord.orderStatus}
                              disabled={
                                ord.orderStatus === 'delivered' || ord.orderStatus === 'cancelled'
                              }
                              onChange={(e) =>
                                handleUpdateOrderStatus(ord._id, e.target.value)
                              }
                              className={`text-[11px] font-semibold rounded-xl px-2.5 py-1 border transition-colors cursor-pointer ${
                                ord.orderStatus === 'delivered'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 cursor-not-allowed'
                                  : ord.orderStatus === 'shipped'
                                  ? 'bg-violet-50 text-violet-800 border-violet-200'
                                  : ord.orderStatus === 'processing'
                                  ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                  : ord.orderStatus === 'cancelled'
                                  ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                                  : 'bg-blue-50 text-blue-800 border-blue-200'
                              }`}
                            >
                              <option value="placed">Placed</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Admin Product Create/Edit Modal */}
      <AdminProductModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveProduct}
        product={selectedProduct}
        categories={categories}
      />
    </div>
  );
}
