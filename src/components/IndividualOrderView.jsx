import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { Spinner, Modal, Notification, StarRating } from './UI'; // Assuming UI components are in './UI'

// --- ICONS (borrowed from GroupView for consistency) ---
const ShoppingCartIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>;
const ArrowLeftIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;
const MagnifyingGlassIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const IconArchive = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>;
const IconShoppingBag = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>;
const IconTrendingUp = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>;
const IconRepeat = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>;

// --- UTILITY: timeAgo ---
const timeAgo = (date) => {
    if (!date) return '';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)} years ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} months ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} days ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} hours ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} minutes ago`;
    return `${Math.floor(seconds)} seconds ago`;
};

// --- SUB-COMPONENTS ---
const TabButton = ({ icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`flex items-center gap-2 w-full text-left px-3 py-2 font-medium text-sm rounded-md transition-colors sm:w-auto ${isActive ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}>
        {icon}
        {label}
    </button>
);

const MyStatsView = ({ orders }) => {
    const { myTotalSpending, myTopItems, myTopSuppliers } = useMemo(() => {
        const completedOrders = orders.filter(o => o.status === 'completed');
        const myTotalSpending = completedOrders.reduce((sum, order) => sum + order.total_value, 0);

        const allItems = completedOrders.flatMap(o => o.individual_order_items);
        
        const itemCounts = allItems.reduce((acc, item) => {
            acc[item.deal.item_name] = (acc[item.deal.item_name] || 0) + item.quantity;
            return acc;
        }, {});
        const myTopItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

        const supplierSpending = completedOrders.reduce((acc, order) => {
            acc[order.supplier.business_name] = (acc[order.supplier.business_name] || 0) + order.total_value;
            return acc;
        }, {});
        const myTopSuppliers = Object.entries(supplierSpending).sort((a, b) => b[1] - a[1]).slice(0, 5);

        return { myTotalSpending, myTopItems, myTopSuppliers };
    }, [orders]);

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-2xl font-bold mb-4">Your Personal Stats</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-gray-500 text-sm font-medium">Your Total Spending</h4>
                    <p className="text-3xl font-bold text-gray-800">₹{myTotalSpending.toFixed(2)}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h4 className="font-bold text-lg mb-2">Your Top Items</h4>
                    <ul className="space-y-2">
                        {myTopItems.map(([name, qty]) => <li key={name} className="flex justify-between"><span>{name}</span> <strong>{qty} units</strong></li>)}
                    </ul>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h4 className="font-bold text-lg mb-2">Your Top Suppliers</h4>
                    <ul className="space-y-2">
                        {myTopSuppliers.map(([name, total]) => <li key={name} className="flex justify-between"><span>{name}</span> <strong>₹{total.toFixed(2)}</strong></li>)}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const RatingForm = ({ order, onSubmit, existingReview }) => {
    const [rating, setRating] = useState(existingReview?.rating || 5);
    const [review, setReview] = useState(existingReview?.review_text || '');

    return (
        <div>
            <h3 className="text-xl font-bold mb-2">Rate your order from {order.supplier.business_name}</h3>
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Rating</label>
                <StarRating rating={rating} setRating={setRating} />
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Review (optional)</label>
                <textarea value={review} onChange={(e) => setReview(e.target.value)} className="input-style w-full" rows="3"></textarea>
            </div>
            <button onClick={() => onSubmit(rating, review)} className="btn-primary w-full">Submit Review</button>
        </div>
    );
};

const IndividualOrderCard = ({ order, onUpdate, onRepeatOrder, setNotification }) => {
    const [showRatingModal, setShowRatingModal] = useState(false);
    const statusClasses = {
        pending: 'bg-yellow-100 text-yellow-800',
        accepted: 'bg-green-100 text-green-800',
        denied: 'bg-red-100 text-red-800',
        completed: 'bg-blue-100 text-blue-800',
    };
    
    const existingReview = order.ratings[0];

    const handleRatingSubmit = async (rating, review) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { error } = await supabase.from('ratings').upsert({
            id: existingReview?.id,
            order_id: order.id,
            order_type: 'individual',
            supplier_id: order.supplier.id, 
            vendor_id: session.user.id,
            rating,
            review_text: review,
        }, { onConflict: 'order_id, vendor_id' });

        if (error) {
            setNotification({type: 'error', message: `Error submitting review: ${error.message}`});
        } else {
            setNotification({type: 'success', message: 'Review submitted!'});
            setShowRatingModal(false);
            onUpdate();
        }
    };

    return (
        <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm transition hover:shadow-md">
            {showRatingModal && (
                <Modal onClose={() => setShowRatingModal(false)}>
                    <RatingForm order={order} onSubmit={handleRatingSubmit} existingReview={existingReview} />
                </Modal>
            )}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2 gap-2">
                <div>
                    <p className="font-bold text-lg text-gray-800">Order to {order.supplier.business_name}</p>
                    <p className="text-sm text-gray-500">Placed {timeAgo(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-4">
                    <p className="font-semibold text-lg">Total: ₹{order.total_value}</p>
                    <span className={`px-3 py-1 text-sm rounded-full font-semibold capitalize ${statusClasses[order.status]}`}>{order.status}</span>
                </div>
            </div>
            <ul className="text-sm text-gray-600 mt-2 list-disc list-inside bg-gray-50 p-3 rounded-md">
                {order.individual_order_items.map(item => (
                    <li key={item.id}>{item.quantity} x {item.deal.item_name}</li>
                ))}
            </ul>
            {order.status === 'completed' && (
                <div className="text-right mt-3 flex justify-end items-center gap-2">
                    <button onClick={() => onRepeatOrder(order)} className="btn-secondary-sm flex items-center gap-1"><IconRepeat /> Repeat Order</button>
                    <button onClick={() => setShowRatingModal(true)} className="btn-secondary-sm">
                        {existingReview ? 'Edit Review' : 'Rate Supplier'}
                    </button>
                </div>
            )}
        </div>
    );
};

// --- MAIN COMPONENT ---
const IndividualOrderView = ({ profile, onBack }) => {
    const [activeTab, setActiveTab] = useState('deals');
    const [deals, setDeals] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState({});
    const [showCart, setShowCart] = useState(false);
    const [notification, setNotification] = useState(null);

    const fetchData = useCallback(async (showLoader = true) => {
        console.log(`[DEBUG] fetchData called. showLoader: ${showLoader}`);
        if(showLoader) setLoading(true);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            console.log('[DEBUG] No session found in fetchData. Aborting.');
            if(showLoader) setLoading(false);
            return;
        }

        // Fetch Deals
        if (profile?.pincode) {
            const { data: dealsData } = await supabase.rpc('search_deals_by_pincode', { pincode_to_search: profile.pincode });
            const supplierIds = [...new Set((dealsData || []).map(d => d.supplier_id))];
            if (supplierIds.length > 0) {
                const { data: profilesData } = await supabase.from('profiles').select(`id, business_name`).in('id', supplierIds);
                const profilesMap = new Map((profilesData || []).map(p => [p.id, p.business_name]));
                const formattedDeals = (dealsData || []).map(d => ({
                    id: d.id, name: d.item_name, description: d.item_description, price: d.price_per_unit,
                    unit: d.unit, supplier: profilesMap.get(d.supplier_id) || 'Unknown', supplier_id: d.supplier_id,
                    image_url: d.image_url, min_order_quantity: d.min_order_quantity
                }));
                setDeals(formattedDeals);
            }
        }

        // --- FIX APPLIED HERE ---
        // Step 1: Fetch orders WITHOUT the problematic ratings join.
        console.log('[DEBUG] Step 1: Fetching individual orders for vendor_id:', session.user.id);
        const { data: ordersData, error: ordersError } = await supabase
            .from('individual_orders')
            .select('*, supplier:supplier_id(id, business_name), individual_order_items(*, deal:deals(*))') // Removed ratings(*)
            .eq('vendor_id', session.user.id)
            .order('created_at', { ascending: false });

        console.log('[DEBUG] Step 1 Result - Fetched orders data:', ordersData);
        console.error('[DEBUG] Step 1 Result - Fetched orders error:', ordersError);

        if (ordersError) {
            setNotification({ type: 'error', message: `Failed to fetch orders: ${ordersError.message}` });
            setOrders([]); // Clear orders on error
        } else if (ordersData && ordersData.length > 0) {
            // Step 2: If orders are found, fetch their ratings in a separate query.
            const orderIds = ordersData.map(o => o.id);
            console.log('[DEBUG] Step 2: Fetching ratings for order IDs:', orderIds);
            const { data: ratingsData, error: ratingsError } = await supabase
                .from('ratings')
                .select('*')
                .in('order_id', orderIds);

            console.log('[DEBUG] Step 2 Result - Fetched ratings data:', ratingsData);
            console.error('[DEBUG] Step 2 Result - Fetched ratings error:', ratingsError);

            if (ratingsError) {
                // If ratings fail, still show orders but log the error
                console.error("Could not fetch ratings:", ratingsError);
                setOrders(ordersData.map(o => ({ ...o, ratings: [] }))); // Ensure ratings is an empty array
            } else {
                // Step 3: Map the ratings back to their corresponding orders.
                const ordersWithRatings = ordersData.map(order => ({
                    ...order,
                    ratings: ratingsData.filter(r => r.order_id === order.id)
                }));
                console.log('[DEBUG] Step 3: Merged orders with ratings:', ordersWithRatings);
                setOrders(ordersWithRatings);
            }
        } else {
            // No orders found
            setOrders([]);
        }

        if(showLoader) setLoading(false);
    }, [profile]);

    // --- REALTIME SUBSCRIPTION FOR ORDER UPDATES ---
    useEffect(() => {
        fetchData();
        if (!profile?.id) {
            console.log('[DEBUG] Skipping realtime subscription because profile.id is missing.');
            return;
        }
        console.log(`[DEBUG] Setting up realtime subscription for vendor_id: ${profile.id}`);
        const channel = supabase
            .channel('individual-orders-channel')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'individual_orders',
                    filter: `vendor_id=eq.${profile.id}`
                },
                (payload) => {
                    console.log('[DEBUG] Realtime change detected!', payload);
                    setNotification({ type: 'info', message: 'Your order history has been updated.' });
                    fetchData(false); 
                }
            )
            .subscribe((status) => {
                console.log(`[DEBUG] Supabase channel subscription status: ${status}`);
            });
        return () => {
            console.log('[DEBUG] Removing realtime subscription channel.');
            supabase.removeChannel(channel);
        };
    }, [profile?.id, fetchData]);

    const handleRepeatOrder = (order) => {
        const newCartItems = {};
        let itemsAdded = 0;
        order.individual_order_items.forEach(item => {
            const dealExists = deals.find(d => d.id === item.deal_id);
            if (dealExists) {
                newCartItems[item.deal_id] = (cart[item.deal_id] || 0) + item.quantity;
                itemsAdded++;
            }
        });

        if (itemsAdded > 0) {
            setCart(prev => ({ ...prev, ...newCartItems }));
            setNotification({ type: 'success', message: 'Items from your past order have been added to your cart!' });
            setActiveTab('deals');
            setShowCart(true);
        } else {
            setNotification({ type: 'info', message: 'None of the items from this order are currently available.' });
        }
    };

    const handleAddToCart = (product, quantity) => {
        setCart(prev => ({ ...prev, [product.id]: (prev[product.id] || 0) + quantity }));
        setNotification({ type: 'success', message: `${quantity} x ${product.name} added to cart.` });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleUpdateCart = (dealId, quantity) => {
        const newQuantity = parseInt(quantity, 10);
        setCart(prev => {
            const newCart = {...prev};
            if (isNaN(newQuantity) || newQuantity <= 0) delete newCart[dealId];
            else newCart[dealId] = newQuantity;
            return newCart;
        });
    };

    const handlePlaceOrder = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const cartItems = Object.keys(cart).filter(id => cart[id] > 0);
        if (cartItems.length === 0) return;

        const ordersBySupplier = cartItems.reduce((acc, dealId) => {
            const deal = deals.find(d => d.id === dealId);
            if (!deal) return acc;
            const supplierId = deal.supplier_id;
            if (!acc[supplierId]) acc[supplierId] = { items: [] };
            acc[supplierId].items.push({ deal_id: deal.id, quantity: cart[dealId] });
            return acc;
        }, {});

        setIsPlacingOrder(true);
        try {
            for (const supplierId in ordersBySupplier) {
                const { error } = await supabase.rpc('create_individual_order', {
                    p_supplier_id: supplierId,
                    p_vendor_id: session.user.id,
                    p_items: ordersBySupplier[supplierId].items
                });
                if (error) throw error;
            }
            setNotification({ type: 'success', message: 'Order(s) placed successfully!' });
            setCart({});
            setShowCart(false);
        } catch (error) {
            setNotification({ type: 'error', message: `Failed to place order: ${error.message}` });
        } finally {
            setIsPlacingOrder(false);
        }
    };

    const filteredDeals = useMemo(() => deals.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.supplier.toLowerCase().includes(searchTerm.toLowerCase())), [deals, searchTerm]);
    const cartTotalItems = useMemo(() => Object.values(cart).reduce((total, qty) => total + qty, 0), [cart]);

    const renderContent = () => {
        if (loading) return <div className="flex justify-center items-center py-20"><Spinner /></div>;

        if (activeTab === 'deals') {
            return (
                <>
                    <div className="mb-8 max-w-lg mx-auto">
                        <div className="relative">
                            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
                            <input type="text" placeholder="Search for a product or supplier..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-style w-full pl-10" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredDeals.length > 0 ? filteredDeals.map(deal => <ProductCard key={deal.id} product={deal} onAddToCart={handleAddToCart} />) : <p className="col-span-full text-center py-10">No deals found.</p>}
                    </div>
                </>
            );
        }

        if (activeTab === 'history') {
            console.log('[DEBUG] Rendering order history with orders:', orders);
            return (
                <div className="space-y-4">
                    {orders.length > 0 ? orders.map(order => <IndividualOrderCard key={order.id} order={order} onUpdate={fetchData} onRepeatOrder={handleRepeatOrder} setNotification={setNotification} />) : <p className="text-center py-10">You have no past individual orders.</p>}
                </div>
            );
        }

        if (activeTab === 'stats') {
            return <MyStatsView orders={orders} />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Notification {...notification} onDismiss={() => setNotification(null)} />
            <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-10 border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-3 flex items-center justify-between">
                    <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-semibold"><ArrowLeftIcon className="h-5 w-5" /> Back</button>
                    <h2 className="text-xl font-bold text-slate-800">Individual Orders</h2>
                </div>
            </header>
            
            <main className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
                <div className="mb-6 border-b border-gray-200">
                    <nav className="flex space-x-2">
                        <TabButton icon={<IconShoppingBag />} label="Deals" isActive={activeTab === 'deals'} onClick={() => setActiveTab('deals')} />
                        <TabButton icon={<IconArchive />} label="Order History" isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} />
                        <TabButton icon={<IconTrendingUp />} label="My Stats" isActive={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />
                    </nav>
                </div>
                {renderContent()}
            </main>

            {activeTab === 'deals' && cartTotalItems > 0 && (
                <button onClick={() => setShowCart(true)} className="fixed bottom-8 right-8 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition transform hover:scale-110 z-30">
                    <ShoppingCartIcon />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">{cartTotalItems}</span>
                </button>
            )}

            {showCart && <CartModal deals={deals} cart={cart} onClose={() => setShowCart(false)} onUpdateCart={handleUpdateCart} onPlaceOrder={handlePlaceOrder} isPlacingOrder={isPlacingOrder} />}
        </div>
    );
};

