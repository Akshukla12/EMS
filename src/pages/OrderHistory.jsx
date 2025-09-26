import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Package, Eye, CheckCircle, Clock, XCircle } from 'lucide-react';

function OrderHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let finalOrders = [];
    let fetchError = null;

    if (user.role === 'vendor') {
      // A multi-step fetch to safely get vendor orders and avoid RLS recursion.
      // 1. Get the vendor's event IDs.
      const { data: vendorEvents, error: eventsError } = await supabase
        .from('events')
        .select('id')
        .eq('vendor_id', user.id);

      if (eventsError) {
        fetchError = eventsError;
      } else {
        const eventIds = vendorEvents.map(e => e.id);
        if (eventIds.length > 0) {
          // 2. Find all order_items that belong to these events.
          const { data: orderItems, error: itemsError } = await supabase
            .from('order_items')
            .select('order_id')
            .in('event_id', eventIds);

          if (itemsError) {
            fetchError = itemsError;
          } else {
            // 3. Get a unique list of order IDs from the items.
            const orderIds = [...new Set(orderItems.map(item => item.order_id))];

            if (orderIds.length > 0) {
              // 4. Fetch the full order details for only those unique order IDs.
              const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('*, order_items(*, events(name, vendor_id))')
                .in('id', orderIds);

              if (ordersError) {
                fetchError = ordersError;
              } else {
                // For a vendor, filter items within each order to show only their items
                // and calculate their portion of the total.
                const ordersWithVendorItems = ordersData.map(order => {
                  const vendorItems = order.order_items.filter(item => eventIds.includes(item.event_id));
                  const vendorTotal = vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                  return {
                    ...order,
                    order_items: vendorItems,
                    total_price: vendorTotal, // Show only the vendor's portion of the revenue.
                  };
                });
                finalOrders = ordersWithVendorItems;
              }
            }
          }
        }
      }
    } else {
      // Logic for 'user' and 'admin' roles.
      let query = supabase.from('orders').select('*, order_items(*, events(name, vendor_id))');
      if (user.role === 'user') {
        query = query.eq('user_id', user.id);
      }
      const { data, error } = await query;
      if (error) {
        fetchError = error;
      } else {
        finalOrders = data || [];
      }
    }

    if (fetchError) {
      console.error('Error fetching orders:', fetchError);
      setOrders([]);
    } else {
      let filteredOrders = finalOrders;
      if (filter !== 'all') {
        filteredOrders = finalOrders.filter(order => order.status === filter);
      }
      
      filteredOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setOrders(filteredOrders);
    }
    
    setLoading(false);
  }, [user, filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  const getStatusBadge = (status) => {
    const colors = { pending: 'bg-yellow-100 text-yellow-800', confirmed: 'bg-blue-100 text-blue-800', completed: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800' };
    return `px-3 py-1 text-sm font-medium rounded-full ${colors[status] || ''}`;
  };

  if (loading) return <div className="text-center py-12">Loading order history...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{user?.role === 'vendor' ? 'My Sales' : (user?.role === 'admin' ? 'All Orders' : 'My Orders')}</h1>
      
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((tab) => (
              <button key={tab} onClick={() => setFilter(tab)} className={`py-4 px-1 border-b-2 font-medium text-sm ${filter === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium">No orders found</h3>
            <p className="text-gray-500">
              {loading ? '' : `No ${filter !== 'all' ? filter : ''} orders found.`}
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Order #{order.id.slice(-8)}</h3>
                  <p className="text-sm text-gray-500">Placed on {formatDate(order.created_at)}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={getStatusBadge(order.status)}>{order.status}</span>
                  <button onClick={() => setSelectedOrder(order)} className="text-blue-600 p-2 hover:bg-blue-50 rounded-full"><Eye className="h-5 w-5" /></button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium text-sm mb-1">Customer</h4>
                  <p className="text-gray-600">{order.customer_details?.name}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">Items</h4>
                  <p className="text-gray-600">{order.order_items.length}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">{user?.role === 'vendor' ? 'My Revenue' : 'Total'}</h4>
                  <p className="font-semibold text-blue-600">{formatCurrency(order.total_price)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} formatCurrency={formatCurrency} formatDate={formatDate} />}
    </div>
  );
}

function OrderDetailsModal({ order, onClose, formatCurrency, formatDate }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Order Details #{order.id.slice(-8)}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Customer Details</h4>
            <div className="text-sm bg-gray-50 p-3 rounded-lg">
              <p><strong>Name:</strong> {order.customer_details.name}</p>
              <p><strong>Email:</strong> {order.customer_details.email}</p>
              <p><strong>Phone:</strong> {order.customer_details.phone}</p>
              <p><strong>Address:</strong> {`${order.customer_details.address}, ${order.customer_details.city}`}</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Order Items</h4>
            <div className="space-y-2">
              {order.order_items.map(item => (
                <div key={item.id} className="flex justify-between p-2 border rounded-lg">
                  <div>
                    <p className="font-medium">{item.events?.name || 'Event not found'}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-lg font-semibold text-blue-600">{formatCurrency(order.total_price)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderHistory;
