import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search, Star, ShoppingCart, MapPin, Users } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

function ProductCatalog() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const { addToCart } = useCart();
  const { user } = useAuth();

  const categories = ['all', 'Wedding', 'Corporate', 'Birthday', 'Conference', 'Concert', 'Festival'];
  const priceRanges = [
    { label: 'All Prices', value: 'all' },
    { label: 'Under ₹5,000', value: '0-5000' },
    { label: '₹5,000 - ₹15,000', value: '5000-15000' },
    { label: '₹15,000 - ₹30,000', value: '15000-30000' },
    { label: 'Above ₹30,000', value: '30000+' }
  ];

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('events').select('*');
      if (error) {
        console.error('Error fetching events:', error);
      } else {
        setEvents(data);
      }
      setLoading(false);
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    let filtered = events;

    if (searchTerm) {
      filtered = filtered.filter(event => event.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.type === selectedCategory);
    }
    if (priceRange !== 'all') {
      if (priceRange === '30000+') {
        filtered = filtered.filter(event => event.price > 30000);
      } else {
        const [min, max] = priceRange.split('-').map(Number);
        filtered = filtered.filter(event => event.price >= min && event.price <= max);
      }
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'name': default: return a.name.localeCompare(b.name);
      }
    });

    setFilteredEvents(filtered);
  }, [events, searchTerm, selectedCategory, priceRange, sortBy]);

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const handleAddToCart = (event) => {
    addToCart(event);
    alert(`${event.name} added to cart!`);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Event Catalog</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input type="text" placeholder="Search events..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
            {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
          </select>
          <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
            {priceRanges.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
            <option value="name">Sort by Name</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading events...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <Search className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium">No events found</h3>
          <p className="text-gray-500">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <img src={event.image_url || `https://picsum.photos/400/250?random=${event.id}`} alt={event.name} className="w-full h-48 object-cover" />
              <div className="p-4">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 text-xs font-medium rounded">{event.type}</span>
                <h3 className="font-semibold text-gray-900 mt-2 mb-2 line-clamp-1">{event.name}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                  <span className="flex items-center"><MapPin className="h-4 w-4 mr-1" />{event.location}</span>
                  <span className="flex items-center"><Users className="h-4 w-4 mr-1" />{event.capacity}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">{formatCurrency(event.price)}</span>
                    <p className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString('en-IN')}</p>
                  </div>
                  {user?.role === 'user' && (
                    <button onClick={() => handleAddToCart(event)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                      <ShoppingCart className="h-4 w-4" />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductCatalog;
