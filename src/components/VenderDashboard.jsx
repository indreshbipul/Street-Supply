import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { Spinner, Modal, Notification } from './UI';
import GroupView from './GroupView';

// --- Form Components ---
const CreateGroupForm = ({ onSubmit }) => {
  const [name, setName] = useState('');
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(name); }}>
      <h3 className="text-xl font-bold mb-4">Create a New Group</h3>
      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Group Name (e.g., 'Kharagpur Chaat Circle')" className="input-style w-full mb-4" required />
      <button type="submit" className="btn-primary w-full">Create</button>
    </form>
  );
};

const JoinGroupForm = ({ onSubmit, pincode }) => {
    const [joinCode, setJoinCode] = useState('');
    const [error, setError] = useState('');

    const handleFindAndJoin = async (e) => {
        e.preventDefault();
        setError('');
        const { data: group, error: fetchError } = await supabase
            .from('groups')
            .select('id')
            .eq('join_code', joinCode.toUpperCase())
            .eq('pincode', pincode)
            .single();
        if (fetchError || !group) {
            setError('Invalid join code for your pincode. Please check and try again.');
        } else {
            onSubmit(group.id);
        }
    };

    return (
        <form onSubmit={handleFindAndJoin}>
            <h3 className="text-xl font-bold mb-4">Join with Code</h3>
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <input type="text" value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="Enter 6-character join code" className="input-style w-full mb-4 uppercase" required />
            <button type="submit" className="btn-primary w-full">Find & Join Group</button>
        </form>
    );
};


