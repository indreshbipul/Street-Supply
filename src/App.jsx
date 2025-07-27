import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import AuthComponent from './components/auth'; // Assuming component path
import ProfileSetup from './components/ProfileSetup'; // Assuming component path
import VendorDashboard from './components/VenderDashboard'; // Corrected typo from Vender to Vendor
import SupplierDashboard from './components/SupplierDashboard'; // Assuming component path
import ProfilePage from './components/ProfilePage';
import { Spinner } from './components/UI'; // Assuming component path
import HelpCenter from './components/HelpCenter'; // --- IMPORT THE NEW COMPONENT ---

export default function App() {
  // State for user session, profile data, loading status, and current view
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard'); // 'dashboard' or 'profile'

  // Effect to handle user authentication state changes
 useEffect(() => {
  const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setLoading(false); // Set loading here always
  };
  getSession();

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
  });

  return () => subscription.unsubscribe();
}, []);

  // Effect to fetch user profile when a session is available
  useEffect(() => {
    if (session && !profile) {
      setLoading(true);
      supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
        .then(({ data, error }) => {
          if (data) {
            setProfile(data);
          }
          // If there's an error, it might mean no profile exists, which is fine
          // The ProfileSetup component will handle creation
          setLoading(false);
        });
    } else if (!session) {
      // If session is lost, clear the profile
      setProfile(null);
    }
  }, [session, profile]); // Rerun when session changes

  // Function to handle user sign-out
  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setView('dashboard'); // Reset view on sign out
    setLoading(false);
  };

  // Renders the main content based on the application's state
  const renderContent = () => {
    if (loading) {
      return <div className="min-h-screen flex justify-center items-center"><Spinner /></div>;
    }
    if (!session) {
      return <AuthComponent setSession={setSession} />;
    }
    // If user is logged in but has no profile, prompt them to create one
    if (!profile) {
      return <ProfileSetup session={session} setProfile={setProfile} />;
    }
    
    // If the view is set to 'profile', show the profile page
    if (view === 'profile') {
      // Pass the onClose prop to allow the component to signal it should be closed
      return <ProfilePage profile={profile} setProfile={setProfile} onClose={() => setView('dashboard')} />;
    }

    // Default to the appropriate dashboard based on user role
    if (profile.role === 'vendor') {
      return <VendorDashboard profile={profile} setProfile={setProfile} session={session} />;
    }
    if (profile.role === 'supplier') {
      return <SupplierDashboard profile={profile} session={session} />;
    }

    // Fallback for users with an invalid or missing role
    return (
        <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-red-600">Error: Invalid User Role</h2>
            <p className="text-gray-600 mt-2">Your user profile does not have a valid role assigned. Please contact support.</p>
            <button onClick={handleSignOut} className="btn-primary mt-4">Sign Out</button>
        </div>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 font-sans">
        {session && profile && (
          <header className="bg-white shadow-sm mb-8 md:mb-12">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
              <button onClick={() => setView('dashboard')} className="text-2xl font-bold text-indigo-600 hover:text-indigo-700 transition">
                StreetSupply
              </button>
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="text-gray-700 hidden sm:block">
                  Welcome, <span className="font-semibold">{profile.full_name || profile.email}</span>!
                </span>
                <button onClick={() => setView('profile')} className="btn-secondary-sm">Profile</button>
                <button onClick={handleSignOut} className="btn-secondary-sm">Sign Out</button>
              </div>
            </nav>
          </header>
        )}
        <main className="container mx-auto px-4 sm:px-6 lg:px-8">
          {renderContent()}
        </main>
        
        {/* --- ADD THE HELP CENTER COMPONENT HERE --- */}
        {session && profile && (
          <HelpCenter session={session} profile={profile} />
        )}
      </div>
    </>
  );
}
