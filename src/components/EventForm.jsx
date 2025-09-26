import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

function EventForm({ event, onSave, onClose }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    type: 'Corporate',
    description: '',
    price: '',
    capacity: '',
    date: '',
    image_url: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const eventTypes = ['Wedding', 'Corporate', 'Birthday', 'Conference', 'Concert', 'Festival'];

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || '',
        type: event.type || 'Corporate',
        description: event.description || '',
        price: event.price || '',
        capacity: event.capacity || '',
        date: event.date ? new Date(event.date).toISOString().substring(0, 10) : '',
        image_url: event.image_url || '',
        location: event.location || '',
      });
    }
  }, [event]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const eventPayload = {
      name: formData.name,
      type: formData.type,
      description: formData.description,
      price: parseFloat(formData.price),
      capacity: parseInt(formData.capacity, 10),
      date: formData.date,
      image_url: formData.image_url,
      location: formData.location,
    };

    let response;
    if (event?.id) {
      // Update existing event
      response = await supabase
        .from('events')
        .update(eventPayload)
        .eq('id', event.id)
        .eq('vendor_id', user.id); // Ensure vendor can only update their own events
    } else {
      // Create new event
      const newEventData = {
        ...eventPayload,
        vendor_id: user.id,
      };
      response = await supabase
        .from('events')
        .insert(newEventData);
    }

    const { error: dbError } = response;

    if (dbError) {
      setError(dbError.message);
    } else {
      onSave();
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">{event ? 'Edit Event' : 'Create New Event'}</h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                <select name="type" value={formData.type} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  {eventTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input type="text" name="location" value={formData.location} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-md"></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                <input type="number" name="price" value={formData.price} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input type="number" name="capacity" value={formData.capacity} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <input type="url" name="image_url" value={formData.image_url} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="https://example.com/image.png" />
            </div>
          </div>

          {error && <div className="mt-4 text-red-600 text-sm">{error}</div>}

          <div className="mt-6 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EventForm;
