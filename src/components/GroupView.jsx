import React, { useState, useEffect, useCallback, useMemo } from 'react';

// --- Real Supabase Client ---
// Make sure this path is correct for your project structure.
import { supabase } from '../services/supabaseClient';

// --- UI Components (Spinner, Modal, etc.) ---
// These are assumed to be in your './UI' file. I've included definitions
// here to make this example fully runnable.
const Spinner = () => <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>;
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
const StarRating = ({ rating, setRating, readOnly = false }) => (
    <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
            <svg
                key={star}
                onClick={() => !readOnly && setRating(star)}
                className={`w-5 h-5 ${readOnly ? '' : 'cursor-pointer'} ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ))}
    </div>
);


// ====================================================================================
// --- ICONS ---
// ====================================================================================
const IconFilter = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>;
const IconArrowUp = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>;
const IconArrowDown = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>;
const IconShoppingCart = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>;
const IconArchive = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>;
const IconUsers = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const IconShoppingBag = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>;
const IconStar = ({ isFavorite }) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
const IconRepeat = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>;
const IconTrendingUp = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>;
const IconMenu = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
const IconSettings = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const IconTrash = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;


// ====================================================================================
// --- UTILITY FUNCTIONS ---
// ====================================================================================
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

// ====================================================================================
// --- AdminSettings COMPONENT ---
// ====================================================================================
const AdminSettings = ({ group, members, session, onUpdate, onGroupDeleted, setParentNotification }) => {
    const [newName, setNewName] = useState(group.name);
    const [newAdminId, setNewAdminId] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showTransferConfirm, setShowTransferConfirm] = useState(false);
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(null);
    const [confirmText, setConfirmText] = useState('');

    const handleUpdateDetails = async (e) => {
        e.preventDefault();
        const { error } = await supabase.from('groups').update({ name: newName }).eq('id', group.id);
        if (error) {
            setParentNotification({ type: 'error', message: error.message });
        } else {
            setParentNotification({ type: 'success', message: 'Group name updated.' });
            onUpdate();
        }
    };
    
    const handleTransferAdmin = async () => {
        if (!newAdminId) return;
        const { error } = await supabase.from('groups').update({ admin_id: newAdminId }).eq('id', group.id);
        if (error) {
            setParentNotification({ type: 'error', message: error.message });
        } else {
            setParentNotification({ type: 'success', message: 'Admin rights transferred successfully.' });
            onUpdate();
        }
        setShowTransferConfirm(false);
    };

    const handleRemoveMember = async (memberId) => {
        if (memberId === group.admin_id) return;
        const { error } = await supabase.from('group_members').delete().match({ group_id: group.id, user_id: memberId });
        if (error) {
            setParentNotification({ type: 'error', message: error.message });
        } else {
            setParentNotification({ type: 'success', message: 'Member removed.' });
            onUpdate();
        }
        setShowRemoveConfirm(null);
    };

    const handleDeleteGroup = async () => {
        if (confirmText !== `delete ${group.name}`) {
            setParentNotification({ type: 'error', message: 'Confirmation text does not match.' });
            return;
        }
        const { error } = await supabase.from('groups').delete().eq('id', group.id);
        if (error) {
            setParentNotification({ type: 'error', message: `Failed to delete group: ${error.message}` });
        } else {
            onGroupDeleted();
        }
        setShowDeleteConfirm(false);
    };
    
    useEffect(() => {
        setNewName(group.name);
    }, [group.name]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-10">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><IconSettings /> Admin Controls</h3>
            
            <form onSubmit={handleUpdateDetails} className="space-y-3">
                <h4 className="text-lg font-semibold border-b pb-2">Edit Group Details</h4>
                <div>
                    <label htmlFor="groupName" className="block text-sm font-medium text-gray-700">Group Name</label>
                    <input id="groupName" type="text" value={newName} onChange={e => setNewName(e.target.value)} className="mt-1 block w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                </div>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700">Save Changes</button>
            </form>

            <form onSubmit={(e) => {e.preventDefault(); if(newAdminId) setShowTransferConfirm(true);}} className="space-y-3">
                <h4 className="text-lg font-semibold border-b pb-2">Transfer Admin Ownership</h4>
                <p className="text-sm text-gray-600">If you transfer ownership, you will become a regular member.</p>
                <div>
                    <label htmlFor="newAdmin" className="block text-sm font-medium text-gray-700">Select New Admin</label>
                    <select id="newAdmin" value={newAdminId} onChange={e => setNewAdminId(e.target.value)} className="mt-1 block w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        <option value="" disabled>Select a member...</option>
                        {members.filter(m => m.id !== session.user.id).map(m => (
                            <option key={m.id} value={m.id}>{m.full_name} ({m.business_name})</option>
                        ))}
                    </select>
                </div>
                <button type="submit" className="px-4 py-2 bg-gray-600 text-white text-sm font-semibold rounded-md hover:bg-gray-700 disabled:opacity-50" disabled={!newAdminId}>Transfer Ownership</button>
            </form>

            <div className="space-y-3">
                <h4 className="text-lg font-semibold border-b pb-2">Manage Members</h4>
                <ul className="space-y-2 max-w-md">
                    {members.map(member => (
                        <li key={member.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                            <div>
                                <p className="font-semibold">{member.full_name}</p>
                                <p className="text-sm text-gray-500">{member.business_name}</p>
                            </div>
                            {member.id !== group.admin_id ? (
                                <button onClick={() => setShowRemoveConfirm(member)} className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 flex items-center gap-1"><IconTrash /> Remove</button>
                            ) : (
                                <span className="text-xs font-bold bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">Admin</span>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="space-y-3 border-t-2 border-red-200 pt-6">
                <h4 className="text-lg font-semibold text-red-700">Danger Zone</h4>
                <p className="text-sm text-gray-600">Deleting the group is permanent and will remove all associated data. This cannot be undone.</p>
                <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700">Delete This Group</button>
            </div>

            {showTransferConfirm && (
                <Modal onClose={() => setShowTransferConfirm(false)}>
                    <div className="p-6 text-center">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Transfer Ownership?</h3>
                        <p className="text-gray-600 mb-6">Are you sure? You will lose your admin privileges.</p>
                        <div className="flex justify-end gap-4">
                            <button onClick={() => setShowTransferConfirm(false)} className="btn-secondary">Cancel</button>
                            <button onClick={handleTransferAdmin} className="btn-danger">Confirm Transfer</button>
                        </div>
                    </div>
                </Modal>
            )}

            {showRemoveConfirm && (
                 <Modal onClose={() => setShowRemoveConfirm(null)}>
                    <div className="p-6 text-center">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Remove Member?</h3>
                        <p className="text-gray-600 mb-6">Are you sure you want to remove <strong>{showRemoveConfirm.full_name}</strong> from the group?</p>
                        <div className="flex justify-end gap-4">
                            <button onClick={() => setShowRemoveConfirm(null)} className="btn-secondary">Cancel</button>
                            <button onClick={() => handleRemoveMember(showRemoveConfirm.id)} className="btn-danger">Yes, Remove</button>
                        </div>
                    </div>
                </Modal>
            )}
            
            {showDeleteConfirm && (
                <Modal onClose={() => setShowDeleteConfirm(false)}>
                    <div className="p-2">
                        <h3 className="text-xl font-bold text-red-700 mb-4">Confirm Deletion</h3>
                        <p className="mb-4">This action is irreversible. To confirm, please type <strong className="text-red-600 font-mono">delete {group.name}</strong> into the box below.</p>
                        <input type="text" value={confirmText} onChange={e => setConfirmText(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm mb-4" />
                        <button onClick={handleDeleteGroup} className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300" disabled={confirmText !== `delete ${group.name}`}>
                            I understand, delete this group
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};


// ====================================================================================
// --- SUB-COMPONENTS ---
// ====================================================================================
const MembersList = ({ members, adminId }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-2xl font-bold mb-4">Group Members ({members.length})</h3>
        <ul className="space-y-3">
            {members.map(member => (
                <li key={member.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50">
                    <span className="bg-indigo-100 text-indigo-700 font-bold rounded-full h-10 w-10 flex items-center justify-center text-lg">
                        {member.full_name?.charAt(0).toUpperCase() || '?'}
                    </span>
                    <div>
                        <p className="font-semibold text-gray-800">{member.full_name}</p>
                        <p className="text-sm text-gray-500">{member.business_name}</p>
                    </div>
                    {member.id === adminId && <span className="ml-auto text-xs font-bold bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">Admin</span>}
                </li>
            ))}
        </ul>
    </div>
);

const SupplierReviewsModal = ({ reviews, supplierName }) => (
    <div>
        <h3 className="text-xl font-bold mb-4">Reviews for {supplierName}</h3>
        <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
            {reviews.length > 0 ? reviews.map(review => (
                <div key={review.id} className="border-b pb-3">
                    <div className="flex justify-between items-center">
                        <p className="font-semibold">{review.vendor.full_name}</p>
                        <StarRating rating={review.rating} readOnly />
                    </div>
                    <p className="text-gray-600 mt-1">{review.review_text}</p>
                </div>
            )) : <p>No reviews to display.</p>}
        </div>
    </div>
);

const DealCard = ({ deal, onAddToCart, onToggleFavorite, isFavorite, onViewSupplier }) => {
    const [quantity, setQuantity] = useState(deal.min_order_quantity || 1);
    const [showReviews, setShowReviews] = useState(false);

    const ratings = deal.profiles?.ratings || [];
    const averageRating = ratings.length > 0 ? ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length : 0;

    return (
    <div className="bg-white p-5 rounded-xl shadow-lg transition-shadow hover:shadow-xl flex items-start gap-4">
        {showReviews && <Modal onClose={() => setShowReviews(false)}><SupplierReviewsModal reviews={ratings} supplierName={deal.profiles?.business_name} /></Modal>}
        
        <img 
            src={deal.image_url || 'https://placehold.co/100x100/e2e8f0/e2e8f0?text=No+Image'} 
            alt={deal.item_name} 
            className="w-24 h-24 rounded-md object-cover bg-gray-100 flex-shrink-0"
        />

        <div className="flex-grow flex flex-col h-full"> 
            <div className="flex-grow">
                <div className="flex justify-between items-start">
                    <h4 className="text-xl font-bold text-gray-900">{deal.item_name}</h4>
                    <button 
                        onClick={() => onToggleFavorite(deal.supplier_id)} 
                        className={`p-1 rounded-full ${isFavorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-400'}`} 
                        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        aria-pressed={isFavorite}
                    >
                        <IconStar isFavorite={isFavorite} />
                    </button>
                </div>
                <button onClick={onViewSupplier} className="text-sm text-indigo-600 hover:underline mb-3">by {deal.profiles?.business_name || 'Unknown Supplier'}</button>
                
                {ratings.length > 0 ? (
                    <div className="flex items-center gap-2 mb-3 cursor-pointer" onClick={() => setShowReviews(true)}>
                        <StarRating rating={averageRating} readOnly />
                        <span className="text-sm text-blue-600 hover:underline">({ratings.length} reviews)</span>
                    </div>
                ) : (
                        <p className="text-sm text-gray-400 mb-3">No reviews yet</p>
                )}
                <p className="text-gray-600 text-sm mb-4">{deal.item_description}</p>
            </div>

            <div className="border-t pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <p className="text-2xl font-bold text-indigo-600">₹{deal.price_per_unit.toFixed(2)} <span className="text-base font-normal text-gray-500">/ {deal.unit}</span></p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input type="number" min={deal.min_order_quantity} value={quantity} onChange={(e) => setQuantity(Math.max(deal.min_order_quantity, parseInt(e.target.value) || 1))} className="w-20 p-2 border rounded-md text-center"/>
                    <button onClick={() => onAddToCart(deal.id, quantity)} className="btn-primary-sm flex-grow bg-blue-500 rounded-lg px-4 py-2 hover:bg-blue-600 text-white ">Add to Cart</button>
                </div>
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

const VendorOrderCard = ({ order, session, onUpdate, onRepeatOrder, setNotification }) => {
    const [showRatingModal, setShowRatingModal] = useState(false);
    const statusClasses = {
        pending: 'bg-yellow-100 text-yellow-800',
        accepted: 'bg-green-100 text-green-800',
        denied: 'bg-red-100 text-red-800',
        completed: 'bg-blue-100 text-blue-800',
    };
    
    const existingReview = order.ratings.find(r => r.vendor_id === session.user.id);

    const handleRatingSubmit = async (rating, review) => {
        const { error } = await supabase.from('ratings').upsert({
            id: existingReview?.id,
            order_id: order.id,
            supplier_id: order.supplier.id, 
            vendor_id: session.user.id,
            rating,
            review_text: review,
        });
        if (error) {
            setNotification({type: 'error', message: `Error submitting review: ${error.message}`});
        } else {
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
                <span className={`px-3 py-1 text-sm rounded-full font-semibold ${statusClasses[order.status]}`}>{order.status}</span>
            </div>
        </div>
        <ul className="text-sm text-gray-600 mt-2 list-disc list-inside bg-gray-50 p-3 rounded-md">
            {order.order_items.map(item => (
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

const CartModal = ({ deals, cart, onClose, onUpdateCart, onPlaceOrder }) => {
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const cartItems = Object.keys(cart).map(dealId => ({
        deal: deals.find(d => d.id === dealId),
        quantity: cart[dealId],
    })).filter(item => item.deal && item.quantity > 0);

    const totalCartValue = cartItems.reduce((total, item) => {
        return total + (item.deal.price_per_unit * item.quantity);
    }, 0);

    return (
        <Modal onClose={onClose}>
            <div className="p-1">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-gray-800">Your Cart</h3>
                </div>
                {cartItems.length > 0 ? (
                    <div className="max-h-[60vh] overflow-y-auto pr-2">
                        <div className="space-y-4">
                            {cartItems.map(({deal, quantity}) => (
                                <div key={deal.id} className="flex justify-between items-center gap-4">
                                    <div>
                                        <p className="font-semibold">{deal.item_name}</p>
                                        <p className="text-sm text-gray-500">@{deal.price_per_unit}/{deal.unit}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="number" min="0" value={quantity} onChange={(e) => onUpdateCart(deal.id, e.target.value)} className="w-16 text-center border rounded p-1"/>
                                        <span>{deal.unit}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="border-t pt-4 mt-4">
                            <div className="flex justify-between font-bold text-lg mb-4">
                                <span>Total:</span>
                                <span>₹{totalCartValue.toFixed(2)}</span>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="input-style w-full">
                                    <option value="cod">Cash on Delivery (COD)</option>
                                    <option value="upi">UPI</option>
                                </select>
                            </div>
                            <button onClick={onPlaceOrder} className="btn-primary w-full">Place Group Order</button>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-500 py-10 text-center">Your cart is empty.</p>
                )}
            </div>
        </Modal>
    );
};

const SupplierProfileModal = ({ supplier, deals, onClose }) => (
    <Modal onClose={onClose}>
        <div className="p-1">
            <h3 className="text-2xl font-bold mb-2">{supplier.business_name}</h3>
            <div className="flex items-center gap-2 mb-4">
                <StarRating rating={supplier.ratings.reduce((acc, r) => acc + r.rating, 0) / supplier.ratings.length || 0} readOnly />
                <span className="text-sm text-gray-600">({supplier.ratings.length} reviews)</span>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div>
                    <h4 className="font-bold text-lg mb-2 border-b pb-1">Active Deals</h4>
                    {deals.map(deal => (
                        <div key={deal.id} className="p-2 border-b">
                            <p className="font-semibold">{deal.item_name}</p>
                            <p className="text-sm">₹{deal.price_per_unit}/{deal.unit} (Min: {deal.min_order_quantity})</p>
                        </div>
                    ))}
                </div>
                <div>
                    <h4 className="font-bold text-lg mb-2 border-b pb-1">All Reviews</h4>
                    <SupplierReviewsModal reviews={supplier.ratings} supplierName={supplier.business_name} />
                </div>
            </div>
        </div>
    </Modal>
);

const GroupStatsView = ({ orders }) => {
    const { totalSpending, totalOrders, estimatedSavings } = useMemo(() => {
        const completedOrders = orders.filter(o => o.status === 'completed');
        const totalSpending = completedOrders.reduce((sum, order) => sum + order.total_value, 0);
        const estimatedSavings = totalSpending * 0.10; // Mock value
        return { totalSpending, totalOrders: completedOrders.length, estimatedSavings };
    }, [orders]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-2xl font-bold mb-4">Group Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-gray-500 text-sm font-medium">Total Group Spending</h4>
                    <p className="text-3xl font-bold text-gray-800">₹{totalSpending.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-gray-500 text-sm font-medium">Completed Group Orders</h4>
                    <p className="text-3xl font-bold text-gray-800">{totalOrders}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="text-green-700 text-sm font-medium">Estimated Group Savings</h4>
                    <p className="text-3xl font-bold text-green-800">~ ₹{estimatedSavings.toFixed(2)}</p>
                </div>
            </div>
        </div>
    );
};

const MyStatsView = ({ orders, session }) => {
    const { myTotalSpending, myTopItems, myTopSuppliers } = useMemo(() => {
        const myOrderItems = orders
            .filter(o => o.status === 'completed')
            .flatMap(o => o.order_items.filter(item => item.vendor_id === session.user.id).map(item => ({...item, supplier: o.supplier})));

        const myTotalSpending = myOrderItems.reduce((sum, item) => sum + (item.quantity * item.deal.price_per_unit), 0);

        const itemCounts = myOrderItems.reduce((acc, item) => {
            acc[item.deal.item_name] = (acc[item.deal.item_name] || 0) + item.quantity;
            return acc;
        }, {});
        const myTopItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

        const supplierSpending = myOrderItems.reduce((acc, item) => {
            acc[item.supplier.business_name] = (acc[item.supplier.business_name] || 0) + (item.quantity * item.deal.price_per_unit);
            return acc;
        }, {});
        const myTopSuppliers = Object.entries(supplierSpending).sort((a, b) => b[1] - a[1]).slice(0, 5);

        return { myTotalSpending, myTopItems, myTopSuppliers };
    }, [orders, session.user.id]);

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


// ====================================================================================
// --- MAIN COMPONENT: GroupView ---
// ====================================================================================
const GroupView = ({ initialGroup, session, onBack, onLeaveOrDelete }) => {
    // --- STATE MANAGEMENT ---
    const [group, setGroup] = useState(initialGroup);
    const [deals, setDeals] = useState([]);
    const [cart, setCart] = useState({});
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState(null);
    const [members, setMembers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('deals');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Modal States
    const [showCart, setShowCart] = useState(false);
    const [viewingSupplier, setViewingSupplier] = useState(null);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

    // Filter/Sort States
    const [dealSort, setDealSort] = useState({ key: 'price_per_unit', asc: true });
    const [dealFilter, setDealFilter] = useState('');
    const [orderSort, setOrderSort] = useState({ key: 'created_at', asc: false });
    const [orderFilter, setOrderFilter] = useState('');
    const [showMyOrdersOnly, setShowMyOrdersOnly] = useState(false);
    const [favoriteSuppliers, setFavoriteSuppliers] = useState(new Set());

    // --- MEMOIZED VALUES ---
    const isGroupAdmin = useMemo(() => group?.admin_id === session.user.id, [group, session.user.id]);
    
    // REFACTOR (DRY): Navigation items defined in one place
    const navItems = useMemo(() => [
        { key: 'deals', label: 'Deals', icon: <IconShoppingBag />, admin: false },
        { key: 'favorites', label: 'Favorites', icon: <IconStar isFavorite={true} />, admin: false },
        { key: 'members', label: 'Members', icon: <IconUsers />, admin: false },
        { key: 'history', label: 'Order History', icon: <IconArchive />, admin: false },
        { key: 'group-stats', label: 'Group Stats', icon: <IconTrendingUp />, admin: false },
        { key: 'my-stats', label: 'My Stats', icon: <IconTrendingUp />, admin: false },
        { key: 'admin', label: 'Admin Settings', icon: <IconSettings />, admin: true }
    ], []);

    // --- DATA FETCHING ---
    const fetchOrders = useCallback(async (groupId) => {
        const { data, error } = await supabase.from('group_orders')
            .select('*, supplier:supplier_id(id, business_name), order_items(*, deal:deals(*)), ratings(*, vendor:vendor_id(full_name))')
            .eq('group_id', groupId)
            .order('created_at', { ascending: false });
        if (error) setNotification({type: 'error', message: "Error fetching orders"});
        else setOrders(data || []);
    }, []);

    const fetchGroupData = useCallback(async (showLoading = true) => {
        if(showLoading) setLoading(true);
        
        // Fetch group details
        const { data: freshGroupData, error: freshGroupError } = await supabase.from('groups').select('*').eq('id', group.id).single();
        if (freshGroupError) {
            setNotification({ type: 'error', message: 'Could not refresh group data. Please go back and try again.' });
            setLoading(false); return;
        }
        setGroup(freshGroupData);

        // Fetch members
        const { data: memberData, error: memberError } = await supabase.from('group_members').select('profiles(*)').eq('group_id', group.id);
        if (memberError) {
            setNotification({ type: 'error', message: 'Failed to load group members.' });
        } else {
            setMembers(memberData.map(m => m.profiles));
        }

        // PERFORMANCE FIX (Conceptual): This RPC should join profiles to avoid a second DB call.
        // The function should be named `search_deals_with_profiles` in your Supabase SQL editor.
        const { data: dealsData } = await supabase.rpc('search_deals_by_pincode', { pincode_to_search: group.pincode });
        if (dealsData) {
            const supplierIds = [...new Set(dealsData.map(d => d.supplier_id))];
            if (supplierIds.length > 0) {
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select(`id, business_name, ratings:ratings_supplier_id_fkey(*, vendor:vendor_id(full_name))`)
                    .in('id', supplierIds);
                
                const dealsWithProfiles = dealsData.map(deal => ({
                    ...deal,
                    profiles: (profilesData || []).find(p => p.id === deal.supplier_id)
                }));
                setDeals(dealsWithProfiles);
            } else { setDeals([]); }
        } else { setDeals([]); }

        await fetchOrders(group.id);
        if(showLoading) setLoading(false);
    }, [group.id, group.pincode, fetchOrders]);
    
    useEffect(() => {
        fetchGroupData();
    }, [fetchGroupData]);

    // --- HANDLERS ---
    const handleLeaveGroup = async () => {
        setShowLeaveConfirm(false); // Close confirmation modal
        if (isGroupAdmin && members.length > 1) {
            setNotification({type: 'error', message: "Admins cannot leave a group with other members. Please transfer admin rights or delete the group."});
            return;
        }
        
        const { error } = await supabase.from('group_members').delete().match({ group_id: group.id, user_id: session.user.id });
        if (error) {
            setNotification({ type: 'error', message: `Failed to leave group: ${error.message}` });
        } else {
            onLeaveOrDelete();
        }
    };

    const handleUpdateCart = (dealId, quantity) => {
        const newQuantity = parseInt(quantity, 10);
        if (isNaN(newQuantity) || newQuantity < 0) return;
        setCart(prev => {
            const newCart = {...prev};
            if (newQuantity === 0) delete newCart[dealId];
            else newCart[dealId] = newQuantity;
            return newCart;
        });
    };

    const handlePlaceOrder = async () => {
        const cartItems = Object.keys(cart).filter(dealId => cart[dealId] > 0);
        if (cartItems.length === 0) {
            setNotification({ type: 'error', message: 'Your cart is empty.' }); return;
        }

        for (const dealId of cartItems) {
            const deal = deals.find(d => d.id === dealId);
            if (cart[dealId] < deal.min_order_quantity) {
                setNotification({ type: 'error', message: `'${deal.item_name}' requires a minimum of ${deal.min_order_quantity} ${deal.unit}.` });
                return;
            }
        }

        const ordersBySupplier = cartItems.reduce((acc, dealId) => {
            const deal = deals.find(d => d.id === dealId);
            if (!deal || !deal.profiles) return acc;
            const supplierId = deal.profiles.id;
            if (!acc[supplierId]) acc[supplierId] = { items: [] };
            acc[supplierId].items.push({ deal_id: deal.id, quantity: cart[dealId] });
            return acc;
        }, {});

        // SECURITY FIX: Use a server-side RPC for atomic & secure order creation
        for (const supplierId in ordersBySupplier) {
            const orderData = ordersBySupplier[supplierId];
            
            // IMPORTANT: This 'create_order' function must be created in your Supabase SQL editor.
            // It should handle inserting into 'group_orders' and 'order_items' in a single transaction
            // and calculate the total price securely on the server to prevent tampering.
            const { error } = await supabase.rpc('create_order', {
                p_group_id: group.id,
                p_supplier_id: supplierId,
                p_vendor_id: session.user.id,
                p_items: orderData.items // Pass array of { deal_id, quantity }
            });

            if (error) {
                setNotification({ type: 'error', message: `Failed to create order: ${error.message}` });
                return; // Stop processing further orders on failure
            }
        }

        setNotification({ type: 'success', message: 'Your order has been sent to the supplier(s)!' });
        setCart({});
        setShowCart(false);
        fetchGroupData(false); // Refetch all data to show the new order
    };
    
    const handleRepeatOrder = (order) => {
        const newCartItems = {};
        let itemsAdded = 0;
        order.order_items.forEach(item => {
            const dealExists = deals.find(d => d.id === item.deal_id && d.is_active);
            if (dealExists) {
                newCartItems[item.deal_id] = (cart[item.deal_id] || 0) + item.quantity;
                itemsAdded++;
            }
        });

        if (itemsAdded > 0) {
            setCart(prev => ({ ...prev, ...newCartItems }));
            setNotification({ type: 'success', message: 'Items from your past order have been added to your cart!' });
            setShowCart(true);
        } else {
            setNotification({ type: 'info', message: 'None of the items from this order are currently available.' });
        }
    };
    
    const toggleFavoriteSupplier = (supplierId) => {
        setFavoriteSuppliers(prev => {
            const newFavs = new Set(prev);
            if (newFavs.has(supplierId)) newFavs.delete(supplierId);
            else newFavs.add(supplierId);
            return newFavs;
        });
    };

    const handleTabClick = (tabName) => {
        setActiveTab(tabName);
        setIsMobileMenuOpen(false);
    };

    // --- RENDER LOGIC ---
    const displayedDeals = useMemo(() => {
        return [...deals]
            .filter(deal => (!dealFilter || deal.supplier_id === dealFilter) && (activeTab !== 'favorites' || favoriteSuppliers.has(deal.supplier_id)))
            .sort((a, b) => {
                const valA = a[dealSort.key]; const valB = b[dealSort.key];
                if (valA < valB) return dealSort.asc ? -1 : 1;
                if (valA > valB) return dealSort.asc ? 1 : -1;
                return 0;
            });
    }, [deals, dealSort, dealFilter, activeTab, favoriteSuppliers]);
    
    const displayedOrders = useMemo(() => {
        return [...orders]
            .filter(order => (!orderFilter || order.status === orderFilter) && (!showMyOrdersOnly || order.order_items.some(item => item.vendor_id === session.user.id)))
            .sort((a, b) => {
                let valA, valB;
                if (orderSort.key === 'created_at') { valA = new Date(a.created_at); valB = new Date(b.created_at); }
                else { valA = a.total_value; valB = b.total_value; }
                if (valA < valB) return orderSort.asc ? -1 : 1;
                if (valA > valB) return orderSort.asc ? 1 : -1;
                return 0;
            });
    }, [orders, orderSort, orderFilter, showMyOrdersOnly, session.user.id]);

    const suppliers = useMemo(() => [...new Map(deals.filter(d => d.profiles).map(d => [d.profiles.id, d.profiles])).values()], [deals]);
    const orderStatuses = useMemo(() => [...new Set(orders.map(o => o.status))], [orders]);
    const cartItemsCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

    if (loading) return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
    
    const renderTabs = (isMobile = false) => (
        <div className={isMobile ? "sm:hidden mt-2 border-t border-gray-200 flex flex-col space-y-1 p-1" : "hidden sm:flex sm:space-x-2"}>
            {navItems.map(item =>
                (!item.admin || isGroupAdmin) && (
                    <TabButton
                        key={item.key}
                        icon={item.icon}
                        label={item.label}
                        isActive={activeTab === item.key}
                        onClick={() => handleTabClick(item.key)}
                    />
                )
            )}
        </div>
    );
    
    return (
        <div className="min-h-screen bg-gray-50">
            {notification && <Notification {...notification} onDismiss={() => setNotification(null)} />}
            
            <header className="bg-white shadow-sm sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div className="flex items-center gap-4 w-full">
                            <button onClick={onBack} className="btn-secondary-sm whitespace-nowrap">&larr; Back</button>
                            <div className="min-w-0">
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 truncate" title={group.name}>{group.name}</h2>
                                <p className="text-xs sm:text-sm text-gray-500">Pincode: {group.pincode} | Join Code: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{group.join_code}</span></p>
                            </div>
                        </div>
                        {/* UX FIX: Use a modal for confirmation instead of window.confirm */}
                        <button onClick={() => setShowLeaveConfirm(true)} className="btn-danger-sm self-end sm:self-center whitespace-nowrap">Leave Group</button>
                    </div>
                </div>
            </header>
            
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6 border-b border-gray-200">
                    <div className="sm:hidden flex justify-between items-center">
                        <span className="font-bold text-lg text-indigo-600 capitalize">{activeTab.replace('-', ' ')}</span>
                        <button 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 text-gray-600 rounded-md hover:bg-gray-100"
                            aria-expanded={isMobileMenuOpen} // ACCESSIBILITY FIX
                            aria-controls="mobile-menu"
                        >
                            <IconMenu />
                        </button>
                    </div>
                    {renderTabs(false)} {/* Desktop Tabs */}
                    {isMobileMenuOpen && <div id="mobile-menu">{renderTabs(true)}</div>} {/* Mobile Tabs */}
                </div>
                
                <div>
                    {(activeTab === 'deals' || activeTab === 'favorites') && (
                        <div>
                            <FilterSortControls
                                filters={[ { value: '', label: 'All Suppliers' }, ...suppliers.map(s => ({ value: s.id, label: s.business_name })) ]}
                                sortOptions={[ { key: 'price_per_unit', label: 'Price' }, { key: 'item_name', label: 'Name' } ]}
                                filter={dealFilter} setFilter={setDealFilter}
                                sort={dealSort} setSort={setDealSort}
                                filterLabel="Supplier"
                            />
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
                               {displayedDeals.length > 0 ? displayedDeals.map(deal => (
                                   <DealCard key={deal.id} deal={deal} onAddToCart={(dealId, qty) => setCart(prev => ({ ...prev, [dealId]: (prev[dealId] || 0) + qty }))} onToggleFavorite={toggleFavoriteSupplier} isFavorite={favoriteSuppliers.has(deal.supplier_id)} onViewSupplier={() => setViewingSupplier(deal.profiles)} />
                               )) : <p className="text-gray-500 xl:col-span-2 text-center py-10">{activeTab === 'favorites' ? 'You have no favorite suppliers yet.' : 'No active deals match your criteria.'}</p>}
                            </div>
                        </div>
                    )}
                    {activeTab === 'members' && <MembersList members={members} adminId={group.admin_id} />}
                    {activeTab === 'history' && (
                        <div>
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                <FilterSortControls
                                    filters={[ { value: '', label: 'All Statuses' }, ...orderStatuses.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))]}
                                    sortOptions={[ { key: 'created_at', label: 'Date' }, { key: 'total_value', label: 'Total Value' } ]}
                                    filter={orderFilter} setFilter={setOrderFilter}
                                    sort={orderSort} setSort={setOrderSort}
                                    filterLabel="Status"
                                />
                                <div className="flex items-center self-end sm:self-center">
                                    <label htmlFor="my-orders-toggle" className="mr-2 text-sm font-medium text-gray-700 whitespace-nowrap">My Orders Only</label>
                                    <input type="checkbox" id="my-orders-toggle" checked={showMyOrdersOnly} onChange={() => setShowMyOrdersOnly(!showMyOrdersOnly)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                </div>
                            </div>
                            <div className="space-y-4 mt-6">
                                {displayedOrders.length > 0 ? displayedOrders.map(order => <VendorOrderCard key={order.id} order={order} session={session} onUpdate={() => fetchGroupData(false)} onRepeatOrder={handleRepeatOrder} setNotification={setNotification} />) : <p className="text-gray-500 text-center py-10">No orders found.</p>}
                            </div>
                        </div>
                    )}
                    {activeTab === 'group-stats' && <GroupStatsView orders={orders} />}
                    {activeTab === 'my-stats' && <MyStatsView orders={orders} session={session} />}
                    {activeTab === 'admin' && isGroupAdmin && 
                        <AdminSettings 
                            group={group} 
                            members={members} 
                            session={session}
                            onUpdate={() => fetchGroupData(false)}
                            onGroupDeleted={onLeaveOrDelete}
                            setParentNotification={setNotification}
                        />
                    }
                </div>
            </main>
            
            <button onClick={() => setShowCart(true)} className="fixed bottom-8 right-8 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition transform hover:scale-110 z-30">
                <IconShoppingCart />
                {cartItemsCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">{cartItemsCount}</span>}
            </button>

            {showCart && <CartModal deals={deals} cart={cart} onClose={() => setShowCart(false)} onUpdateCart={handleUpdateCart} onPlaceOrder={handlePlaceOrder} />}
            {viewingSupplier && <SupplierProfileModal supplier={viewingSupplier} deals={deals.filter(d => d.supplier_id === viewingSupplier.id)} onClose={() => setViewingSupplier(null)} />}

            {/* UX FIX: Confirmation Modal for Leaving Group */}
            {showLeaveConfirm && (
                <Modal onClose={() => setShowLeaveConfirm(false)}>
                    <div className="p-4">
                        <h3 className="text-xl font-bold mb-4">Leave Group?</h3>
                        <p className="text-gray-600 mb-6">Are you sure you want to leave "{group.name}"? This action cannot be undone.</p>
                        <div className="flex justify-end gap-4">
                            <button onClick={() => setShowLeaveConfirm(false)} className="btn-secondary">Cancel</button>
                            <button onClick={handleLeaveGroup} className="btn-danger">Leave</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default GroupView