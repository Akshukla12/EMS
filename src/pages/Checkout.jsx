import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { CreditCard, MapPin, User, Phone, Mail, Lock } from 'lucide-react';

function Checkout() {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['name', 'email', 'phone', 'address', 'city', 'state', 'pincode'];
    requiredFields.forEach(field => {
      if (!formData[field].trim()) newErrors[field] = 'This field is required';
    });
    if (formData.phone && !/^[6-9]\d{9}$/.test(formData.phone)) newErrors.phone = 'Invalid 10-digit phone number';
    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) newErrors.pincode = 'Invalid 6-digit pincode';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setProcessing(true);

    const total = getCartTotal(); // You might add tax/fees here
    
    // 1. Create the order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total_price: total,
        status: 'confirmed', // Or 'pending' if payment needs confirmation
        customer_details: formData,
      })
      .select()
      .single();

    if (orderError) {
      alert('Error creating order: ' + orderError.message);
      setProcessing(false);
      return;
    }

    // 2. Create the order items
    const orderItems = cartItems.map(item => ({
      order_id: orderData.id,
      event_id: item.id,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

    if (itemsError) {
      alert('Error saving order items: ' + itemsError.message);
      // Here you might want to delete the created order for consistency
      await supabase.from('orders').delete().eq('id', orderData.id);
      setProcessing(false);
      return;
    }

    // 3. Success
    clearCart();
    setProcessing(false);
    navigate('/orders', { state: { orderPlaced: true, orderId: orderData.id } });
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  if (cartItems.length === 0) {
    return <div className="text-center py-12"><h2>No items to checkout.</h2></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Billing Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Billing Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Full Name" name="name" value={formData.name} onChange={handleInputChange} error={errors.name} />
              <InputField label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} error={errors.email} />
              <InputField label="Phone" name="phone" value={formData.phone} onChange={handleInputChange} error={errors.phone} />
              <InputField label="Address" name="address" value={formData.address} onChange={handleInputChange} error={errors.address} />
              <InputField label="City" name="city" value={formData.city} onChange={handleInputChange} error={errors.city} />
              <InputField label="State" name="state" value={formData.state} onChange={handleInputChange} error={errors.state} />
              <InputField label="Pincode" name="pincode" value={formData.pincode} onChange={handleInputChange} error={errors.pincode} />
            </div>
          </div>
          {/* Dummy Payment Section */}
          <div className="bg-white rounded-lg shadow p-6">
             <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
             <p className="text-gray-500">For demonstration purposes, payment details are not required. Click "Place Order" to complete the booking.</p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-6">
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
            <div className="space-y-3 mb-4 border-b pb-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-start">
                  <p className="flex-1 text-sm">{item.name} × {item.quantity}</p>
                  <span className="font-medium text-sm">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>{formatCurrency(getCartTotal())}</span>
            </div>
            <button type="submit" disabled={processing} className="w-full bg-blue-600 text-white py-3 rounded-lg mt-6 hover:bg-blue-700 disabled:opacity-50">
              {processing ? 'Processing...' : 'Place Order'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

const InputField = ({ label, name, error, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input {...props} name={name} className={`w-full px-3 py-2 border rounded-lg ${error ? 'border-red-500' : 'border-gray-300'}`} />
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

export default Checkout;
