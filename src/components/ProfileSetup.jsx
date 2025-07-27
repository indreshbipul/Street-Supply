// src/components/ProfileSetup.jsx
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Spinner, Notification } from './UI';

const ProfileSetup = ({ session, setProfile }) => {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('vendor');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [pincode, setPincode] = useState('');
  const [notification, setNotification] = useState(null);

  const handleProfileCreation = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: session.user.id,
        role,
        full_name: fullName,
        business_name: businessName,
        pincode: pincode,
        email: session.user.email
      })
      .select()
      .single();

    if (error) {
      setNotification({ type: 'error', message: error.message });
    } else {
      setNotification({ type: 'success', message: 'Profile created successfully!' });
      setProfile(data);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      {notification && <Notification {...notification} onDismiss={() => setNotification(null)} />}
      <div className="w-full max-w-lg bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Complete Your Profile</h2>
        <form onSubmit={handleProfileCreation}>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">I am a...</label>
            <div className="flex rounded-md shadow-sm">
              <button type="button" onClick={() => setRole('vendor')} className={`px-4 py-2 border rounded-l-md w-1/2 ${role === 'vendor' ? 'bg-indigo-500 text-white' : 'bg-white'}`}>Vendor</button>
              <button type="button" onClick={() => setRole('supplier')} className={`px-4 py-2 border rounded-r-md w-1/2 ${role === 'supplier' ? 'bg-indigo-500 text-white' : 'bg-white'}`}>Supplier</button>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fullName">Full Name</label>
            <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-style" required />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="businessName">Business/Stall Name</label>
            <input id="businessName" type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="input-style" required />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pincode">Pincode</label>
            <input id="pincode" type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} className="input-style" required pattern="\d{6}" title="Pincode must be 6 digits."/>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? <Spinner /> : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;
