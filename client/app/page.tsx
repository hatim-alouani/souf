'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'AI-AUDIT | Welcome';
  }, []);

  const handleGetStarted = () => {
    setLoading(true);
    setTimeout(() => router.push('/signup'), 1500);
  };

  const handleSignIn = () => {
    setLoading(true);
    setTimeout(() => router.push('/login'), 1500);
  };

  return (
    <main className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-100 to-indigo-100 text-gray-800 font-sans">
      {/* App Title */}
      <div className="text-center mb-10 animate-fadeIn">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
          AI-AUDIT
        </h1>
        <p className="text-lg text-gray-600">
          Interactive AI Marketing Auditor
        </p>
      </div>

      {/* Auth Card */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl p-10 w-[90%] sm:w-[400px] flex flex-col items-center animate-fadeIn">
        <h2 className="text-2xl font-semibold mb-6">Welcome</h2>

        <button
          onClick={handleGetStarted}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl mb-4 transition-all"
        >
          {loading ? 'Loading...' : 'Get Started'}
        </button>

        <button
          onClick={handleSignIn}
          className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 rounded-xl transition-all"
        >
          {loading ? 'Loading...' : 'Sign In'}
        </button>

        <p className="text-sm text-gray-500 mt-6">
          © 2025 A2X CORP — All rights reserved
        </p>
      </div>
    </main>
  );
}
