'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('');
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error('Server returned non-JSON response:', text);
        throw new Error('Invalid server response');
      }

      if (!res.ok) {
        setStatus(`❌ ${data.error || 'Login failed.'}`);
      } else {
        // Save user in localStorage (no token)
        localStorage.setItem('user', JSON.stringify(data.user));
        // After login request succeeds
        localStorage.setItem('userId', data.user.id.toString());

        setStatus('✅ Login successful! Redirecting...');
        setTimeout(() => router.push('/dashboard'), 1500);
      }
    } catch (err) {
      console.error('Network error:', err);
      setStatus('❌ Network error. Check connection or server URL.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-zinc-900 text-zinc-100 p-4">
      
      {/* Login Card - Darkened background, strong shadow, and green ring hover */}
      <div className="bg-zinc-800 p-8 rounded-2xl shadow-2xl shadow-black/70 w-full max-w-sm sm:w-[400px] transition-all duration-300 hover:shadow-green-900/50 border border-zinc-700">
        
        <div className="flex flex-col items-center mb-6">
            <Image
                    src='/logo.png'
                    alt=''
                    width={200}
                    height={150}
                    className="p-4"
                  />
            {/* <h2 className="text-3xl font-extrabold tracking-tight text-white">
                Welcome Back
            </h2> */}
            <p className="text-sm text-zinc-400 mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Input fields adjusted for dark theme */}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            // Dark input styling
            className="w-full border border-zinc-700 bg-zinc-900 text-zinc-100 p-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 placeholder-zinc-500"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            // Dark input styling
            className="w-full border border-zinc-700 bg-zinc-900 text-zinc-100 p-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 placeholder-zinc-500"
          />

          {/* Submit Button - Green accent color */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all transform hover:scale-[1.01] shadow-lg ${
              loading
                ? 'bg-green-700/50 cursor-not-allowed shadow-none'
                : 'bg-green-600 hover:bg-green-700 shadow-green-900/50'
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Status Message */}
        {status && (
          <div className={`mt-6 p-3 rounded-lg flex items-center gap-2 ${
            // Status colors adjusted for dark background
            status.startsWith('✅') 
              ? 'bg-green-900/50 text-green-300 border border-green-700' 
              : 'bg-red-900/50 text-red-300 border border-red-700'
          }`}>
            {status.startsWith('✅') ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <p className="text-sm font-medium">
              {status}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
