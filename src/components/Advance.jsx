// src/components/AdvancedFeatures.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Modal, Spinner, StarRating } from './UI';

export const LoyaltyInfo = ({ vendorId }) => {
    const [loyaltyData, setLoyaltyData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLoyaltyData = async () => {
            const { data, error } = await supabase
                .from('loyalty_points')
                .select('points, supplier:supplier_id(business_name)')
                .eq('vendor_id', vendorId);
            
            if (error) console.error("Error fetching loyalty data:", error);
            else setLoyaltyData(data);
            setLoading(false);
        };
        fetchLoyaltyData();
    }, [vendorId]);

    if (loading) return <Spinner />;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-2xl font-bold mb-4">Your Loyalty Points</h3>
            {loyaltyData.length > 0 ? (
                <ul className="space-y-2">
                    {loyaltyData.map(loyalty => (
                        <li key={loyalty.supplier.id} className="flex justify-between">
                            <span>{loyalty.supplier.business_name}</span>
                            <span className="font-bold">{loyalty.points} pts</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>You have no loyalty points yet. Start ordering to earn rewards!</p>
            )}
        </div>
    );
};


export const SubscriptionManager = ({ vendorId, deals }) => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const fetchSubscriptions = async () => {
        const { data, error } = await supabase
            .from('subscriptions')
            .select('*, deal:deals(*, supplier:supplier_id(business_name))')
            .eq('vendor_id', vendorId)
            .eq('is_active', true);
        
        if (error) console.error("Error fetching subscriptions", error);
        else setSubscriptions(data);
    };

    useEffect(() => {
        fetchSubscriptions();
    }, [vendorId]);

    const handleCreateSubscription = async (dealId, quantity, frequency) => {
        const { error } = await supabase.from('subscriptions').insert({
            vendor_id: vendorId,
            deal_id: dealId,
            quantity,
            frequency,
        });
        if (error) alert(`Error: ${error.message}`);
        else {
            setShowCreateModal(false);
            fetchSubscriptions();
        }
    };
    
    const handleCancelSubscription = async (subId) => {
        if (window.confirm("Are you sure you want to cancel this subscription?")) {
            const { error } = await supabase.from('subscriptions').update({ is_active: false }).eq('id', subId);
            if(error) alert(`Error: ${error.message}`);
            else fetchSubscriptions();
        }
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-8">
            <h3 className="text-2xl font-bold mb-4">Recurring Orders</h3>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary-sm mb-4">New Subscription</button>
            {showCreateModal && (
                <Modal onClose={() => setShowCreateModal(false)}>
                    <CreateSubscriptionForm deals={deals} onSubmit={handleCreateSubscription} />
                </Modal>
            )}
            <div className="space-y-4">
                {subscriptions.length > 0 ? subscriptions.map(sub => (
                    <div key={sub.id} className="border p-3 rounded-lg">
                        <p className="font-bold">{sub.deal.item_name}</p>
                        <p className="text-sm">From: {sub.deal.supplier.business_name}</p>
                        <p className="text-sm">{sub.quantity} {sub.deal.unit} / {sub.frequency}</p>
                        <div className="text-right">
                            <button onClick={() => handleCancelSubscription(sub.id)} className="btn-danger-sm">Cancel</button>
                        </div>
                    </div>
                )) : <p>You have no active subscriptions.</p>}
            </div>
        </div>
    );
};

const CreateSubscriptionForm = ({ deals, onSubmit }) => {
    const [selectedDeal, setSelectedDeal] = useState('');
    const [quantity, setQuantity] = useState(10);
    const [frequency, setFrequency] = useState('weekly');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedDeal) {
            alert("Please select a product.");
            return;
        }
        onSubmit(selectedDeal, quantity, frequency);
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3 className="text-xl font-bold mb-4">Create New Subscription</h3>
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Product</label>
                <select value={selectedDeal} onChange={(e) => setSelectedDeal(e.target.value)} className="input-style w-full">
                    <option value="">Select a product...</option>
                    {deals.map(deal => (
                        <option key={deal.id} value={deal.id}>{deal.item_name} (by {deal.profiles.business_name})</option>
                    ))}
                </select>
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="input-style w-full" />
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Frequency</label>
                <select value={frequency} onChange={e => setFrequency(e.target.value)} className="input-style w-full">
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-Weekly</option>
                    <option value="monthly">Monthly</option>
                </select>
            </div>
            <button type="submit" className="btn-primary w-full">Subscribe</button>
        </form>
    );
};