// --- Re-exporting sub-components used by the main component ---
const CartModal = ({ deals, cart, onClose, onUpdateCart, onPlaceOrder, isPlacingOrder }) => {
    const cartItems = Object.keys(cart).map(dealId => ({
        deal: deals.find(d => d.id === dealId),
        quantity: cart[dealId],
    })).filter(item => item.deal && item.quantity > 0);

    const totalCartValue = cartItems.reduce((total, item) => total + (item.deal.price * item.quantity), 0);

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
                            <button onClick={onPlaceOrder} className="btn-primary w-full" disabled={isPlacingOrder}>
                                {isPlacingOrder ? <Spinner size="sm" /> : 'Place Order'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-500 py-10 text-center">Your cart is empty.</p>
                )}
            </div>
        </Modal>
    );
};

const ProductCard = ({ product, onAddToCart }) => {
    const [quantity, setQuantity] = useState(product.min_order_quantity || 1);

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-shadow hover:shadow-lg">
            <img src={product.image_url || 'https://placehold.co/300x200.png?text=No+Image'} alt={product.name} className="w-full h-40 object-cover" />
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-slate-800">{product.name}</h3>
                <p className="text-sm text-slate-500 mb-2">by {product.supplier}</p>
                <p className="text-xs text-slate-600 flex-grow">{product.description}</p>
                <div className="mt-4">
                    <p className="text-xl font-bold text-indigo-600">₹{product.price}<span className="text-sm font-normal text-slate-500"> / {product.unit}</span></p>
                    <p className="text-xs text-slate-500">Min order: {product.min_order_quantity || 1} {product.unit}</p>
                    <div className="mt-4 flex items-center gap-2">
                        <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(product.min_order_quantity || 1, parseInt(e.target.value) || 1))} className="input-style w-20 text-center" min={product.min_order_quantity || 1} />
                        <button onClick={() => onAddToCart(product, quantity)} className="btn-primary flex-1">Add to Cart</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IndividualOrderView;
