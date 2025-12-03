'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Persona = 'executive' | 'manager' | 'business_owner' | '';

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [email2, setEmail2] = useState('');
  const [persona, setPersona] = useState<Persona>('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    document.title = 'AI-AUDIT | Sign Up';
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('');

    if (!fullName.trim()) return setStatus('Please enter your full name.');
    if (!email || !email2) return setStatus('Please enter your email twice.');
    if (email !== email2) return setStatus('Emails do not match.');
    if (!persona) return setStatus('Please select your role.');

    setSubmitting(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // match your backend register payload
        body: JSON.stringify({
          full_name: fullName,
          email,
          company_name: company || null,
          user_persona: persona,
        }),
      });

      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch (e) {}

      if (res.ok && data.ok) {
        setStatus('✅ Check your inbox to confirm your email and set your password.');
        // optionally route to a "check your email" screen after a moment
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setStatus(data.error || 'Registration failed. Please try again.');
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
      {/* Title */}
      <div className="text-center mb-10 animate-fadeIn">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 mb-2">
          AI-AUDIT
        </h1>
        <p className="text-lg text-gray-600">Interactive AI Marketing Auditor</p>
      </div>

      {/* Card */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl p-8 w-[90%] sm:w-[420px] animate-fadeIn">
        <h2 className="text-2xl font-semibold mb-6 text-center">Create your account</h2>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500"
            required
          />

          <input
            type="text"
            placeholder="Company name"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />

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

          <select
            value={persona}
            onChange={(e) => setPersona(e.target.value as Persona)}
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="">Select your role</option>
            <option value="executive">Executive</option>
            <option value="manager">Manager</option>
            <option value="business_owner">Business Owner</option>
          </select>

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
        © 2025 A2X CORP — All rights reserved
      </footer>
    </main>
  );
}