// --- Main Dashboard Component ---
const VendorDashboard = ({ profile, session }) => {
    const [myGroups, setMyGroups] = useState([]);
    const [availableGroups, setAvailableGroups] = useState([]);
    const [viewingGroup, setViewingGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState(null);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [showJoinGroup, setShowJoinGroup] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        // Fetch group memberships for the current user
        const { data: memberEntries, error: memberError } = await supabase
            .from('group_members')
            .select('group_id')
            .eq('user_id', session.user.id);

        if (memberError) {
            setNotification({ type: 'error', message: 'Failed to fetch your groups. Please ensure the "group_members" table exists and has correct RLS policies.' });
            setLoading(false);
            return;
        }

        const myGroupIds = memberEntries.map(e => e.group_id);
        if (myGroupIds.length > 0) {
            const { data: groupsData, error: groupsError } = await supabase.from('groups').select('*').in('id', myGroupIds);
            if (groupsError) setNotification({ type: 'error', message: 'Could not load group details.' });
            else setMyGroups(groupsData || []);
        } else {
            setMyGroups([]);
        }

        // Build the query to fetch available groups
        let availableGroupsQuery = supabase
            .from('groups')
            .select('*')
            .eq('pincode', profile.pincode);

        // Only add the 'not in' filter if the user is already in some groups
        if (myGroupIds.length > 0) {
            availableGroupsQuery = availableGroupsQuery.not('id', 'in', `(${myGroupIds.join(',')})`);
        }

        const { data: availableData, error: availableError } = await availableGroupsQuery;

        if(availableError) setNotification({ type: 'error', message: 'Could not load available groups.' });
        else setAvailableGroups(availableData || []);
        
        setLoading(false);
    }, [session.user.id, profile.pincode]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateGroup = async (name) => {
        const join_code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { data: newGroup, error: createError } = await supabase
            .from('groups')
            .insert({ name, pincode: profile.pincode, admin_id: session.user.id, join_code })
            .select()
            .single();

        if (createError) {
            setNotification({ type: 'error', message: createError.message }); return;
        }

        const { error: joinError } = await supabase.from('group_members').insert({ group_id: newGroup.id, user_id: session.user.id });

        if (joinError) {
            setNotification({ type: 'error', message: "Group created, but failed to add you as a member." });
        } else {
            setNotification({ type: 'success', message: `Group "${newGroup.name}" created!` });
            setShowCreateGroup(false);
            await fetchData();
            setViewingGroup(newGroup);
        }
    };

    const handleJoinGroup = async (groupId) => {
        const { error } = await supabase.from('group_members').insert({ group_id: groupId, user_id: session.user.id });

        if (error) {
            setNotification({ type: 'error', message: "Failed to join group. You may already be a member." });
        } else {
            setNotification({ type: 'success', message: "Successfully joined group!" });
            setShowJoinGroup(false);
            setLoading(true); // Provide user feedback

            // Directly fetch the group that was just joined to ensure data is available
            const { data: joinedGroup, error: fetchError } = await supabase
                .from('groups')
                .select('*')
                .eq('id', groupId)
                .single();

            setLoading(false);

            if (fetchError || !joinedGroup) {
                // If fetching the specific group fails, fall back to the full refresh.
                setNotification({ type: 'error', message: 'Could not load the group you just joined. Refreshing list.' });
                await fetchData();
            } else {
                // On success, immediately switch the view to the newly joined group.
                setViewingGroup(joinedGroup);
            }
        }
    };
    
    if (viewingGroup) {
        return <GroupView 
                    key={viewingGroup.id}
                    initialGroup={viewingGroup} 
                    session={session} 
                    onBack={() => setViewingGroup(null)}
                    onLeaveOrDelete={() => {
                        setViewingGroup(null);
                        fetchData();
                    }}
                />;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
            {notification && <Notification {...notification} onDismiss={() => setNotification(null)} />}
            <div className="max-w-7xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Vendor Dashboard</h2>
                <p className="text-gray-600 mb-8">Welcome, {profile.full_name}. Manage your groups or order supplies.</p>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white p-6 rounded-xl shadow-lg">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">My Groups</h3>
                             <div className="mb-6 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                                <button onClick={() => setShowCreateGroup(true)} className="btn-primary flex-1">Create New Group</button>
                                <button onClick={() => setShowJoinGroup(true)} className="btn-secondary flex-1">Join Existing Group</button>
                            </div>
                            {myGroups.length > 0 ? (
                                <ul className="space-y-3">
                                    {myGroups.map(group => (
                                        <li key={group.id} className="p-4 border rounded-lg flex justify-between items-center transition hover:shadow-md hover:border-indigo-500 cursor-pointer" onClick={() => setViewingGroup(group)}>
                                            <div>
                                                <p className="font-bold text-lg text-gray-900">{group.name}</p>
                                                <p className="text-sm text-gray-500">Pincode: {group.pincode}</p>
                                            </div>
                                            <span className="text-indigo-600 font-semibold">View Group &rarr;</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-gray-500 py-8">You haven't joined any groups yet.</p>
                            )}
                        </div>

                         <div className="bg-white p-6 rounded-xl shadow-lg">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Available Groups in Pincode: {profile.pincode}</h3>
                            {loading ? <Spinner /> : availableGroups.length > 0 ? (
                                <ul className="space-y-3">
                                    {availableGroups.map(group => (
                                        <li key={group.id} className="p-4 border rounded-lg flex justify-between items-center transition hover:shadow-md hover:border-indigo-500">
                                            <div>
                                                <p className="font-bold text-lg text-gray-900">{group.name}</p>
                                                <p className="text-sm text-gray-500">Join Code: <span className="font-mono bg-gray-100 p-1 rounded">{group.join_code}</span></p>
                                            </div>
                                            <button onClick={() => handleJoinGroup(group.id)} className="btn-primary-sm">Join</button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-gray-500 py-8">No other groups found in your area. Why not create one?</p>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                         <div className="bg-white p-6 rounded-xl shadow-lg sticky top-8">
                             <h3 className="text-xl font-bold text-gray-800 mb-4">Order Individually</h3>
                             <p className="text-gray-600 mb-4">
                                 Browse deals in your pincode and place orders for yourself, without a group.
                             </p>
                             <button className="btn-primary w-full opacity-50 cursor-not-allowed" disabled>
                                 Browse Deals in {profile.pincode} (Coming Soon)
                             </button>
                        </div>
                    </div>
                </div>
            </div>

            {showCreateGroup && <Modal onClose={() => setShowCreateGroup(false)}><CreateGroupForm onSubmit={handleCreateGroup} /></Modal>}
            {showJoinGroup && <Modal onClose={() => setShowJoinGroup(false)}><JoinGroupForm onSubmit={handleJoinGroup} pincode={profile.pincode} /></Modal>}
        </div>
    );
};

export default VendorDashboard;
