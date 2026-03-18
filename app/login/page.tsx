'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatusText('Checking configuration...');

    // Check if Supabase URL is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co' || supabaseUrl.includes('placeholder')) {
      setError('Supabase credentials are not configured. If you are in AI Studio, set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in the Secrets panel (gear icon top right). If you are in Vercel, set these in your Project Settings > Environment Variables.');
      setLoading(false);
      setStatusText('');
      return;
    }

    try {
      setStatusText('Authenticating with Supabase...');
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      setStatusText('Checking admin privileges...');
      // Use a more resilient fetch
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
      }

      const isAdmin = profile?.role === 'admin';
      const isOwner = data.user.email === 'sajol.professional@gmail.com' || data.user.email === 'sadikulislamsajol@gmail.com';

      if (isAdmin || isOwner) {
        // If the owner doesn't have an admin profile yet, try to create one but don't let it block login
        if (isOwner && !isAdmin) {
          setStatusText('Syncing admin profile...');
          try {
            // Use a timeout for the upsert to prevent hanging
            const upsertPromise = supabase.from('profiles').upsert({
              id: data.user.id,
              role: 'admin',
              name: data.user.email,
              phone: ''
            });
            
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 3000)
            );

            await Promise.race([upsertPromise, timeoutPromise]).catch(err => {
              console.warn('Profile sync timed out or failed, proceeding anyway:', err);
            });
          } catch (upsertError) {
            console.error('Failed to upsert owner profile:', upsertError);
          }
        }
        
        setStatusText('Verifying session...');
        const { data: sessionData } = await supabase.auth.getSession();
        
        setStatusText('Redirecting to dashboard...');
        if (sessionData.session) {
          window.location.replace('/admin');
        } else {
          // Final attempt at redirecting
          window.location.href = '/admin';
        }
      } else {
        await supabase.auth.signOut();
        setError('Unauthorized: Admin access required.');
        setStatusText('');
      }
    } catch (err: any) {
      let errorMessage = err.message || 'An error occurred during login.';
      if (errorMessage === 'Failed to fetch') {
        errorMessage = 'Failed to connect to the database. Please ensure your Supabase URL and Anon Key are correctly configured in the AI Studio Secrets panel.';
      }
      setError(errorMessage);
      setStatusText('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md border border-line p-8 bg-bg shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-mono font-bold tracking-tighter mb-2">NEEDIE_ADMIN</h1>
          <p className="col-header">System Authentication</p>
        </div>

        {error && (
          <div className="mb-6 p-3 border border-red-500 bg-red-50 text-red-900 text-sm font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="col-header block" htmlFor="email">
              Operator ID (Email)
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-line bg-transparent p-3 font-mono focus:outline-none focus:ring-2 focus:ring-ink"
              required
              placeholder="admin@needieshop.com"
            />
          </div>

          <div className="space-y-2">
            <label className="col-header block" htmlFor="password">
              Access Code (Password)
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-line bg-transparent p-3 font-mono focus:outline-none focus:ring-2 focus:ring-ink"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-bg p-4 font-mono font-bold uppercase tracking-widest hover:bg-opacity-90 transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : null}
            {loading ? (statusText || 'Authenticating...') : 'Initialize Session'}
          </button>
        </form>
      </div>
    </div>
  );
}
