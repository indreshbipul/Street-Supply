import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import AuthComponent from './components/auth';
import ProfileSetup from './components/ProfileSetup';
import VendorDashboard from './components/VenderDashboard';
import SupplierDashboard from './components/SupplierDashboard';
import ProfilePage from './components/ProfilePage';
import { Spinner } from './components/UI';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session && !profile) {
      setLoading(true);
      supabase
        .from('profiles').select('*').eq('id', session.user.id).single()
        .then(({ data, error }) => {
          if (data) setProfile(data);
          setLoading(false);
        });
    } else if (!session) {
      setProfile(null);
    }
  }, [session]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setView('dashboard');
  };

  const renderContent = () => {
    if (loading) return <div className="min-h-screen flex justify-center items-center"><Spinner /></div>;
    if (!session) return <AuthComponent setSession={setSession} />;
    if (!profile) return <ProfileSetup session={session} setProfile={setProfile} />;
    
    if (view === 'profile') {
        return <ProfilePage profile={profile} setProfile={setProfile} setView={setView} />;
    }

    if (profile.role === 'vendor') return <VendorDashboard profile={profile} setProfile={setProfile} session={session} />;
    if (profile.role === 'supplier') return <SupplierDashboard profile={profile} session={session} />;
    return <p>Invalid user role.</p>;
  };

  return (
    <>
      <style>{/* ... Your styles here ... */}</style>
      <div className="min-h-screen bg-gray-50 font-sans">
        {session && profile && (
          <header className="bg-white shadow-sm mb-12">
            <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
              <button onClick={() => setView('dashboard')} className="text-2xl font-bold text-indigo-600">StreetSupply</button>
              <div className="flex items-center gap-4">
                <span className="text-gray-700 hidden sm:block">
                  Welcome, <span className="font-semibold">{profile.full_name}</span>!
                </span>
                <button onClick={() => setView('profile')} className="btn-secondary-sm">Profile</button>
                <button onClick={handleSignOut} className="btn-secondary-sm">Sign Out</button>
              </div>
            </nav>
          </header>
        )}
        <main className="container mx-auto">
          {renderContent()}
        </main>
      </div>
    </>
  );
}