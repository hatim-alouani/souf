'use client';

import { useEffect } from 'react';
import useUser from "../components/useUser";
import { useRouter } from 'next/navigation';

export default function Profile() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    document.title = 'chatbot | Profile';
  }, []);

  if (loading)
    return (
      <main className="flex items-center justify-center h-screen text-gray-600">
        Loading profile...
      </main>
    );

  if (!user)
    return (
      <main className="flex items-center justify-center h-screen text-gray-600">
        You must log in first.
        <button onClick={() => router.push('/login')} className="ml-2 underline text-blue-600">
          Go to Login
        </button>
      </main>
    );

  const status = user.status?.toLowerCase() === 'active' ? 'Active' : user.status;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-100 via-indigo-100 to-gray-50 text-gray-800 font-sans flex flex-col">
      <section className="flex-1 flex items-center justify-center">
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-10 w-[90%] sm:w-[550px] text-center animate-fadeIn">
          <h2 className="text-3xl font-extrabold mb-2 text-gray-900">
            Welcome back, {user.full_name?.split(' ')[0]} 👋
          </h2>
          <p className="text-gray-600 mb-6">
            Here you can review your account details..
          </p>

          <div className="flex flex-col items-center gap-4">
            {user.report_url ? (
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}/reports/${user.report_url.split('/').pop()}`}
                download
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                Download Latest Report
              </a>
            ) : (
              <p className="text-gray-500">No report available yet.</p>
            )}
          </div>
        </div>
      </section>

      <footer className="text-center py-6 text-sm text-gray-500">
        © 2025 A2X CORP — All rights reserved
      </footer>
    </main>
  );
}
