'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [email2, setEmail2] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    document.title = 'Sign Up';
  }, []);

async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setStatus('');

  if (!email || !email2) return setStatus('Please enter your email twice.');
  if (email !== email2) return setStatus('Emails do not match.');
  if (!password || !password2) return setStatus('Enter your password twice.');
  if (password !== password2) return setStatus('Passwords do not match.');

  setSubmitting(true);

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data: { error?: string } = await res.json();

    if (res.ok) {
      setStatus('✅ Account created successfully! Redirecting…');
      setTimeout(() => router.push('/login'), 1500);
    } else {
      setStatus(data.error || 'Signup failed. Try again.');
    }
  } catch (err) {
    console.error(err);
    setStatus('Network error. Please try again.');
  } finally {
    setSubmitting(false);
  }
}



  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-indigo-100 text-gray-800 font-sans">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 mb-2">
          Create Account
        </h1>
        <p className="text-lg text-gray-600">Join us today</p>
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl p-8 w-[90%] sm:w-[420px]">
        <h2 className="text-2xl font-semibold mb-6 text-center">Sign Up</h2>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500"
            required
          />

          <input
            type="email"
            placeholder="Confirm email address"
            value={email2}
            onChange={(e) => setEmail2(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500"
            required
          />

          <input
            type="password"
            placeholder="Confirm password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500"
            required
          />

          <button
            type="submit"
            disabled={submitting}
            className={`w-full text-white py-3 rounded-lg transition-all ${
              submitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {submitting ? 'Submitting…' : 'Create Account'}
          </button>

          {status && (
            <p
              className={`text-sm text-center ${
                status.startsWith('✅') ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {status}
            </p>
          )}
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/login')}
            className="text-blue-600 hover:underline"
          >
            Already have an account? Sign in
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-6 text-center">
          By continuing you agree to our Terms and Privacy Policy.
        </p>
      </div>

      <footer className="text-center py-6 text-sm text-gray-500">
        © 2025 — All rights reserved
      </footer>
    </main>
  );
}
