import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabaseClient'; // Using Supabase for data fetching
import { Spinner } from './UI'; // Assuming a Spinner component exists

// --- UI Components (from GroupView.jsx for consistency) ---
const Modal = ({ onClose, children }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto p-6">
            <div className="relative">
                <button onClick={onClose} className="absolute -top-3 -right-3 text-gray-400 hover:text-gray-700 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                {children}
            </div>
        </div>
    </div>
);
const Notification = ({ type, message, onDismiss }) => {
    if (!message) return null;
    const baseClasses = "fixed top-5 right-5 flex items-center gap-4 p-4 rounded-lg shadow-lg z-50";
    const typeClasses = { success: "bg-green-50 text-green-800", error: "bg-red-50 text-red-800", info: "bg-blue-50 text-blue-800" };
    return (
        <div className={`${baseClasses} ${typeClasses[type]}`}>
            <p className="flex-grow text-sm">{message}</p>
            <button onClick={onDismiss} className="text-current opacity-70 hover:opacity-100">&times;</button>
        </div>
    );
};


// --- Icon Placeholders ---
const ArrowLeftIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;
const ShoppingCartIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>;
const MagnifyingGlassIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;

// --- Cart Modal Component ---
const CartModal = ({ deals, cart, onClose, onUpdateCart, onPlaceOrder }) => {
    const cartItems = Object.keys(cart).map(dealId => ({
        deal: deals.find(d => d.id === dealId),
        quantity: cart[dealId],
    })).filter(item => item.deal && item.quantity > 0);

    const totalCartValue = cartItems.reduce((total, item) => {
        return total + (item.deal.price * item.quantity);
    }, 0);

    return (
        <Modal onClose={onClose}>
            <div className="p-1">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Your Cart</h3>
                {cartItems.length > 0 ? (
                    <div className="max-h-[60vh] overflow-y-auto pr-2">
                        <div className="space-y-4">
                            {cartItems.map(({deal, quantity}) => (
                                <div key={deal.id} className="flex justify-between items-center gap-4">
                                    <div>
                                        <p className="font-semibold">{deal.name}</p>
                                        <p className="text-sm text-gray-500">by {deal.supplier}</p>
                                        <p className="text-sm text-gray-500">₹{deal.price}/{deal.unit}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="number" min="0" value={quantity} onChange={(e) => onUpdateCart(deal.id, e.target.value)} className="w-16 text-center border rounded p-1"/>
                                        <button onClick={() => onUpdateCart(deal.id, 0)} className="text-red-500 hover:text-red-700">Remove</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="border-t pt-4 mt-4">
                            <div className="flex justify-between font-bold text-lg mb-4">
                                <span>Total:</span>
                                <span>₹{totalCartValue.toFixed(2)}</span>
                            </div>
                            <button onClick={onPlaceOrder} className="btn-primary w-full">Place Order</button>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-500 py-10 text-center">Your cart is empty.</p>
                )}
            </div>
        </Modal>
    );
};


// --- Product Card Sub-Component ---
const ProductCard = ({ product, onAddToCart }) => {
    const [quantity, setQuantity] = useState(product.min_order_quantity || 1);

    const handleAddToCart = () => {
        if (quantity > 0) {
            onAddToCart(product, quantity);
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-shadow hover:shadow-lg">
            <img 
                src={product.image_url || 'https://via.placeholder.com/300x200.png?text=No+Image'} 
                alt={product.name} 
                className="w-full h-40 object-cover" 
            />
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-slate-800">{product.name}</h3>
                <p className="text-sm text-slate-500 mb-2">by {product.supplier}</p>
                <p className="text-xs text-slate-600 flex-grow">{product.description}</p>
                <div className="mt-4">
                    <p className="text-xl font-bold text-indigo-600">
                        ₹{product.price}<span className="text-sm font-normal text-slate-500"> / {product.unit}</span>
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(product.min_order_quantity || 1, parseInt(e.target.value) || 1))}
                            className="input-style w-20 text-center"
                            min={product.min_order_quantity || 1}
                        />
                        <button onClick={handleAddToCart} className="btn-primary flex-1">Add to Cart</button>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Main View Component ---
const IndividualOrderView = ({ profile, onBack, session }) => {
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState({}); // Changed cart to an object for easier updates
    const [showCart, setShowCart] = useState(false);
    const [notification, setNotification] = useState(null);


    // Effect to fetch products from Supabase using the logic from GroupView
    useEffect(() => {
        const fetchDeals = async () => {
            if (!profile?.pincode) {
                setError("Your profile pincode is missing. Please update your profile.");
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const { data: dealsData, error: dealsError } = await supabase.rpc('search_deals_by_pincode', { 
                    pincode_to_search: profile.pincode 
                });

                if (dealsError) throw dealsError;
                if (!dealsData) {
                    setDeals([]);
                    setLoading(false);
                    return;
                };

                const supplierIds = [...new Set(dealsData.map(d => d.supplier_id))];
                let dealsWithProfiles = dealsData;

                if (supplierIds.length > 0) {
                    const { data: profilesData, error: profilesError } = await supabase
                        .from('profiles')
                        .select(`id, business_name`)
                        .in('id', supplierIds);
                    
                    if (profilesError) throw profilesError;

                    const profilesMap = new Map(profilesData.map(p => [p.id, p.business_name]));
                    dealsWithProfiles = dealsData.map(deal => ({
                        ...deal,
                        supplierName: profilesMap.get(deal.supplier_id) || 'Unknown Supplier'
                    }));
                }
                
                const formattedDeals = dealsWithProfiles.map(d => ({
                    id: d.id,
                    name: d.item_name,
                    description: d.item_description,
                    price: d.price_per_unit,
                    unit: d.unit,
                    supplier: d.supplierName,
                    supplier_id: d.supplier_id,
                    image_url: d.image_url,
                    min_order_quantity: d.min_order_quantity
                }));

                setDeals(formattedDeals);
                setError(null);
            } catch (e) {
                console.error("Error fetching deals:", e);
                setError("Could not fetch deals. Please try again later.");
                setDeals([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDeals();
    }, [profile]);

    const filteredDeals = useMemo(() => {
        if (!deals) return [];
        return deals.filter(deal => 
            deal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            deal.supplier.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, deals]);

    const handleAddToCart = (product, quantity) => {
        setCart(prevCart => {
            const newCart = {...prevCart};
            newCart[product.id] = (newCart[product.id] || 0) + quantity;
            return newCart;
        });
        setNotification({ type: 'success', message: `${quantity} x ${product.name} added to cart.` });
    };
    
    const handleUpdateCart = (dealId, quantity) => {
        const newQuantity = parseInt(quantity, 10);
        if (isNaN(newQuantity) || newQuantity < 0) return;
        setCart(prev => {
            const newCart = {...prev};
            if (newQuantity === 0) {
                delete newCart[dealId];
            } else {
                newCart[dealId] = newQuantity;
            }
            return newCart;
        });
    };

    const handlePlaceOrder = async () => {
        const cartItems = Object.keys(cart).filter(dealId => cart[dealId] > 0);
        if (cartItems.length === 0) {
            setNotification({ type: 'error', message: 'Your cart is empty.' });
            return;
        }
        
        // This logic creates a separate order for each supplier in the cart
        const ordersBySupplier = cartItems.reduce((acc, dealId) => {
            const deal = deals.find(d => d.id === dealId);
            if (!deal) return acc;
            const supplierId = deal.supplier_id;
            if (!acc[supplierId]) {
                acc[supplierId] = { items: [] };
            }
            acc[supplierId].items.push({ deal_id: deal.id, quantity: cart[dealId] });
            return acc;
        }, {});

        setLoading(true);
        try {
            for (const supplierId in ordersBySupplier) {
                const orderData = ordersBySupplier[supplierId];
                // IMPORTANT: You need to create this RPC function in your Supabase SQL editor.
                // It should handle creating an individual order and its items atomically.
                const { error } = await supabase.rpc('create_individual_order', {
                    p_supplier_id: supplierId,
                    p_vendor_id: session.user.id,
                    p_items: orderData.items
                });

                if (error) throw error;
            }
            setNotification({ type: 'success', message: 'Your order(s) have been placed successfully!' });
            setCart({});
            setShowCart(false);
        } catch (error) {
            setNotification({ type: 'error', message: `Failed to place order: ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    const cartTotalItems = useMemo(() => {
        return Object.values(cart).reduce((total, quantity) => total + quantity, 0);
    }, [cart]);

    const renderContent = () => {
        if (loading) {
            return <div className="flex justify-center items-center py-20"><Spinner /></div>;
        }

        if (error) {
            return <div className="text-center col-span-full py-16 text-red-500">{error}</div>;
        }

        if (filteredDeals.length === 0) {
            return (
                <div className="text-center col-span-full py-16">
                    <h3 className="text-xl font-semibold text-slate-700">No Products Found</h3>
                    <p className="text-slate-500 mt-2">No products are available for your area, or they don't match your search.</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredDeals.map(deal => (
                    <ProductCard key={deal.id} product={deal} onAddToCart={handleAddToCart} />
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Notification {...notification} onDismiss={() => setNotification(null)} />
            
            {/* --- Header --- */}
            <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-10 border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-3 flex items-center justify-between">
                    <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-semibold">
                        <ArrowLeftIcon className="h-5 w-5" />
                        Back to Dashboard
                    </button>
                    <h2 className="text-xl font-bold text-slate-800">
                        Deals in <span className="text-indigo-600">{profile?.pincode || 'Your Area'}</span>
                    </h2>
                </div>
            </header>

            {/* --- Main Content --- */}
            <main className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
                {/* --- Search Bar --- */}
                <div className="mb-8 max-w-lg mx-auto">
                    <div className="relative">
                        <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search for a product or supplier..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-style w-full pl-10"
                        />
                    </div>
                </div>

                {/* --- Products Grid --- */}
                {renderContent()}
            </main>

            {/* --- Sticky Cart Button --- */}
            {cartTotalItems > 0 && (
                 <button onClick={() => setShowCart(true)} className="fixed bottom-8 right-8 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition transform hover:scale-110 z-30">
                    <ShoppingCartIcon />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">{cartTotalItems}</span>
                </button>
            )}

            {/* --- Cart Modal --- */}
            {showCart && <CartModal deals={deals} cart={cart} onClose={() => setShowCart(false)} onUpdateCart={handleUpdateCart} onPlaceOrder={handlePlaceOrder} />}
        </div>
    );
};

export default IndividualOrderView;
