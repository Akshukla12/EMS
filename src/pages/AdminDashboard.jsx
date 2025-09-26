import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Users, Package, TrendingUp, IndianRupee, AlertCircle, CheckCircle, Calendar } from 'lucide-react';

function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const [usersCount, vendorsCount, eventsCount, ordersData, recentOrdersData, recentUsersData] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'vendor'),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total_price'),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5)
      ]);

      const totalRevenue = ordersData.data?.reduce((sum, order) => sum + order.total_price, 0) || 0;
      
      setStats({
        totalUsers: usersCount.count,
        totalVendors: vendorsCount.count,
        totalEvents: eventsCount.count,
        totalRevenue: totalRevenue,
      });

      setRecentOrders(recentOrdersData.data);
      setRecentUsers(recentUsersData.data);
      setLoading(false);
    };

    fetchData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'confirmed': return <Calendar className="h-4 w-4 text-blue-500" />;
      default: return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      user: 'bg-gray-100 text-gray-800',
      vendor: 'bg-blue-100 text-blue-800',
      admin: 'bg-purple-100 text-purple-800'
    };
    return `px-2 py-1 text-xs font-medium rounded-full ${colors[role]}`;
  };
  
  if (loading) {
    return <div className="text-center p-8">Loading dashboard data...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} title="Total Users" value={stats.totalUsers?.toLocaleString('en-IN')} color="blue" />
        <StatCard icon={Package} title="Total Vendors" value={stats.totalVendors} color="green" />
        <StatCard icon={IndianRupee} title="Total Revenue" value={formatCurrency(stats.totalRevenue)} color="purple" />
        <StatCard icon={TrendingUp} title="Active Events" value={stats.totalEvents} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <h3 className="px-6 py-4 border-b text-lg font-medium">Recent Orders</h3>
          <div className="p-6 space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(order.status)}
                  <div>
                    <p className="font-medium text-gray-900">{order.customer_details?.name || 'N/A'}</p>
                    <p className="text-sm text-gray-500">Order #{order.id.slice(-6)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatCurrency(order.total_price)}</p>
                  <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <h3 className="px-6 py-4 border-b text-lg font-medium">New Registrations</h3>
          <div className="p-6 space-y-4">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <div className="text-right">
                  <span className={getRoleBadge(user.role)}>{user.role}</span>
                  <p className="text-sm text-gray-500 mt-1">{new Date(user.created_at).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, color }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon className={`h-8 w-8 text-${color}-600`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
