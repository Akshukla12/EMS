import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Calendar, Clock, MapPin, Star, Heart, ShoppingCart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

function UserDashboard() {
  const { user } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);

      // Fetch user profile
      const { data: profileData } = await supabase.from('profiles').select('role').eq('user_id', user.id).single();
      setProfile(profileData);

      // Fetch upcoming events from orders
      const { data: orders } = await supabase
        .from('orders')
        .select('order_items(events(*))')
        .eq('user_id', user.id)
        .in('status', ['confirmed', 'pending']);
      
      const upcoming = orders?.flatMap(o => o.order_items.map(oi => oi.events)) || [];
      setUpcomingEvents(upcoming.slice(0, 3));

      // Fetch recommended events
      const { data: recommended } = await supabase.from('events').select('*').limit(6);
      setRecommendedEvents(recommended || []);

      setLoading(false);
    };
    fetchData();
  }, [user]);

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const getMembershipBadge = () => {
    const role = profile?.role || 'user';
    const colors = { user: 'bg-gray-100 text-gray-800', vendor: 'bg-blue-100 text-blue-800', admin: 'bg-purple-100 text-purple-800' };
    return `px-3 py-1 text-sm font-medium rounded-full ${colors[role]}`;
  };

  if (loading) return <div className="text-center p-8">Loading your dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name}!</h1>
            <p className="text-blue-100">Discover amazing events and manage your bookings</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">Membership Status</p>
            <span className={getMembershipBadge()}>
              {(profile?.role || 'user').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {upcomingEvents.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <h3 className="px-6 py-4 border-b text-lg font-medium">Your Upcoming Events</h3>
          <div className="p-6 space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-600 text-white p-3 rounded-lg"><Calendar className="h-6 w-6" /></div>
                  <div>
                    <h4 className="font-medium">{event.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <span className="flex items-center"><Clock className="h-4 w-4 mr-1" />{new Date(event.date).toLocaleDateString('en-IN')}</span>
                      <span className="flex items-center"><MapPin className="h-4 w-4 mr-1" />{event.location}</span>
                    </div>
                  </div>
                </div>
                <Link to="/orders" className="text-blue-600 font-medium hover:underline">View Booking</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <h3 className="px-6 py-4 border-b text-lg font-medium">Recommended for You</h3>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedEvents.map((event) => (
              <Link to="/products" key={event.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow group">
                <img src={event.image_url || `https://picsum.photos/400/250?random=${event.id}`} alt={event.name} className="w-full h-40 object-cover" />
                <div className="p-4">
                  <h4 className="font-semibold line-clamp-1 group-hover:text-blue-600">{event.name}</h4>
                  <p className="text-sm text-gray-500">{event.type}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-bold text-lg">{formatCurrency(event.price)}</span>
                    <span className="flex items-center text-sm"><Star className="h-4 w-4 text-yellow-400 mr-1" /> {event.rating || 'N/A'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
