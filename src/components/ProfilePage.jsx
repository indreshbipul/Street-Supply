// src/components/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Spinner, Notification } from './UI';

// A simple camera icon for the upload button
const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const ProfilePage = ({ profile, setProfile }) => {
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [notification, setNotification] = useState(null);
    const [formData, setFormData] = useState({
        full_name: '',
        business_name: '',
        pincode: '',
        avatar_url: null,
    });

    // Effect to synchronize the form data when the profile prop changes
    useEffect(() => {
        setFormData({
            full_name: profile.full_name || '',
            business_name: profile.business_name || '',
            pincode: profile.pincode || '',
            avatar_url: profile.avatar_url || null,
        });
    }, [profile]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    // Handles the avatar file selection and upload
    const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);

    // FIX 1: Gets the correct ID for the currently logged-in user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        setNotification({ type: 'error', message: 'You must be logged in to upload an avatar.' });
        setLoading(false);
        return;
    }

    // FIX 2: Builds a clean, valid file path
    const fileName = `${user.id}/${Date.now()}`;

    // FIX 3: Explicitly sets the file's content type
    const fileOptions = {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
    };

    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, fileOptions);

    if (uploadError) {
        // Includes detailed error logging
        console.error('Supabase upload error:', uploadError);
        setNotification({ type: 'error', message: `Upload failed: ${uploadError.message}` });
        setLoading(false);
        return;
    }

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

    // Update the profile table using the correct user ID
    const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)
        .select()
        .single();

    if (updateError) {
        setNotification({ type: 'error', message: `Update failed: ${updateError.message}` });
    } else {
        setProfile(data);
        setNotification({ type: 'success', message: 'Profile picture updated!' });
    }
    setLoading(false);
};

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);

        const updates = {
            full_name: formData.full_name,
            business_name: formData.business_name,
            pincode: formData.pincode,
        };
        
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', profile.id)
            .select()
            .single();
        
        if (error) {
            setNotification({ type: 'error', message: `Failed to update: ${error.message}` });
        } else {
            setProfile(data); // Update the profile in the main App state
            setNotification({ type: 'success', message: 'Profile updated successfully!' });
            setIsEditing(false);
        }
        setLoading(false);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setFormData({ // Revert changes by reloading from the main profile prop
            full_name: profile.full_name || '',
            business_name: profile.business_name || '',
            pincode: profile.pincode || '',
            avatar_url: profile.avatar_url || null,
        });
    };

    return (
        <div className="bg-gray-50 min-h-screen p-4 md:p-8">
            {notification && <Notification {...notification} onDismiss={() => setNotification(null)} />}
            
            <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Your Profile</h2>
                
                <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg">
                    <form onSubmit={handleUpdateProfile}>
                        {/* --- Profile Avatar Section --- */}
                        <div className="flex flex-col items-center md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-8 mb-8">
                            <div className="relative">
                                <img
                                    src={formData.avatar_url || `https://ui-avatars.com/api/?name=${formData.full_name || 'User'}&background=random`}
                                    alt="Profile Avatar"
                                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                                />
                                {isEditing && (
                                    <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                                        <CameraIcon />
                                        <input
                                            id="avatar-upload"
                                            type="file"
                                            className="hidden"
                                            accept="image/png, image/jpeg"
                                            onChange={handleAvatarUpload}
                                            disabled={loading}
                                        />
                                    </label>
                                )}
                            </div>
                            <div className="text-center md:text-left pt-4">
                                <h3 className="text-2xl font-bold text-gray-900">{profile.full_name || 'Your Name'}</h3>
                                <p className="text-gray-500">{profile.email}</p>
                            </div>
                        </div>

                        {/* --- Profile Fields Section --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fullName">Full Name</label>
                                <input id="fullName" name="full_name" type="text" value={formData.full_name} onChange={handleInputChange} className={`input-style ${!isEditing && 'bg-gray-100 cursor-not-allowed'}`} readOnly={!isEditing} required />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="businessName">Business/Stall Name</label>
                                <input id="businessName" name="business_name" type="text" value={formData.business_name} onChange={handleInputChange} className={`input-style ${!isEditing && 'bg-gray-100 cursor-not-allowed'}`} readOnly={!isEditing} required />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email</label>
                                <input id="email" type="email" value={profile.email} className="input-style bg-gray-100 cursor-not-allowed" readOnly />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pincode">Pincode</label>
                                <input id="pincode" name="pincode" type="text" value={formData.pincode} onChange={handleInputChange} className={`input-style ${!isEditing && 'bg-gray-100 cursor-not-allowed'}`} readOnly={!isEditing} required pattern="\d{6}" title="Pincode must be 6 digits." />
                            </div>
                        </div>
                        
                        {/* --- Action Buttons --- */}
                        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-4">
                            {isEditing ? (
                                <>
                                    <button type="button" onClick={handleCancelEdit} className="btn-secondary" disabled={loading}>Cancel</button>
                                    <button type="submit" className="btn-primary" disabled={loading}>{loading ? <Spinner/> : 'Save Changes'}</button>
                                </>
                            ) : (
                                <button type="button" onClick={() => setIsEditing(true)} className="btn-primary">Edit Profile</button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;