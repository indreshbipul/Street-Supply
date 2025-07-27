// src/components/SupplierDashboard.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { Spinner, Modal, Notification, StarRating } from './UI';

// --- SVG Icons ---
const IconFilter = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>;
const IconArrowUp = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>;
const IconArrowDown = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>;
const IconArchive = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>;
const IconShoppingBag = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>;
const IconStar = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
const IconTrendingUp = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>;
const IconEdit = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const IconMenu = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;


/**
 * Converts a date string to a "time ago" format.
 */
const timeAgo = (date) => {
  if (!date) return '';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
};

// --- Main Supplier Dashboard Component ---
const SupplierDashboard = ({ profile, session }) => {
    const [view, setView] = useState('orders');
    const [orders, setOrders] = useState([]);
    const [deals, setDeals] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateDeal, setShowCreateDeal] = useState(false);
    const [editingDeal, setEditingDeal] = useState(null);
    const [viewingOrder, setViewingOrder] = useState(null);
    const [notification, setNotification] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Filter and sort states
    const [orderFilter, setOrderFilter] = useState('');
    const [orderSort, setOrderSort] = useState({ key: 'created_at', asc: false });
    const [dealFilter, setDealFilter] = useState('');
    const [dealSort, setDealSort] = useState({ key: 'created_at', asc: false });
    const [reviewFilter, setReviewFilter] = useState('');
    const [reviewSort, setReviewSort] = useState({ key: 'created_at', asc: false });

    const fetchData = useCallback(async () => {
        setLoading(true);
        
        const { data: ordersData } = await supabase
            .from('group_orders').select('*, group:group_id(name), order_items(*, deal:deals(*), vendor:vendor_id(full_name, business_name))')
            .eq('supplier_id', session.user.id).order('created_at', { ascending: false });
        setOrders(ordersData || []);

        const { data: dealsData } = await supabase
            .from('deals').select('*').eq('supplier_id', session.user.id).order('created_at', { ascending: false });
        setDeals(dealsData || []);

        const { data: reviewsData } = await supabase
            .from('ratings').select('*, vendor:vendor_id(full_name), order:order_id(order_items(*, deal:deals(item_name)))').eq('supplier_id', session.user.id).order('created_at', { ascending: false });
        setReviews(reviewsData || []);
        
        setLoading(false);
    }, [session.user.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateDeal = async (dealData) => {
        const { error } = await supabase.from('deals').insert({ ...dealData, supplier_id: session.user.id });
        if (error) setNotification({ type: 'error', message: error.message });
        else {
            setNotification({ type: 'success', message: 'Deal created successfully!' });
            fetchData();
            setShowCreateDeal(false);
        }
    };

    const handleUpdateDeal = async (dealData) => {
        const { error } = await supabase.from('deals').update(dealData).eq('id', editingDeal.id);
        if (error) {
            setNotification({ type: 'error', message: `Failed to update deal: ${error.message}` });
        } else {
            setNotification({ type: 'success', message: 'Deal updated successfully!' });
            setEditingDeal(null);
            fetchData();
        }
    };
    
    const handleUpdateOrderStatus = async (orderId, status) => {
        if (status === 'completed') {
            const orderToComplete = orders.find(o => o.id === orderId);
            if (!orderToComplete) {
                setNotification({ type: 'error', message: 'Could not find the order to update.'});
                return;
            }
            try {
                for (const item of orderToComplete.order_items) {
                    const currentStock = item.deal.stock_quantity;
                    const newStock = currentStock - item.quantity;
                    const { error: stockError } = await supabase
                        .from('deals')
                        .update({ stock_quantity: newStock < 0 ? 0 : newStock })
                        .eq('id', item.deal.id);
                    if (stockError) throw new Error(`Failed to update stock for ${item.deal.item_name}: ${stockError.message}`);
                }
                const { error: statusError } = await supabase.from('group_orders').update({ status }).eq('id', orderId);
                if (statusError) throw new Error(`Stock updated, but failed to update order status: ${statusError.message}`);
                setNotification({ type: 'success', message: `Order has been completed and stock updated.` });
            } catch (error) {
                setNotification({ type: 'error', message: error.message });
            } finally {
                fetchData();
            }
        } else {
            const { error } = await supabase.from('group_orders').update({ status }).eq('id', orderId);
            if (error) setNotification({ type: 'error', message: `Failed to update status: ${error.message}` });
            else setNotification({ type: 'success', message: `Order has been ${status}.` });
            fetchData();
        }
    };
    
    const displayedOrders = useMemo(() => {
        return [...orders]
            .filter(o => !orderFilter || o.status === orderFilter)
            .sort((a, b) => {
                const valA = orderSort.key === 'created_at' ? new Date(a.created_at) : a.total_value;
                const valB = orderSort.key === 'created_at' ? new Date(b.created_at) : b.total_value;
                if (valA < valB) return orderSort.asc ? -1 : 1;
                if (valA > valB) return orderSort.asc ? 1 : -1;
                return 0;
            });
    }, [orders, orderFilter, orderSort]);

    const displayedDeals = useMemo(() => {
        return [...deals]
            .filter(d => !dealFilter || (dealFilter === 'active' ? d.is_active : !d.is_active))
            .sort((a, b) => {
                const valA = a[dealSort.key];
                const valB = b[dealSort.key];
                if (valA < valB) return dealSort.asc ? -1 : 1;
                if (valA > valB) return dealSort.asc ? 1 : -1;
                return 0;
            });
    }, [deals, dealFilter, dealSort]);

    const displayedReviews = useMemo(() => {
        return [...reviews]
            .filter(r => !reviewFilter || r.rating === parseInt(reviewFilter))
            .sort((a, b) => {
                const valA = new Date(a.created_at);
                const valB = new Date(b.created_at);
                if (valA < valB) return reviewSort.asc ? -1 : 1;
                if (valA > valB) return reviewSort.asc ? 1 : -1;
                return 0;
            });
    }, [reviews, reviewFilter, reviewSort]);

    const averageRating = useMemo(() => reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0, [reviews]);
    const orderStatuses = useMemo(() => [...new Set(orders.map(o => o.status))], [orders]);

    const handleTabClick = (tabName) => {
        setView(tabName);
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {notification && <Notification {...notification} onDismiss={() => setNotification(null)} />}
            
            <header className="bg-white shadow-sm sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-800">Supplier Dashboard</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <StarRating rating={averageRating} readOnly />
                            <span className="font-semibold">{averageRating.toFixed(1)}</span>
                            <span>({reviews.length} reviews)</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6 border-b border-gray-200">
                    <div className="sm:hidden flex justify-between items-center">
                        <span className="font-bold text-lg text-indigo-600 capitalize">{view}</span>
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
                            <IconMenu />
                        </button>
                    </div>
                    <nav className="hidden sm:flex sm:space-x-2">
                        <TabButton icon={<IconArchive />} label="Orders" isActive={view === 'orders'} onClick={() => handleTabClick('orders')} />
                        <TabButton icon={<IconShoppingBag />} label="Deals" isActive={view === 'deals'} onClick={() => handleTabClick('deals')} />
                        <TabButton icon={<IconStar />} label="Reviews" isActive={view === 'reviews'} onClick={() => handleTabClick('reviews')} />
                        <TabButton icon={<IconTrendingUp />} label="Analytics" isActive={view === 'analytics'} onClick={() => handleTabClick('analytics')} />
                    </nav>
                    {isMobileMenuOpen && (
                        <div className="sm:hidden mt-2 border-t border-gray-200 flex flex-col space-y-1 p-1">
                            <TabButton icon={<IconArchive />} label="Orders" isActive={view === 'orders'} onClick={() => handleTabClick('orders')} />
                            <TabButton icon={<IconShoppingBag />} label="Deals" isActive={view === 'deals'} onClick={() => handleTabClick('deals')} />
                            <TabButton icon={<IconStar />} label="Reviews" isActive={view === 'reviews'} onClick={() => handleTabClick('reviews')} />
                            <TabButton icon={<IconTrendingUp />} label="Analytics" isActive={view === 'analytics'} onClick={() => handleTabClick('analytics')} />
                        </div>
                    )}
                </div>

                {loading ? <div className="flex justify-center py-12"><Spinner /></div> : (
                    <>
                        {view === 'analytics' && <AnalyticsView orders={orders} deals={deals} />}
                        {view === 'orders' && (
                            <div>
                                <FilterSortControls
                                    filters={[{ value: '', label: 'All Statuses' }, ...orderStatuses.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))]}
                                    sortOptions={[{ key: 'created_at', label: 'Date' }, { key: 'total_value', label: 'Total' }]}
                                    filter={orderFilter} setFilter={setOrderFilter}
                                    sort={orderSort} setSort={setOrderSort}
                                    filterLabel="Status"
                                />
                                <div className="space-y-4 mt-6">
                                    {displayedOrders.length > 0 ? displayedOrders.map(order => <SupplierOrderCard key={order.id} order={order} onUpdateStatus={handleUpdateOrderStatus} onViewDetails={() => setViewingOrder(order)} />) : <p className="text-center text-gray-500 py-10">No incoming orders found.</p>}
                                </div>
                            </div>
                        )}
                        {view === 'deals' && (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold">Your Deals</h3>
                                    <button onClick={() => setShowCreateDeal(true)} className="btn-primary">Create New Deal</button>
                                </div>
                                <FilterSortControls
                                    filters={[{ value: '', label: 'All Deals' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
                                    sortOptions={[{ key: 'created_at', label: 'Date' }, { key: 'item_name', label: 'Name' }]}
                                    filter={dealFilter} setFilter={setDealFilter}
                                    sort={dealSort} setSort={setDealSort}
                                    filterLabel="Status"
                                />
                                <div className="space-y-4 mt-6">
                                    {displayedDeals.length > 0 ? displayedDeals.map(deal => <SupplierDealCard key={deal.id} deal={deal} onUpdate={fetchData} onEdit={() => setEditingDeal(deal)} />) : <p className="text-center text-gray-500 py-10">You haven't created any deals yet.</p>}
                                </div>
                            </div>
                        )}
                        {view === 'reviews' && (
                             <div>
                                <FilterSortControls
                                    filters={[{ value: '', label: 'All Ratings' }, { value: '5', label: '5 Stars' }, { value: '4', label: '4 Stars' }, { value: '3', label: '3 Stars' }, { value: '2', label: '2 Stars' }, { value: '1', label: '1 Star' }]}
                                    sortOptions={[{ key: 'created_at', label: 'Most Recent' }]}
                                    filter={reviewFilter} setFilter={setReviewFilter}
                                    sort={reviewSort} setSort={setReviewSort}
                                    filterLabel="Rating"
                                />
                                <div className="space-y-4 mt-6">
                                    {displayedReviews.length > 0 ? displayedReviews.map(review => <SupplierReviewCard key={review.id} review={review} />) : <p className="text-center text-gray-500 py-10">You have not received any reviews yet.</p>}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>

            {showCreateDeal && <Modal onClose={() => setShowCreateDeal(false)}><CreateDealForm onSubmit={handleCreateDeal} /></Modal>}
            {editingDeal && <Modal onClose={() => setEditingDeal(null)}><EditDealForm deal={editingDeal} onSubmit={handleUpdateDeal} /></Modal>}
            {viewingOrder && <Modal onClose={() => setViewingOrder(null)}><OrderDetailsModal order={viewingOrder} /></Modal>}
        </div>
    );
};

// --- New Analytics View ---
const AnalyticsView = ({ orders, deals }) => {
    const { totalRevenue, completedOrdersCount, averageOrderValue, topDeals } = useMemo(() => {
        const completedOrders = orders.filter(order => order.status === 'completed');
        const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total_value, 0);
        const completedOrdersCount = completedOrders.length;
        const averageOrderValue = completedOrdersCount > 0 ? totalRevenue / completedOrdersCount : 0;

        const dealSales = {};
        completedOrders.forEach(order => {
            order.order_items.forEach(item => {
                const dealName = item.deal.item_name;
                if (!dealSales[dealName]) {
                    dealSales[dealName] = { quantity: 0, revenue: 0 };
                }
                dealSales[dealName].quantity += item.quantity;
                dealSales[dealName].revenue += item.quantity * item.deal.price_per_unit;
            });
        });

        const topDeals = Object.entries(dealSales)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        return { totalRevenue, completedOrdersCount, averageOrderValue, topDeals };
    }, [orders]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h4 className="text-gray-500 text-sm font-medium">Total Revenue</h4>
                    <p className="text-3xl font-bold text-gray-800">₹{totalRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h4 className="text-gray-500 text-sm font-medium">Completed Orders</h4>
                    <p className="text-3xl font-bold text-gray-800">{completedOrdersCount}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h4 className="text-gray-500 text-sm font-medium">Average Order Value</h4>
                    <p className="text-3xl font-bold text-gray-800">₹{averageOrderValue.toFixed(2)}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Top 5 Performing Deals (by Revenue)</h3>
                {topDeals.length > 0 ? (
                    <ul className="space-y-3">
                        {topDeals.map(deal => (
                            <li key={deal.name} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                                <span className="font-semibold text-gray-700">{deal.name}</span>
                                <span className="font-bold text-indigo-600">₹{deal.revenue.toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-500 py-8">No completed orders to analyze.</p>
                )}
            </div>
        </div>
    );
};

// --- Reusable UI Components ---

const TabButton = ({ icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`flex items-center gap-2 w-full text-left px-3 py-2 font-medium text-sm rounded-md transition-colors sm:w-auto ${isActive ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}>
        {icon}
        {label}
    </button>
);

const FilterSortControls = ({ filters, sortOptions, filter, setFilter, sort, setSort, filterLabel }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
            <IconFilter />
            <label htmlFor="filter" className="text-sm font-medium text-gray-700">{filterLabel}:</label>
            <select id="filter" value={filter} onChange={e => setFilter(e.target.value)} className="input-style !py-1 !text-sm flex-grow">
                {filters.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            {sortOptions.map(opt => (
                <button
                    key={opt.key}
                    onClick={() => setSort(s => ({ key: opt.key, asc: s.key === opt.key ? !s.asc : true }))}
                    className={`flex items-center gap-1 p-2 rounded-md text-sm transition-colors ${sort.key === opt.key ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                    {opt.label}
                    {sort.key === opt.key && (sort.asc ? <IconArrowUp /> : <IconArrowDown />)}
                </button>
            ))}
        </div>
    </div>
);

// --- Card Components ---

const SupplierReviewCard = ({ review }) => (
    <div className="bg-white p-4 rounded-lg shadow-md transition hover:shadow-lg">
        <div className="flex justify-between items-start">
            <div>
                <p className="font-semibold text-gray-800">{review.vendor.full_name}</p>
                <p className="text-xs text-gray-400">{timeAgo(review.created_at)}</p>
            </div>
            <StarRating rating={review.rating} readOnly />
        </div>
        {review.review_text && <p className="text-gray-700 my-3 p-3 bg-gray-50 rounded-md">"{review.review_text}"</p>}
        <div className="text-sm text-gray-500 mt-2 border-t pt-2">
            <p>For Order: <span className="font-medium text-gray-600">{review.order.order_items.map(item => `${item.quantity}x ${item.deal.item_name}`).join(', ')}</span></p>
        </div>
    </div>
);

const SupplierOrderCard = ({ order, onUpdateStatus, onViewDetails }) => {
    const statusClasses = {
        pending: 'bg-yellow-100 text-yellow-800',
        accepted: 'bg-green-100 text-green-800',
        denied: 'bg-red-100 text-red-800',
        completed: 'bg-blue-100 text-blue-800',
    };
    return (
        <div className="bg-white p-4 rounded-lg shadow-md transition hover:shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                <div>
                    <p className="font-bold text-lg text-gray-800">Order from {order.group.name}</p>
                    <p className="text-sm text-gray-500">{timeAgo(order.created_at)} | Total: ₹{order.total_value}</p>
                </div>
                <span className={`px-3 py-1 text-sm rounded-full font-semibold capitalize self-start ${statusClasses[order.status]}`}>{order.status}</span>
            </div>
            <div className="my-4 border-t border-b py-3">
                <p className="font-semibold mb-1">Items:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                    {order.order_items.map(item => (
                        <li key={item.id}>{item.quantity} x {item.deal.item_name}</li>
                    ))}
                </ul>
            </div>
            <div className="flex justify-end space-x-2">
                <button onClick={onViewDetails} className="btn-secondary-sm">View Details</button>
                {order.status === 'pending' && (
                    <>
                        <button onClick={() => onUpdateStatus(order.id, 'denied')} className="btn-danger-sm">Deny</button>
                        <button onClick={() => onUpdateStatus(order.id, 'accepted')} className="btn-success-sm">Accept</button>
                    </>
                )}
                {order.status === 'accepted' && (
                    <button onClick={() => onUpdateStatus(order.id, 'completed')} className="btn-primary-sm">Mark as Completed</button>
                )}
            </div>
        </div>
    );
};

const SupplierDealCard = ({ deal, onUpdate, onEdit }) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const toggleDealStatus = async () => {
        setIsUpdating(true);
        const { error } = await supabase.from('deals').update({ is_active: !deal.is_active }).eq('id', deal.id);
        if (error) alert(`Error: ${error.message}`);
        else onUpdate();
        setIsUpdating(false);
    };
    const isLowStock = deal.stock_quantity <= 10;

    return (
        <div className={`bg-white p-4 rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-center gap-4 transition hover:shadow-lg ${isLowStock ? 'border-l-4 border-yellow-400' : ''}`}>
            <div className="flex-grow">
                <p className="font-bold text-lg text-gray-800">{deal.item_name}</p>
                <p className="text-gray-600">₹{deal.price_per_unit}/{deal.unit} | Min: {deal.min_order_quantity} {deal.unit}</p>
                <p className="text-sm text-gray-500 mt-1">Pincodes: {deal.target_pincodes.join(', ')}</p>
                {isLowStock && <p className="text-sm font-bold text-yellow-600 mt-1">Low Stock: {deal.stock_quantity} left</p>}
            </div>
            <div className="flex items-center gap-2">
                <span className={`px-3 py-1 text-sm rounded-full font-semibold ${deal.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {deal.is_active ? 'Active' : 'Inactive'}
                </span>
                <button onClick={onEdit} className="btn-secondary-sm flex items-center gap-1"><IconEdit /> Edit</button>
                <button onClick={toggleDealStatus} className="btn-secondary-sm w-28" disabled={isUpdating}>
                    {isUpdating ? <Spinner size="sm" /> : (deal.is_active ? 'Deactivate' : 'Activate')}
                </button>
            </div>
        </div>
    );
};

// --- Form & Modal Components ---

const OrderDetailsModal = ({ order }) => (
    <div>
        <h3 className="text-xl font-bold mb-4">Order Details</h3>
        <div className="space-y-4">
            <p><strong>From Group:</strong> {order.group.name}</p>
            <p><strong>Total Value:</strong> ₹{order.total_value.toFixed(2)}</p>
            <p><strong>Status:</strong> <span className="capitalize font-medium">{order.status}</span></p>
            <div className="border-t pt-2">
                <h4 className="font-semibold mb-2">Item Breakdown by Vendor:</h4>
                <ul className="space-y-2">
                    {order.order_items.map(item => (
                        <li key={item.id} className="p-2 bg-gray-50 rounded-md">
                            <p className="font-semibold">{item.quantity} x {item.deal.item_name}</p>
                            <p className="text-sm text-gray-600">Ordered by: {item.vendor.full_name} ({item.vendor.business_name})</p>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    </div>
);

const CreateDealForm = ({ onSubmit }) => {
    const [formData, setFormData] = useState({
        item_name: '', item_description: '', price_per_unit: '',
        unit: 'kg', min_order_quantity: '', target_pincodes: '', stock_quantity: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const submissionData = {
            ...formData,
            target_pincodes: formData.target_pincodes.split(',').map(p => p.trim()).filter(p => p),
            price_per_unit: parseFloat(formData.price_per_unit),
            min_order_quantity: parseInt(formData.min_order_quantity, 10),
            stock_quantity: parseInt(formData.stock_quantity, 10),
        };
        onSubmit(submissionData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-xl font-bold">Create a New Deal</h3>
            <input name="item_name" value={formData.item_name} onChange={handleChange} placeholder="Item Name (e.g., Onions)" className="input-style w-full" required />
            <textarea name="item_description" value={formData.item_description} onChange={handleChange} placeholder="Description (e.g., Fresh Nashik Red Onions)" className="input-style w-full" required rows="3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input name="price_per_unit" type="number" step="0.01" value={formData.price_per_unit} onChange={handleChange} placeholder="Price per Unit" className="input-style" required />
                <select name="unit" value={formData.unit} onChange={handleChange} className="input-style">
                    <option value="kg">kg</option> <option value="litre">litre</option>
                    <option value="dozen">dozen</option> <option value="item">item</option>
                </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input name="min_order_quantity" type="number" value={formData.min_order_quantity} onChange={handleChange} placeholder="Min Order Qty" className="input-style w-full" required />
                <input name="stock_quantity" type="number" value={formData.stock_quantity} onChange={handleChange} placeholder="Stock Quantity" className="input-style w-full" required />
            </div>
            <input name="target_pincodes" value={formData.target_pincodes} onChange={handleChange} placeholder="Target Pincodes (comma-separated)" className="input-style w-full" required />
            <button type="submit" className="btn-primary w-full">Create Deal</button>
        </form>
    );
};

const EditDealForm = ({ deal, onSubmit }) => {
    const [formData, setFormData] = useState({
        item_name: deal.item_name,
        item_description: deal.item_description,
        price_per_unit: deal.price_per_unit,
        unit: deal.unit,
        min_order_quantity: deal.min_order_quantity,
        target_pincodes: deal.target_pincodes.join(', '),
        stock_quantity: deal.stock_quantity
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const { target_pincodes, ...rest } = formData;
        const submissionData = {
            ...rest,
            target_pincodes: target_pincodes.split(',').map(p => p.trim()).filter(p => p),
            price_per_unit: parseFloat(formData.price_per_unit),
            min_order_quantity: parseInt(formData.min_order_quantity, 10),
            stock_quantity: parseInt(formData.stock_quantity, 10),
        };
        onSubmit(submissionData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-xl font-bold">Edit Deal</h3>
            <input name="item_name" value={formData.item_name} onChange={handleChange} placeholder="Item Name" className="input-style w-full" required />
            <textarea name="item_description" value={formData.item_description} onChange={handleChange} placeholder="Description" className="input-style w-full" required rows="3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input name="price_per_unit" type="number" step="0.01" value={formData.price_per_unit} onChange={handleChange} placeholder="Price per Unit" className="input-style" required />
                <select name="unit" value={formData.unit} onChange={handleChange} className="input-style">
                    <option value="kg">kg</option> <option value="litre">litre</option>
                    <option value="dozen">dozen</option> <option value="item">item</option>
                </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input name="min_order_quantity" type="number" value={formData.min_order_quantity} onChange={handleChange} placeholder="Min Order Qty" className="input-style w-full" required />
                <input name="stock_quantity" type="number" value={formData.stock_quantity} onChange={handleChange} placeholder="Stock Quantity" className="input-style w-full" required />
            </div>
            <input name="target_pincodes" value={formData.target_pincodes} onChange={handleChange} placeholder="Target Pincodes (comma-separated)" className="input-style w-full" required />
            <button type="submit" className="btn-primary w-full">Save Changes</button>
        </form>
    );
};

export default SupplierDashboard;
