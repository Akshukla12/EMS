import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Crown, Check } from 'lucide-react';

function MembershipManagement() {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const membershipPlans = [
    { id: 'user', name: 'Basic', price: 0, features: ['Browse events', 'Basic support'], color: 'gray' },
    { id: 'vendor', name: 'Premium', price: 1999, features: ['Everything in Basic', 'Create and manage events', 'Priority support'], color: 'blue' },
    { id: 'admin', name: 'VIP', price: 4999, features: ['Everything in Premium', 'Full system access', 'Manage users and orders'], color: 'purple' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (user?.role === 'admin') {
        const { data } = await supabase.from('profiles').select('*');
        setMemberships(data || []);
      } else if(user) {
        const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
        setProfile(data);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);
  
  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN');
  const getStatusBadge = (status) => `px-2 py-1 text-xs font-medium rounded-full ${status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`;

  if (loading) return <div className="text-center py-12">Loading membership data...</div>;

  if (user?.role === 'admin') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Membership Management</h1>
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Current Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Join Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y">
              {memberships.map((m) => (
                <tr key={m.id}>
                  <td className="px-6 py-4">
                    <div className="font-medium">{m.name}</div>
                    <div className="text-sm text-gray-500">{m.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 font-medium rounded-full bg-${membershipPlans.find(p => p.id === m.role)?.color}-100 text-${membershipPlans.find(p => p.id === m.role)?.color}-800`}>
                      {membershipPlans.find(p => p.id === m.role)?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(m.created_at)}</td>
                  <td className="px-6 py-4"><span className={getStatusBadge('active')}>Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const currentPlan = membershipPlans.find(plan => plan.id === profile?.role);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Membership</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {membershipPlans.map((plan) => (
          <div key={plan.id} className={`border-2 rounded-lg p-6 ${currentPlan?.id === plan.id ? `border-${plan.color}-500` : 'border-gray-200'}`}>
            <Crown className={`h-12 w-12 text-${plan.color}-600 mx-auto mb-3`} />
            <h4 className="text-xl font-bold text-center">{plan.name}</h4>
            <div className="text-center mt-2">
              <span className="text-2xl font-bold">{plan.price === 0 ? 'Free' : formatCurrency(plan.price)}</span>
              {plan.price > 0 && <span className="text-sm text-gray-500">/year</span>}
            </div>
            <div className="space-y-3 my-6">
              {plan.features.map((feature, i) => (
                <div key={i} className="flex items-start"><Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" /><span className="text-sm">{feature}</span></div>
              ))}
            </div>
            {currentPlan?.id === plan.id ? (
              <div className="text-center bg-green-100 text-green-800 py-2 rounded-lg font-medium">Current Plan</div>
            ) : (
              <button disabled className="w-full py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed">Switch Plan</button>
            )}
          </div>
        ))}
      </div>
      <p className="text-center text-gray-500 text-sm">To change your plan (e.g., from User to Vendor), please contact support. Admin roles are assigned manually for security.</p>
    </div>
  );
}

export default MembershipManagement;
