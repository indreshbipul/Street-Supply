import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Modal } from './UI';

// --- SVG Icons ---
const IconTrash = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const IconAlertTriangle = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;


const AdminSettings = ({ group, members, session, onUpdate, onGroupDeleted, setParentNotification }) => {
    const [newName, setNewName] = useState(group.name);
    const [newAdminId, setNewAdminId] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [confirmText, setConfirmText] = useState('');

    const handleUpdateDetails = async (e) => {
        e.preventDefault();
        const { error } = await supabase.from('groups').update({ name: newName }).eq('id', group.id);
        if (error) setParentNotification({ type: 'error', message: error.message });
        else {
            setParentNotification({ type: 'success', message: 'Group name updated.' });
            onUpdate();
        }
    };

    const handleTransferAdmin = async (e) => {
        e.preventDefault();
        if (!newAdminId) {
            setParentNotification({ type: 'error', message: 'Please select a member to transfer ownership to.' }); return;
        }
        if (window.confirm(`Are you sure you want to make this person the new admin? You will lose your admin privileges.`)) {
            const { error } = await supabase.from('groups').update({ admin_id: newAdminId }).eq('id', group.id);
            if (error) setParentNotification({ type: 'error', message: error.message });
            else {
                setParentNotification({ type: 'success', message: 'Admin rights transferred successfully.' });
                onUpdate();
            }
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (memberId === group.admin_id) {
            setParentNotification({ type: 'error', message: 'Cannot remove the group admin.' }); return;
        }
        if (window.confirm('Are you sure you want to remove this member from the group?')) {
            const { error } = await supabase.from('group_members').delete().match({ group_id: group.id, user_id: memberId });
            if (error) setParentNotification({ type: 'error', message: error.message });
            else {
                setParentNotification({ type: 'success', message: 'Member removed.' });
                onUpdate();
            }
        }
    };

    const handleDeleteGroup = async () => {
        if (confirmText !== `delete ${group.name}`) {
            setParentNotification({ type: 'error', message: 'Confirmation text does not match.' }); return;
        }
        const { error } = await supabase.from('groups').delete().eq('id', group.id);
        if (error) {
            setParentNotification({ type: 'error', message: `Failed to delete group: ${error.message}` });
        } else {
            alert('Group has been permanently deleted.');
            onGroupDeleted();
        }
        setShowDeleteConfirm(false);
    };
    
    return (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg space-y-12">
            <h3 className="text-3xl font-bold text-gray-900 tracking-tight">Admin Controls</h3>
            
            {/* Edit Group Details Section */}
            <div className="p-6 border border-gray-200 rounded-xl">
                <h4 className="text-xl font-bold text-gray-800 mb-4">Edit Group Details</h4>
                <form onSubmit={handleUpdateDetails} className="space-y-4">
                    <div>
                        <label htmlFor="groupName" className="block text-sm font-medium text-gray-700">Group Name</label>
                        <input id="groupName" type="text" value={newName} onChange={e => setNewName(e.target.value)} className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                    </div>
                    <button type="submit" className="btn-primary-sm">Save Changes</button>
                </form>
            </div>

            {/* Transfer Admin Section */}
            <div className="p-6 border border-gray-200 rounded-xl">
                <h4 className="text-xl font-bold text-gray-800 mb-4">Transfer Admin Ownership</h4>
                <p className="text-sm text-gray-600 mb-4">If you transfer ownership, you will become a regular member.</p>
                <form onSubmit={handleTransferAdmin} className="space-y-4">
                    <div>
                        <label htmlFor="newAdmin" className="block text-sm font-medium text-gray-700">Select New Admin</label>
                        <select id="newAdmin" value={newAdminId} onChange={e => setNewAdminId(e.target.value)} className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                            <option value="" disabled>Select a member...</option>
                            {members.filter(m => m.id !== session.user.id).map(m => (
                                <option key={m.id} value={m.id}>{m.full_name} ({m.business_name})</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className="btn-secondary-sm" disabled={!newAdminId}>Transfer Ownership</button>
                </form>
            </div>
            
            {/* Manage Members Section */}
            <div className="p-6 border border-gray-200 rounded-xl">
                <h4 className="text-xl font-bold text-gray-800 mb-4">Manage Members</h4>
                 <ul className="space-y-3 max-w-lg">
                    {members.map(member => (
                        <li key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-4">
                               <span className="bg-indigo-100 text-indigo-700 font-bold rounded-full h-10 w-10 flex items-center justify-center text-lg">
                                   {member.full_name?.charAt(0).toUpperCase() || '?'}
                               </span>
                               <div>
                                   <p className="font-semibold text-gray-900">{member.full_name}</p>
                                   <p className="text-sm text-gray-500">{member.business_name}</p>
                               </div>
                            </div>
                            {member.id !== group.admin_id ? (
                                <button onClick={() => handleRemoveMember(member.id)} className="btn-danger-sm flex items-center gap-1.5"><IconTrash /> Remove</button>
                            ) : (
                                <span className="text-xs font-bold bg-yellow-200 text-yellow-800 px-2.5 py-1 rounded-full">Admin</span>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Danger Zone Section */}
            <div className="bg-red-50 border border-red-300 text-red-800 rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 text-red-500">
                        <IconAlertTriangle />
                    </div>
                    <div>
                        <h4 className="text-xl font-bold text-red-900">Danger Zone</h4>
                        <p className="text-sm text-red-800 mt-2 mb-4">Deleting the group is permanent and will remove all associated data. This action cannot be undone.</p>
                        <button onClick={() => setShowDeleteConfirm(true)} className="btn-danger">Delete This Group</button>
                    </div>
                </div>
            </div>

            {showDeleteConfirm && (
                <Modal onClose={() => setShowDeleteConfirm(false)}>
                    <div className="p-2">
                        <h3 className="text-xl font-bold text-red-700 mb-4">Confirm Deletion</h3>
                        <p className="mb-4">This action is irreversible. To confirm, please type <strong className="text-red-600 font-mono bg-red-100 p-1 rounded">delete {group.name}</strong> into the box below.</p>
                        <input type="text" value={confirmText} onChange={e => setConfirmText(e.target.value)} className="input-style w-full mb-4" />
                        <button onClick={handleDeleteGroup} className="btn-danger w-full" disabled={confirmText !== `delete ${group.name}`}>
                            I understand, delete this group
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default AdminSettings;
