import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { Spinner, Modal, Notification } from './UI';
import GroupView from './GroupView';
import IndividualOrderView from './IndividualOrderView';

// --- Icon Placeholders ---
const UserGroupIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962a3.75 3.75 0 015.25 0m4.518 3.026A5.25 5.25 0 0118.75 15.75c-2.92 0-5.462 2.023-5.962 4.725A9.094 9.094 0 0018 18.72zM12 12.75a3.75 3.75 0 110-7.5 3.75 3.75 0 010 7.5zM3.75 15.75a5.25 5.25 0 0010.5 0v-1.141a5.25 5.25 0 00-10.5 0v1.141z" /></svg>;
const PlusCircleIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ArrowRightOnRectangleIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>;
const ChevronRightIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>;
const ClipboardIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v3.042m-7.332 0c-.055.194-.084.4-.084.612v3.042m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5v-2.25c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>;
const CheckIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
const SparklesIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM18 13.5a3.375 3.375 0 00-3.375-3.375h-.037a3.375 3.375 0 00-3.375 3.375v.037a3.375 3.375 0 003.375 3.375h.037a3.375 3.375 0 003.375-3.375v-.037z" /></svg>;
const ExclamationTriangleIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /></svg>;

// --- Form Components ---
const CreateGroupForm = ({ onSubmit }) => {
    const [name, setName] = useState('');
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(name); }}>
            <div className="flex items-center mb-4">
                <PlusCircleIcon className="h-8 w-8 text-indigo-500 mr-3" />
                <h3 className="text-xl font-bold text-slate-800">Create a New Group</h3>
            </div>
            <label htmlFor="group-name" className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
            <input
                id="group-name" type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g., 'Kharagpur Chaat Circle'"
                className="input-style w-full mb-4 focus:ring-indigo-500 focus:border-indigo-500" required
            />
            <button type="submit" className="btn-primary w-full flex justify-center items-center">
                <PlusCircleIcon className="h-5 w-5 mr-2" />
                Create Group
            </button>
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
            <div className="flex items-center mb-4">
                <ArrowRightOnRectangleIcon className="h-8 w-8 text-indigo-500 mr-3" />
                <h3 className="text-xl font-bold text-slate-800">Join with Code</h3>
            </div>
            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-3 mb-4 rounded-r-lg">
                    <div className="flex">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                </div>
            )}
            <label htmlFor="join-code" className="block text-sm font-medium text-gray-700 mb-1">Join Code for Pincode {pincode}</label>
            <input
                id="join-code" type="text" value={joinCode} onChange={e => setJoinCode(e.target.value)}
                placeholder="ENTER 6-CHARACTER CODE"
                className="input-style w-full mb-4 uppercase font-mono tracking-widest text-center focus:ring-indigo-500 focus:border-indigo-500" required
            />
            <button type="submit" className="btn-primary w-full">Find & Join Group</button>
        </form>
    );
};

