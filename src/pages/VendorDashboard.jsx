import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import EventForm from '../components/EventForm';
import { Package, Calendar, IndianRupee, TrendingUp, Plus, Edit, Eye, Trash } from 'lucide-react';

function VendorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('vendor_id', user.id)
      .order('created_at', { ascending: false });

    if (eventsError) console.error('Error fetching events:', eventsError);
    else setMyEvents(events || []);

    // Fetch stats
    const { count: eventsCount } = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('vendor_id', user.id);
    
    // More complex stats like revenue/bookings would need more queries or DB functions.
    // For now, we'll keep it simple.
    setStats({
      totalEvents: eventsCount,
      totalBookings: 0, // Placeholder
      monthlyRevenue: 0, // Placeholder
    });

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    fetchData(); // Refresh data after saving
  };

  const handleDelete = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      const { error } = await supabase.from('events').delete().eq('id', eventId);
      if (error) {
        alert('Error deleting event: ' + error.message);
      } else {
        fetchData();
      }
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const getStatusBadge = (status) => {
    const colors = { active: 'bg-green-100 text-green-800', draft: 'bg-yellow-100 text-yellow-800' };
    return `px-2 py-1 text-xs font-medium rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`;
  };

  if (loading) return <div className="text-center p-8">Loading your dashboard...</div>;

  return (
    <div className="space-y-6">
      {isModalOpen && <EventForm event={selectedEvent} onSave={handleSave} onClose={() => { setIsModalOpen(false); setSelectedEvent(null); }} />}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
        <button onClick={() => { setSelectedEvent(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Add Event</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Package} title="Total Events" value={stats.totalEvents} />
        <StatCard icon={Calendar} title="Total Bookings" value={stats.totalBookings} />
        <StatCard icon={IndianRupee} title="Monthly Revenue" value={formatCurrency(stats.monthlyRevenue)} />
        <StatCard icon={TrendingUp} title="Pending Orders" value={stats.pendingOrders || 0} />
      </div>

      <div className="bg-white rounded-lg shadow">
        <h3 className="px-6 py-4 border-b text-lg font-medium">My Events</h3>
        <div className="p-6">
          {myEvents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">You haven't created any events yet.</p>
              <button onClick={() => setIsModalOpen(true)} className="mt-4 text-blue-600 font-medium">Create your first event</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myEvents.map((event) => (
                <div key={event.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium line-clamp-1">{event.name}</h4>
                    <span className={getStatusBadge('active')}>{ 'Active' }</span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><span className="font-medium">Price:</span> {formatCurrency(event.price)}</p>
                    <p><span className="font-medium">Capacity:</span> {event.capacity} people</p>
                    <p><span className="font-medium">Date:</span> {new Date(event.date).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div className="flex justify-end items-center mt-4 pt-4 border-t space-x-2">
                    <button onClick={() => { setSelectedEvent(event); setIsModalOpen(true); }} className="text-blue-600 hover:text-blue-800 p-1"><Edit className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(event.id)} className="text-red-600 hover:red-800 p-1"><Trash className="h-4 w-4" /></button>
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

function StatCard({ icon: Icon, title, value }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <Icon className="h-8 w-8 text-blue-600" />
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default VendorDashboard;
