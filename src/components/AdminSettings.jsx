import React, { useState, useEffect, useCallback } from 'react';

// --- Real Supabase Client ---
// Make sure this path is correct for your project structure.
import { supabase } from '../services/supabaseClient';

// --- SVG Icons (Updated as per your request) ---
const IconSettings = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const IconTrash = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const IconCheckCircle = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
const IconXCircle = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>;


// --- Reusable UI Components ---
const Modal = ({ onClose, children }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto">
            <div className="relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                {children}
            </div>
        </div>
    </div>
);

const Notification = ({ notification, onDismiss }) => {
    if (!notification.message) return null;
    const baseClasses = "flex items-center gap-4 p-4 rounded-lg shadow-md max-w-md mx-auto mt-4";
    const typeClasses = { success: "bg-green-50 text-green-800", error: "bg-red-50 text-red-800" };
    const Icon = notification.type === 'success' ? IconCheckCircle : IconXCircle;

    return (
        <div className={`${baseClasses} ${typeClasses[notification.type]}`}>
            <Icon />
            <p className="flex-grow text-sm">{notification.message}</p>
            <button onClick={onDismiss} className="text-current opacity-70 hover:opacity-100">&times;</button>
        </div>
    );
};


// --- AdminSettings Component (Updated with new layout) ---
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
        // Applying new layout from your request
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

            {/* Modals for Confirmation */}
            {showTransferConfirm && (
                <Modal onClose={() => setShowTransferConfirm(false)}>
                    <div className="p-6 text-center">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Transfer Ownership?</h3>
                        <p className="text-gray-600 mb-6">Are you sure? You will lose your admin privileges.</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => setShowTransferConfirm(false)} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                            <button onClick={handleTransferAdmin} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Confirm Transfer</button>
                        </div>
                    </div>
                </Modal>
            )}

            {showRemoveConfirm && (
                 <Modal onClose={() => setShowRemoveConfirm(null)}>
                    <div className="p-6 text-center">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Remove Member?</h3>
                        <p className="text-gray-600 mb-6">Are you sure you want to remove <strong>{showRemoveConfirm.full_name}</strong> from the group?</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => setShowRemoveConfirm(null)} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                            <button onClick={() => handleRemoveMember(showRemoveConfirm.id)} className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Yes, Remove</button>
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


// --- Parent Page Component (Connects to Real Supabase) ---
// This component manages all state and API calls.
// It requires a `groupId` prop to know which group to fetch.
//
// HOW TO USE THIS COMPONENT:
// In your application (e.g., in your router or tab container),
// you must render this component and pass the ID of the group.
//
// Example:
// const MyPage = () => {
//   const { groupId } = useParams(); // or get it from another state
//   return <GroupSettingsPage groupId={groupId} />;
// }
//
export default function GroupSettingsPage({ groupId }) {
    const [group, setGroup] = useState(null);
    const [members, setMembers] = useState([]);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true); // Represents the initial auth check
    const [notification, setNotification] = useState({ type: '', message: '' });
    const [groupDeleted, setGroupDeleted] = useState(false);
    const [dataLoading, setDataLoading] = useState(false); // A separate state for data fetching
    const [fetchError, setFetchError] = useState(null); // New state to store specific fetch errors

    // Central function to fetch all required data from Supabase.
    const fetchGroupData = useCallback(async (currentGroupId, currentSession) => {
        if (!currentGroupId || !currentSession) {
            return;
        }
        setDataLoading(true);
        setFetchError(null); // Reset error on new fetch attempt
        console.log(`--- Fetching group data for ID: ${currentGroupId} ---`);

        const { data: groupData, error: groupError } = await supabase
            .from('groups')
            .select('*')
            .eq('id', currentGroupId)
            .single();

        if (groupError || !groupData) {
            const errorMessage = groupError?.message || 'Group not found. You may not have permission to view it.';
            setNotification({ type: 'error', message: errorMessage });
            setFetchError(errorMessage); // Store the specific error from Supabase
            setGroup(null);
            setDataLoading(false);
            return;
        }
        
        const { data: membersData, error: membersError } = await supabase
            .from('group_members')
            .select('profiles(*)')
            .eq('group_id', currentGroupId);

        if (membersError) {
             setNotification({ type: 'error', message: membersError.message });
        }

        setGroup(groupData);
        setMembers(membersData ? membersData.map(m => m.profiles) : []);
        setDataLoading(false);
    }, []);

    // This single useEffect handles authentication state reliably.
    useEffect(() => {
        // Add an immediate check for groupId when the component mounts.
        if (!groupId) {
            console.error("FATAL: GroupSettingsPage rendered without a 'groupId' prop. Cannot fetch data.");
            setLoading(false); // Stop the main loading indicator
        }

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setLoading(false); // Auth check is complete, stop initial loading.
        });
        
        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, [groupId]); // Dependency array includes groupId to re-check if it changes.

    // A separate effect to fetch data when session or groupId is available/changes.
    useEffect(() => {
        if (session && groupId) {
            fetchGroupData(groupId, session);
        }
    }, [session, groupId, fetchGroupData]);


    const handleGroupDeleted = () => {
        setGroupDeleted(true);
        setNotification({ type: 'success', message: `Group "${group?.name || ''}" has been permanently deleted.` });
    };
    
    // Effect for auto-dismissing notifications
    useEffect(() => {
        if (notification.message) {
            const timer = setTimeout(() => setNotification({ type: '', message: '' }), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Initial loading state while we wait for the first auth check
    if (loading) {
        return <div className="bg-gray-100 min-h-screen flex items-center justify-center text-gray-500">Initializing...</div>;
    }
    
    // Add a specific error message if groupId is missing.
    if (!groupId) {
        return (
            <div className="bg-gray-100 min-h-screen flex items-center justify-center text-center p-4">
                 <p className="text-red-500 font-semibold text-lg">Configuration Error: This page did not receive a Group ID.</p>
            </div>
        );
    }
    
    if (groupDeleted) {
        return (
             <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center p-4">
                <Notification notification={notification} onDismiss={() => setNotification({ type: '', message: '' })} />
                <div className="text-center mt-8">
                    <h1 className="text-2xl font-bold text-gray-800">Group Deleted</h1>
                </div>
            </div>
        )
    }

    // If there's no session, prompt the user to log in.
    if (!session) {
        return <div className="bg-gray-100 min-h-screen flex items-center justify-center text-red-500 font-semibold">Please log in to view group settings.</div>;
    }

    // If we have a session but data is still loading
    if (dataLoading) {
         return <div className="bg-gray-100 min-h-screen flex items-center justify-center text-gray-500">Loading Group Data...</div>;
    }

    // If there is a session but no group, display the specific error.
    if (!group) {
        return (
            <div className="bg-gray-100 min-h-screen flex items-center justify-center text-center p-4">
                <div>
                    <p className="text-red-500 font-semibold text-lg">Error: Group could not be loaded.</p>
                    {/* Display the specific reason for the failure */}
                    {fetchError && <p className="text-gray-600 mt-2">Reason: {fetchError}</p>}
                </div>
            </div>
        );
    }

    const isAdmin = session.user.id === group.admin_id;

    return (
        <div className="bg-gray-100 min-h-screen font-sans p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
                <Notification notification={notification} onDismiss={() => setNotification({ type: '', message: '' })} />
                
                <div className="my-8 bg-white p-6 rounded-2xl shadow-md">
                    <h1 className="text-4xl font-extrabold text-gray-900">{group.name}</h1>
                    <p className="text-gray-600 mt-2">Admin: <span className="font-semibold">{members.find(m => m.id === group.admin_id)?.full_name || 'N/A'}</span></p>
                </div>

                {isAdmin ? (
                    <AdminSettings
                        group={group}
                        members={members}
                        session={session}
                        onUpdate={() => fetchGroupData(groupId, session)} // Pass session to ensure it's fresh
                        onGroupDeleted={handleGroupDeleted}
                        setParentNotification={setNotification}
                    />
                ) : (
                     <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-xl p-6">
                        <h4 className="font-bold">You are not the admin of this group.</h4>
                     </div>
                )}
            </div>
        </div>
    );
}