// --- Available Group Item Component ---
const AvailableGroupItem = ({ group, onJoin }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(group.join_code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <li className="p-4 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 transition-shadow hover:shadow-md">
            <div>
                <p className="font-semibold text-lg text-slate-900">{group.name}</p>
                <div className="text-sm text-slate-500 flex items-center mt-1">
                    <span>Join Code:</span>
                    <button onClick={handleCopy} className="ml-2 font-mono bg-slate-100 p-1 rounded-md text-slate-700 flex items-center gap-2 hover:bg-slate-200 transition-colors">
                        {group.join_code}
                        {copied ? <CheckIcon className="h-4 w-4 text-green-500" /> : <ClipboardIcon className="h-4 w-4 text-slate-500" />}
                    </button>
                </div>
            </div>
            <button onClick={() => onJoin(group.id)} className="btn-primary-sm w-full sm:w-auto">
                Join Group
            </button>
        </li>
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
    const [showIndividualOrderView, setShowIndividualOrderView] = useState(false);

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

        if (availableError) setNotification({ type: 'error', message: 'Could not load available groups.' });
        else setAvailableGroups(availableData || []);
        
        setLoading(false);
    }, [session.user.id, profile.pincode]);

    useEffect(() => {
        if (profile && session) {
           fetchData();
        }
    }, [fetchData, profile, session]);

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
            await fetchData();
        }
    };
    
    // --- Conditional Rendering for Different Views ---

    if (showIndividualOrderView) {
        return <IndividualOrderView 
            profile={profile} 
            onBack={() => setShowIndividualOrderView(false)} 
        />;
    }
    
    if (viewingGroup) {
        return <GroupView 
            key={viewingGroup.id} initialGroup={viewingGroup} session={session} 
            onBack={() => setViewingGroup(null)}
            onLeaveOrDelete={() => {
                setViewingGroup(null);
                fetchData();
            }}
        />;
    }

    // --- Main Dashboard View ---
    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <div className="p-4 sm:p-6 md:p-8">
                {notification && <Notification {...notification} onDismiss={() => setNotification(null)} />}
                <div className="max-w-7xl mx-auto">
                    {/* --- Page Header --- */}
                    <div className="mb-8 md:mb-12">
                        <h2 className="text-4xl font-bold text-slate-800 tracking-tight">Group Dashboard</h2>
                        <p className="text-slate-600 mt-1 text-lg">Welcome back, {profile.full_name}.</p>
                    </div>

                    {/* --- Main Grid Layout --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                        {/* --- Left Column (Main Content) --- */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* --- My Groups Card --- */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-2xl font-bold text-slate-800 flex items-center">
                                        <UserGroupIcon className="h-7 w-7 mr-3 text-indigo-500" />
                                        My Groups
                                    </h3>
                                    <div className="hidden sm:flex space-x-3">
                                        <button onClick={() => setShowJoinGroup(true)} className="btn-secondary">Join Group</button>
                                        <button onClick={() => setShowCreateGroup(true)} className="btn-primary">Create Group</button>
                                    </div>
                                </div>

                                <div className="sm:hidden grid grid-cols-2 gap-3 mb-6">
                                    <button onClick={() => setShowCreateGroup(true)} className="btn-primary w-full">Create</button>
                                    <button onClick={() => setShowJoinGroup(true)} className="btn-secondary w-full">Join</button>
                                </div>

                                {!loading && myGroups.length > 0 ? (
                                    <ul className="space-y-3">
                                        {myGroups.map(group => (
                                            <li key={group.id} className="group p-4 rounded-xl flex justify-between items-center transition-all duration-200 ease-in-out hover:bg-slate-100 hover:shadow-md cursor-pointer border border-transparent hover:border-indigo-300" onClick={() => setViewingGroup(group)}>
                                                <div className="flex items-center">
                                                    <div className="p-3 bg-indigo-100 rounded-lg mr-4"><UserGroupIcon className="h-6 w-6 text-indigo-600"/></div>
                                                    <div>
                                                        <p className="font-semibold text-lg text-slate-900">{group.name}</p>
                                                        <p className="text-sm text-slate-500">Pincode: {group.pincode}</p>
                                                    </div>
                                                </div>
                                                <ChevronRightIcon className="h-6 w-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                            </li>
                                        ))}
                                    </ul>
                                ) : !loading && (
                                    <div className="text-center py-10 px-6 bg-slate-50 rounded-lg">
                                        <UserGroupIcon className="mx-auto h-12 w-12 text-slate-400" />
                                        <h3 className="mt-2 text-lg font-medium text-slate-800">No groups yet</h3>
                                        <p className="mt-1 text-sm text-slate-500">Create a new group to start collaborating or join one.</p>
                                    </div>
                                )}
                                {loading && <div className="flex justify-center p-8"><Spinner /></div>}
                            </div>

                            {/* --- Available Groups Card --- */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <h3 className="text-2xl font-bold text-slate-800 mb-4">Available in {profile.pincode}</h3>
                                {loading ? <div className="flex justify-center p-8"><Spinner /></div> : availableGroups.length > 0 ? (
                                    <ul className="space-y-3">
                                        {availableGroups.map(group => <AvailableGroupItem key={group.id} group={group} onJoin={handleJoinGroup} />)}
                                    </ul>
                                ) : (
                                    <div className="text-center py-10 px-6 bg-slate-50 rounded-lg">
                                        <SparklesIcon className="mx-auto h-12 w-12 text-slate-400" />
                                        <h3 className="mt-2 text-lg font-medium text-slate-800">All clear!</h3>
                                        <p className="mt-1 text-sm text-slate-500">No other groups found in your area. Be the first to create one!</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* --- Right Column (Side Panel) --- */}
                        <div className="lg:col-span-1">
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-lg sticky top-8">
                                <SparklesIcon className="h-8 w-8 text-white opacity-80 mb-3" />
                                <h3 className="text-xl font-bold text-white mb-2">Order Individually</h3>
                                <p className="text-indigo-100 mb-6 text-opacity-90">Don't need a group? Browse deals and place orders just for yourself.</p>
                                <button 
                                    onClick={() => setShowIndividualOrderView(true)}
                                    className="bg-white text-indigo-600 font-bold py-2 px-4 rounded-lg w-full shadow hover:bg-indigo-50 transition-colors duration-200"
                                >
                                    Browse Deals in {profile.pincode}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Modals --- */}
                {showCreateGroup && <Modal onClose={() => setShowCreateGroup(false)}><CreateGroupForm onSubmit={handleCreateGroup} /></Modal>}
                {showJoinGroup && <Modal onClose={() => setShowJoinGroup(false)}><JoinGroupForm onSubmit={handleJoinGroup} pincode={profile.pincode} /></Modal>}
            </div>
        </div>
    );
};

export default VendorDashboard;