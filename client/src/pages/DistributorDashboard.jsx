import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { 
  HomeIcon,
  ShoppingBagIcon,
  TruckIcon,
  UsersIcon,
  ChartBarIcon,
  CubeIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import ProductList from '../components/products/ProductList';

const navigation = [
  { name: 'Dashboard', icon: HomeIcon, current: true },
  { name: 'Products', icon: CubeIcon, current: false },
  { name: 'Orders', icon: ShoppingBagIcon, current: false },
  { name: 'Deliveries', icon: TruckIcon, current: false },
  { name: 'Customers', icon: UsersIcon, current: false },
  { name: 'Reports', icon: ChartBarIcon, current: false },
  { name: 'Settings', icon: Cog6ToothIcon, current: false },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const DistributorDashboard = () => {
  const { user, logout } = useAuth();
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [consumers, setConsumers] = useState([]);
  const [consumersLoading, setConsumersLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedConsumerId, setSelectedConsumerId] = useState('');
  const [search, setSearch] = useState('');
  const [showConsumerModal, setShowConsumerModal] = useState(false);
  const [activeConsumer, setActiveConsumer] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  // Reports state
  const [reportFrom, setReportFrom] = useState('');
  const [reportTo, setReportTo] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [summary, setSummary] = useState({ ordersCount: 0, totalRevenue: 0, deliveredCount: 0, avgOrderValue: 0 });
  const [topProducts, setTopProducts] = useState([]);
  const [dailySales, setDailySales] = useState([]);

  // Fetch consumers for this distributor
  const fetchConsumers = async () => {
    try {
      setConsumersLoading(true);
      const res = await api.get('/distributor/consumers');
      if (res.data?.success) setConsumers(res.data.data || []);
    } catch (e) {
      console.error('Error loading consumers', e);
      setConsumers([]);
    } finally {
      setConsumersLoading(false);
    }
  };

  // Fetch orders (optionally filter by consumer)
  const fetchOrders = async (consumerId = '') => {
    try {
      setOrdersLoading(true);
      const res = await api.get('/distributor/orders', {
        params: consumerId ? { consumerId } : {}
      });
      if (res.data?.success) setOrders(res.data.data || []);
    } catch (e) {
      console.error('Error loading orders', e);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Load data when switching sections
  useEffect(() => {
    if (currentSection === 'customers') {
      fetchConsumers();
    } else if (currentSection === 'orders') {
      fetchConsumers(); // to populate filter
      fetchOrders(selectedConsumerId);
    } else if (currentSection === 'reports') {
      fetchReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSection]);

  // Refetch orders when filter changes
  useEffect(() => {
    if (currentSection === 'orders') {
      fetchOrders(selectedConsumerId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConsumerId]);

  const reportsQueryParams = () => {
    const params = {};
    if (reportFrom) params.from = reportFrom;
    if (reportTo) params.to = reportTo;
    return params;
  };

  const fetchReports = async () => {
    try {
      setReportLoading(true);
      const [sumRes, topRes, dailyRes] = await Promise.all([
        api.get('/distributor/reports/summary', { params: reportsQueryParams() }),
        api.get('/distributor/reports/top-products', { params: { ...reportsQueryParams(), limit: 10 } }),
        api.get('/distributor/reports/daily-sales', { params: reportsQueryParams() }),
      ]);
      if (sumRes.data?.success) setSummary(sumRes.data.data || summary);
      if (topRes.data?.success) setTopProducts(topRes.data.data || []);
      if (dailyRes.data?.success) setDailySales(dailyRes.data.data || []);
    } catch (e) {
      console.error('Error loading reports', e);
      setSummary({ ordersCount: 0, totalRevenue: 0, deliveredCount: 0, avgOrderValue: 0 });
      setTopProducts([]);
      setDailySales([]);
    } finally {
      setReportLoading(false);
    }
  };

  const exportCsv = (rows, headers, filename) => {
    const csv = [headers.join(',')]
      .concat(rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(',')))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderSection = () => {
    switch (currentSection) {
      case 'products':
        return <ProductList />;
      case 'customers':
        return (
          <div className="bg-white shadow rounded-lg">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Consumers</h3>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email"
                  className="w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              {consumersLoading ? (
                <p className="text-gray-500">Loading consumers...</p>) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {consumers
                        .filter(c => {
                          const q = search.toLowerCase();
                          return !q || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
                        })
                        .map(c => (
                        <tr key={c._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.phone || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => { setActiveConsumer(c); setShowConsumerModal(true); }}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {consumers.length === 0 && (
                    <p className="text-gray-500 p-4">No consumers assigned.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-4 sm:p-6">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">From</label>
                    <input type="date" value={reportFrom} onChange={e => setReportFrom(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">To</label>
                    <input type="date" value={reportTo} onChange={e => setReportTo(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={fetchReports} className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50" disabled={reportLoading}>{reportLoading ? 'Loading...' : 'Refresh'}</button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white shadow rounded-lg p-4">
                <div className="text-sm text-gray-500">Orders</div>
                <div className="text-2xl font-semibold text-gray-900">{summary.ordersCount}</div>
              </div>
              <div className="bg-white shadow rounded-lg p-4">
                <div className="text-sm text-gray-500">Delivered</div>
                <div className="text-2xl font-semibold text-gray-900">{summary.deliveredCount}</div>
              </div>
              <div className="bg-white shadow rounded-lg p-4">
                <div className="text-sm text-gray-500">Revenue</div>
                <div className="text-2xl font-semibold text-gray-900">₹{Number(summary.totalRevenue).toFixed(2)}</div>
              </div>
              <div className="bg-white shadow rounded-lg p-4">
                <div className="text-sm text-gray-500">Avg Order Value</div>
                <div className="text-2xl font-semibold text-gray-900">₹{Number(summary.avgOrderValue).toFixed(2)}</div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg">
              <div className="p-4 sm:p-6 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Top Products</h3>
                <button onClick={() => exportCsv(topProducts.map(r => ({ name: r.name, quantity: r.quantity, revenue: r.revenue })), ['name','quantity','revenue'], 'top-products.csv')} className="px-3 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200">Export CSV</button>
              </div>
              <div className="px-4 pb-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topProducts.map((p, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{Number(p.revenue).toFixed(2)}</td>
                      </tr>
                    ))}
                    {topProducts.length === 0 && (
                      <tr><td className="px-6 py-4 text-sm text-gray-500" colSpan="3">No data</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg">
              <div className="p-4 sm:p-6 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Daily Sales</h3>
                <button onClick={() => exportCsv(dailySales.map(r => ({ date: r.date, orders: r.orders, revenue: r.revenue })), ['date','orders','revenue'], 'daily-sales.csv')} className="px-3 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200">Export CSV</button>
              </div>
              <div className="px-4 pb-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dailySales.map((r, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.orders}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{Number(r.revenue).toFixed(2)}</td>
                      </tr>
                    ))}
                    {dailySales.length === 0 && (
                      <tr><td className="px-6 py-4 text-sm text-gray-500" colSpan="3">No data</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'orders':
        return (
          <div className="bg-white shadow rounded-lg">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <h3 className="text-lg font-medium text-gray-900">Orders</h3>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Consumer:</label>
                  <select
                    value={selectedConsumerId}
                    onChange={(e) => setSelectedConsumerId(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All</option>
                    {consumers.map(c => (
                      <option key={c._id} value={c._id}>{c.name} ({c.email})</option>
                    ))}
                  </select>
                </div>
              </div>
              {ordersLoading ? (
                <p className="text-gray-500">Loading orders...</p>) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consumer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map(o => (
                        <tr key={o._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{o.orderNumber || o._id.substring(0,8)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div
                              className="max-w-[240px] truncate"
                              title={`${o.customer?.name || ''} (${o.customer?.email || ''})`}
                            >
                              {o.customer?.name} ({o.customer?.email})
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {o.products?.map(p => `${p.quantity} x ${p.name}`).join(', ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{o.totalAmount?.toFixed(2) || '0.00'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              o.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                              o.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'}`}>{o.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => { setActiveOrder(o); setShowOrderModal(true); }}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {orders.length === 0 && (
                    <p className="text-gray-500 p-4">No orders found.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      case 'dashboard':
      default:
        return (
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Distributor Dashboard
              </h2>
              <p className="text-gray-600">
                Welcome to the Milk Dairy Management System Distributor Panel
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Select a section from the sidebar to get started
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <>
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <div className="fixed inset-0 flex z-40">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <h1 className="text-xl font-semibold text-gray-900">
                  Distributor Panel
                </h1>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentSection(item.name.toLowerCase());
                      setSidebarOpen(false);
                    }}
                    className={classNames(
                      currentSection === item.name.toLowerCase()
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      'group flex items-center px-2 py-2 text-base font-medium rounded-md'
                    )}
                  >
                    <item.icon
                      className={classNames(
                        currentSection === item.name.toLowerCase() ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                        'mr-4 flex-shrink-0 h-6 w-6'
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </a>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div>
                  <div className="text-base font-medium text-gray-800">{user?.name}</div>
                  <div className="text-sm font-medium text-gray-500">Distributor</div>
                </div>
              </div>
              <button
                onClick={logout}
                className="ml-auto flex-shrink-0 bg-white p-1 text-gray-400 rounded-full hover:text-gray-500 focus:outline-none"
              >
                <span className="sr-only">Logout</span>
                <ArrowRightOnRectangleIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="flex-shrink-0 w-14">
            {/* Force sidebar to shrink to fit close icon */}
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-semibold text-gray-900">
                Distributor Panel
              </h1>
            </div>
            <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentSection(item.name.toLowerCase());
                  }}
                  className={classNames(
                    currentSection === item.name.toLowerCase()
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                  )}
                >
                  <item.icon
                    className={classNames(
                      currentSection === item.name.toLowerCase() ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                      'mr-3 flex-shrink-0 h-6 w-6'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div>
                <div className="text-base font-medium text-gray-800">{user?.name}</div>
                <div className="text-sm font-medium text-gray-500">Distributor</div>
              </div>
              <button
                onClick={logout}
                className="ml-auto flex-shrink-0 bg-white p-1 text-gray-400 rounded-full hover:text-gray-500 focus:outline-none"
              >
                <span className="sr-only">Logout</span>
                <ArrowRightOnRectangleIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              <h2 className="text-lg font-medium text-gray-900">
                {navigation.find(nav => nav.name.toLowerCase() === currentSection)?.name || 'Dashboard'}
              </h2>
            </div>
          </div>
        </div>

        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {renderSection()}
            </div>
          </div>
        </main>
      </div>
    </div>

    {/* Consumer Detail Modal */}
    {showConsumerModal && activeConsumer && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold">Consumer Details</h3>
            <button
              onClick={() => { setShowConsumerModal(false); setActiveConsumer(null); }}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="px-6 py-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Name</div>
                <div className="text-gray-900 font-medium">{activeConsumer.name || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <div className="text-gray-900 font-medium">{activeConsumer.email || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Phone</div>
                <div className="text-gray-900 font-medium">{activeConsumer.phone || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Created</div>
                <div className="text-gray-900 font-medium">{activeConsumer.createdAt ? new Date(activeConsumer.createdAt).toLocaleDateString() : '-'}</div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-1">Addresses</div>
              {Array.isArray(activeConsumer.addresses) && activeConsumer.addresses.length > 0 ? (
                <div className="space-y-2">
                  {activeConsumer.addresses.map((addr, idx) => (
                    <div key={idx} className="p-3 rounded border bg-gray-50">
                      <div className="text-sm text-gray-700">
                        {[addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ') || '—'}
                      </div>
                      {addr.landmark && (
                        <div className="text-xs text-gray-500">Landmark: {addr.landmark}</div>
                      )}
                      {addr.isDefault && (
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">Default</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No addresses</div>
              )}
            </div>
          </div>
          <div className="px-6 py-4 border-t flex justify-end">
            <button
              onClick={() => { setShowConsumerModal(false); setActiveConsumer(null); }}
              className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Order Detail Modal */}
    {showOrderModal && activeOrder && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold">Order Details</h3>
            <button
              onClick={() => { setShowOrderModal(false); setActiveOrder(null); }}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Order</div>
                <div className="text-gray-900 font-medium">{activeOrder.orderNumber || activeOrder._id?.substring(0,8)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Status</div>
                <div>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    activeOrder.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                    activeOrder.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'}`}>{activeOrder.status}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Consumer</div>
                <div className="text-gray-900 font-medium">{activeOrder.customer?.name} ({activeOrder.customer?.email})</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Created</div>
                <div className="text-gray-900 font-medium">{activeOrder.createdAt ? new Date(activeOrder.createdAt).toLocaleString() : '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Delivery Date</div>
                <div className="text-gray-900 font-medium">{activeOrder.deliveryDate ? new Date(activeOrder.deliveryDate).toLocaleDateString() : '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Time Slot</div>
                <div className="text-gray-900 font-medium capitalize">{activeOrder.deliveryTime || '-'}</div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-2">Products</div>
              <div className="overflow-hidden border rounded">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {activeOrder.products?.map((p, idx) => (
                      <tr key={idx} className="text-sm text-gray-700">
                        <td className="px-4 py-2">{p.name}</td>
                        <td className="px-4 py-2">{p.quantity}</td>
                        <td className="px-4 py-2">{p.unit}</td>
                        <td className="px-4 py-2">₹{Number(p.price || 0).toFixed(2)}</td>
                        <td className="px-4 py-2">₹{Number(p.totalPrice || (p.price * p.quantity) || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-right">
                <span className="text-sm text-gray-600 mr-2">Total:</span>
                <span className="text-lg font-semibold">₹{Number(activeOrder.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>

            {activeOrder.specialInstructions && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Special Instructions</div>
                <div className="text-gray-800 bg-gray-50 p-3 rounded">{activeOrder.specialInstructions}</div>
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t flex justify-end">
            <button
              onClick={() => { setShowOrderModal(false); setActiveOrder(null); }}
              className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default DistributorDashboard;
