'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { createBrowserClient } from '@supabase/ssr';
import Navbar from '@/components/Navbar';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
        })
        .eq('id', user?.id);

      if (error) throw error;
      await refreshUser();
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setEditing(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Navbar />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-3 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              My Profile
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Manage your account information and preferences
            </p>
          </div>

          {/* Main Profile Card */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Header with Gradient */}
            <div className="relative bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-10">
              <div className="flex items-center gap-8">
                <div className="relative">
                  <div className="w-32 h-32 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 text-5xl font-black shadow-2xl ring-4 ring-white/50">
                    {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="absolute bottom-0 right-0 w-10 h-10 bg-green-500 rounded-full border-4 border-white dark:border-gray-800"></div>
                </div>
                <div className="text-white">
                  <h2 className="text-4xl font-black mb-2">
                    {user?.full_name || 'User'}
                  </h2>
                  <p className="text-xl text-white/90 mb-3">{user?.email}</p>
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold shadow-lg ${
                    user?.role === 'admin' ? 'bg-blue-500 text-white' :
                    user?.role === 'staff' ? 'bg-green-500 text-white' :
                    'bg-yellow-500 text-gray-900'
                  }`}>
                    {user?.role?.toUpperCase() || 'CUSTOMER'}
                  </span>
                </div>
              </div>
            </div>

            {/* Message Alert */}
            {message.text && (
              <div className={`mx-8 mt-6 p-5 rounded-xl font-semibold ${
                message.type === 'success' 
                  ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500 text-green-700 dark:text-green-400'
                  : 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500 text-red-700 dark:text-red-400'
              }`}>
                {message.text}
              </div>
            )}

            {/* Profile Form */}
            <div className="p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Full Name */}
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Full Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-5 py-4 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-orange-500/50 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all font-medium"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <div className="px-5 py-4 text-lg bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white font-semibold">
                      {user?.full_name || 'Not set'}
                    </div>
                  )}
                </div>

                {/* Email (Read-only) */}
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Email Address
                  </label>
                  <div className="px-5 py-4 text-lg bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white font-semibold border-2 border-transparent">
                    {user?.email}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    🔒 Email cannot be changed
                  </p>
                </div>

                {/* Phone */}
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Phone Number
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-5 py-4 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-orange-500/50 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all font-medium"
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <div className="px-5 py-4 text-lg bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white font-semibold">
                      {user?.phone || 'Not set'}
                    </div>
                  )}
                </div>

                {/* Role (Read-only) */}
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Account Role
                  </label>
                  <div className={`px-5 py-4 text-lg rounded-xl font-bold border-2 ${
                    user?.role === 'admin' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-500' :
                    user?.role === 'staff' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-500' :
                    'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-500'
                  }`}>
                    {user?.role?.toUpperCase() || 'CUSTOMER'}
                  </div>
                </div>

                {/* Member Since */}
                <div className="space-y-3 md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Member Since
                  </label>
                  <div className="px-5 py-4 text-lg bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-xl text-gray-900 dark:text-white font-bold border-2 border-orange-300 dark:border-orange-700">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Recently'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-10">
                {editing ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-xl hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 font-bold text-lg shadow-xl hover:shadow-2xl disabled:cursor-not-allowed"
                    >
                      {loading ? '💾 Saving...' : '✅ Save Changes'}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setFormData({
                          full_name: user?.full_name || '',
                          phone: user?.phone || '',
                        });
                        setMessage({ type: '', text: '' });
                      }}
                      disabled={loading}
                      className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-bold text-lg shadow-lg"
                    >
                      ❌ Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all font-bold text-lg shadow-xl hover:shadow-2xl"
                  >
                    ✏️ Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-10 border border-gray-200 dark:border-gray-700">
            <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-6">
              🔒 Security Settings
            </h3>
            <button className="w-full text-left px-8 py-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-orange-500 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg text-gray-900 dark:text-white">Change Password</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Update your account password</p>
                </div>
                <svg className="w-6 h-6 text-gray-400 group-hover:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}