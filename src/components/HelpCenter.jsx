import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

// --- ICONS ---
const IconHelp = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
const IconClose = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const IconSend = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>;

const HelpCenter = ({ session, profile }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [pincode, setPincode] = useState('');
    const [activeConversation, setActiveConversation] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasUnread, setHasUnread] = useState(false); // State for notification alert
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchConversations = useCallback(async () => {
        if (!profile) return;
        setLoading(true);
        
        let query;
        if (profile.role === 'vendor') {
            query = supabase.from('conversations').select('*, supplier:supplier_id(business_name), vendor:vendor_id(full_name)').eq('vendor_id', profile.id);
        } else { // supplier
            query = supabase.from('conversations').select('*, supplier:supplier_id(business_name), vendor:vendor_id(full_name)').eq('supplier_id', profile.id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) {
            console.error("Error fetching conversations:", error);
        } else {
            setConversations(data);
        }
        setLoading(false);
    }, [profile]);

    useEffect(() => {
        if (isOpen && !activeConversation) {
            fetchConversations();
        }
    }, [isOpen, activeConversation, fetchConversations]);

    // --- EFFECT FOR NEW CONVERSATION NOTIFICATIONS (for suppliers) ---
    useEffect(() => {
        if (profile.role !== 'supplier') return;

        const conversationSubscription = supabase
            .channel('public:conversations')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversations', filter: `supplier_id=eq.${profile.id}` },
                (payload) => {
                    if (!isOpen) {
                        setHasUnread(true);
                    }
                    fetchConversations(); // Refresh the conversation list
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(conversationSubscription);
        };
    }, [profile.id, profile.role, isOpen, fetchConversations]);

    // --- EFFECT FOR NEW MESSAGE NOTIFICATIONS ---
    useEffect(() => {
        if (!activeConversation) return;

        const fetchMessages = async () => {
            if (!activeConversation) return;
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', activeConversation.id)
                .order('created_at', { ascending: true });
            
            if (!error) setMessages(data || []);
        };
        fetchMessages();

        const pollInterval = setInterval(fetchMessages, 5000);

        const messageSubscription = supabase
            .channel(`messages:${activeConversation.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConversation.id}` },
                (payload) => {
                    // Show notification if chat is closed and message is from other user
                    if (!isOpen && payload.new.sender_id !== profile.id) {
                        setHasUnread(true);
                    }
                    setMessages(currentMessages =>
                        currentMessages.some(m => m.id === payload.new.id)
                        ? currentMessages
                        : [...currentMessages, payload.new]
                    );
                }
            )
            .subscribe();

        return () => {
            clearInterval(pollInterval);
            supabase.removeChannel(messageSubscription);
        };
    }, [activeConversation, isOpen, profile.id]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !activeConversation) return;

        const { error } = await supabase.from('messages').insert({
            content: newMessage,
            sender_id: profile.id,
            conversation_id: activeConversation.id,
        });

        if (error) console.error("Error sending message:", error);
        else setNewMessage('');
    };
    
    const handleStartConversation = async (e) => {
        e.preventDefault();
        if (pincode.trim() === '') return;
        setLoading(true);

        const { data: suppliers, error: supplierError } = await supabase
            .from('deals')
            .select('supplier_id, profiles:supplier_id(business_name)')
            .contains('target_pincodes', [pincode]);
        
        if(supplierError || !suppliers || suppliers.length === 0) {
            alert('No suppliers found for this pincode.');
            setLoading(false);
            return;
        }

        const uniqueSuppliers = [...new Map(suppliers.map(item => [item.supplier_id, item])).values()];
        const targetSupplier = uniqueSuppliers[0];

        const { data: existingConvo } = await supabase
            .from('conversations')
            .select('*, supplier:supplier_id(business_name), vendor:vendor_id(full_name)')
            .eq('vendor_id', profile.id)
            .eq('supplier_id', targetSupplier.supplier_id)
            .single();

        if (existingConvo) {
            setActiveConversation(existingConvo);
        } else {
            const { data: newConvo, error: newConvoError } = await supabase
                .from('conversations')
                .insert({ vendor_id: profile.id, supplier_id: targetSupplier.supplier_id })
                .select('*, supplier:supplier_id(business_name), vendor:vendor_id(full_name)')
                .single();
            
            if (newConvoError) {
                console.error("Error creating conversation:", newConvoError);
            } else {
                setActiveConversation(newConvo);
                setConversations(prev => [newConvo, ...prev]);
            }
        }
        setLoading(false);
    };

    const renderVendorView = () => (
        <>
            {!activeConversation ? (
                <div className="p-4 h-full flex flex-col">
                    <h3 className="font-bold text-lg mb-2">Find a Supplier</h3>
                    <p className="text-sm text-gray-600 mb-4">Enter a pincode to find suppliers and start a conversation.</p>
                    <form onSubmit={handleStartConversation} className="flex gap-2">
                        <input
                            type="text"
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value)}
                            placeholder="Enter Pincode..."
                            className="input-style flex-grow"
                            disabled={loading}
                        />
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Searching...' : 'Find'}
                        </button>
                    </form>
                    <hr className="my-4"/>
                    <h3 className="font-bold text-lg mb-2">Your Conversations</h3>
                    <div className="flex-grow overflow-y-auto space-y-2">
                        {conversations.map(convo => (
                            <button key={convo.id} onClick={() => setActiveConversation(convo)} className="w-full text-left p-2 rounded-md hover:bg-gray-100">
                                <p className="font-semibold">{convo.supplier.business_name}</p>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                renderChatView()
            )}
        </>
    );

    const renderSupplierView = () => (
        <>
            {!activeConversation ? (
                <div className="p-4 h-full flex flex-col">
                    <h3 className="font-bold text-lg mb-2">Your Conversations</h3>
                    {loading && <p>Loading...</p>}
                    <div className="flex-grow overflow-y-auto space-y-2">
                        {conversations.map(convo => (
                            <button key={convo.id} onClick={() => setActiveConversation(convo)} className="w-full text-left p-2 rounded-md hover:bg-gray-100">
                                <p className="font-semibold">{convo.vendor.full_name}</p>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                renderChatView()
            )}
        </>
    );

    const renderChatView = () => (
        <div className="flex flex-col h-full">
            <header className="p-4 border-b flex items-center gap-4 flex-shrink-0">
                <button onClick={() => setActiveConversation(null)} className="text-gray-500 hover:text-gray-800">&larr;</button>
                <h3 className="font-bold text-lg">
                    {profile.role === 'vendor' ? activeConversation.supplier.business_name : activeConversation.vendor.full_name}
                </h3>
            </header>
            <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
                <div className="space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender_id === profile.id ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl ${msg.sender_id === profile.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                <p>{msg.content}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t flex items-center gap-2 flex-shrink-0">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="input-style flex-grow"
                />
                <button type="submit" className="btn-primary p-2 rounded-full">
                    <IconSend />
                </button>
            </form>
        </div>
    );

    return (
        <div className="fixed bottom-4 left-4 z-50">
            {isOpen && (
                <div className="bg-white w-80 h-96 rounded-lg shadow-2xl flex flex-col overflow-hidden">
                    {profile.role === 'vendor' ? renderVendorView() : renderSupplierView()}
                </div>
            )}
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) { // If we are opening the chat
                        setHasUnread(false); // Reset the notification
                    }
                }}
                className="bg-indigo-600 text-white rounded-full p-4 shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-transform transform hover:scale-110 relative"
                aria-label={isOpen ? "Close help center" : "Open help center"}
            >
                {isOpen ? <IconClose /> : <IconHelp />}
                {/* --- UNREAD NOTIFICATION DOT --- */}
                {hasUnread && !isOpen && (
                    <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-white animate-pulse"></span>
                )}
            </button>
        </div>
    );
};

export default HelpCenter;
