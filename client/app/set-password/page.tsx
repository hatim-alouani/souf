'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Loading from '../components/Loading';

export default function SetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirm) {
      setStatus('❌ Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setStatus('❌ Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    setStatus('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error('Server returned non-JSON response:', text);
        throw new Error('Invalid server response');
      }

      if (res.ok && data.ok) {
        setStatus('');
        setRedirecting(true);
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setStatus(`❌ ${data.error || 'Server error. Please try again.'}`);
      }
    } catch (err) {
      console.error('Network error:', err);
      setStatus('❌ Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (redirecting) return <Loading />;

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100 text-gray-800">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-[90%] sm:w-[400px]">
        <h2 className="text-2xl font-bold mb-4 text-center">Set Your Password</h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          Please set a new password to activate your AI-AUDIT account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="New password (min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white py-3 rounded-lg transition-all ${
              loading
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {loading ? 'Saving...' : 'Confirm & Continue'}
          </button>
        </form>

        {status && (
          <p
            className={`mt-4 text-center text-sm font-medium ${
              status.startsWith('✅') ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {status}
          </p>
        )}
      </div>
    </main>
  );
}
