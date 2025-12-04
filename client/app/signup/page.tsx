'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Zap, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import Image from 'next/image';
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

  function routerPush(arg0: string) {
    throw new Error('Function not implemented.');
  }

return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f0f] text-white font-sans p-4">
      
      {/* Title */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-10"
      >
        {/* REPLACE THIS SOURCE WITH YOUR OWN VIDEO FILE */}
        <source src="/videoOCP.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="fixed inset-0 bg-black opacity-95 z-20"></div>
      <div className="flex flex-col justify-center items-center text-center gap-2 mb-10 z-30 pt-6">
        <Image
                    src='/logo.png'
                    alt='Logo'
                    width={250}
                    height={250}
                    className="object-contain cursor-pointer"
                    onClick={() => routerPush('/')}
                  />
        <p className="text-lg text-zinc-400">Interactive AI for OCP community</p>
      </div>

      {/* Card */}
      <div className="bg-zinc-900/90 backdrop-blur-md rounded-xl shadow-2xl shadow-black/70 border border-zinc-800 p-8 w-full max-w-md z-40">
        <h2 className="text-2xl font-semibold mb-6 text-center text-green-500">Create Your Account</h2>

        <form onSubmit={onSubmit} className="space-y-4">
          
          {/* Full Name Input */}
          <div className="relative">
            <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Full name"
              // value={fullName}
              // onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-zinc-800/50 border border-zinc-700 text-white p-3 pl-10 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all placeholder:text-zinc-500"
              required
            />
          </div>

          {/* Email Input */}
          <div className="relative">
            <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-800/50 border border-zinc-700 text-white p-3 pl-10 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all placeholder:text-zinc-500"
              required
            />
          </div>

          {/* Role Select */}
          <div className="relative">
            <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <select
              // value={role}
              // onChange={(e) => setRole(e.target.value)}
              className="w-full bg-zinc-800/50 border border-zinc-700 text-white p-3 pl-10 rounded-lg appearance-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              required
            >
              <option value="" className="bg-zinc-800 text-zinc-500">Select your role</option>
              <option value="executive" className="bg-zinc-800">Executive</option>
              <option value="manager" className="bg-zinc-800">Manager</option>
              <option value="business_owner" className="bg-zinc-800">Business Owner</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className={`w-full text-white py-3 rounded-lg font-semibold tracking-wider transition-all shadow-lg ${
              submitting 
                ? 'bg-green-600/50 cursor-not-allowed flex items-center justify-center gap-2' 
                : 'bg-green-600 hover:bg-green-700 shadow-green-500/30'
            }`}
          >
            {submitting ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Submitting…
              </>
            ) : (
              'Create Account'
            )}
          </button>

          {/* Status Message */}
          {status && (
            <p
              className={`text-sm text-center font-medium p-2 rounded-lg ${
                status.startsWith('✅') ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'
              }`}
            >
              {status}
            </p>
          )}
        </form>

        {/* Sign In Link */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/login')}
            className="text-green-500 hover:text-green-400 hover:underline transition-colors text-sm"
          >
            Already have an account? Sign in
          </button>
        </div>

        <p className="text-xs text-zinc-600 mt-6 text-center">
          By continuing you agree to our <a href="#" className="underline hover:text-green-500">Terms</a> and <a href="#" className="underline hover:text-green-500">Privacy Policy</a>.
        </p>
      </div>

      <footer className="text-center py-6 text-sm text-zinc-600">
        © 2025 CHAT OCP — All rights reserved
      </footer>
    </main>
  );

// return (
//     <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-indigo-100 text-gray-800 font-sans">
//       {/* Title */}
//       <div className="text-center mb-10 animate-fadeIn">
//         <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 mb-2">
//           AI-AUDIT
//         </h1>
//         <p className="text-lg text-gray-600">Interactive AI Marketing Auditor</p>
//       </div>

//       {/* Card */}
//       <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl p-8 w-[90%] sm:w-[420px] animate-fadeIn">
//         <h2 className="text-2xl font-semibold mb-6 text-center">Create your account</h2>

//         <form onSubmit={onSubmit} className="space-y-4">
//           <input
//             type="text"
//             placeholder="Full name"
//             // value={fullName}
//             // onChange={(e) => setFullName(e.target.value)}
//             className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500"
//             required
//           />

//           <input
//             type="email"
//             placeholder="Email address"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500"
//             required
//           />

//           <input
//             type="email"
//             placeholder="Confirm email address"
//             value={email2}
//             onChange={(e) => setEmail2(e.target.value)}
//             className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500"
//             required
//           />

//           <select
//             // value={persona}
//             // onChange={(e) => setPersona(e.target.value as Persona)}
//             className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500"
//             required
//           >
//             <option value="">Select your role</option>
//             <option value="executive">Executive</option>
//             <option value="manager">Manager</option>
//             <option value="business_owner">Business Owner</option>
//           </select>

//           <button
//             type="submit"
//             disabled={submitting}
//             className={`w-full text-white py-3 rounded-lg transition-all ${
//               submitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
//             }`}
//           >
//             {submitting ? 'Submitting…' : 'Create Account'}
//           </button>

//           {status && (
//             <p
//               className={`text-sm text-center ${
//                 status.startsWith('✅') ? 'text-green-600' : 'text-red-600'
//               }`}
//             >
//               {status}
//             </p>
//           )}
//         </form>

//         <div className="text-center mt-6">
//           <button
//             onClick={() => router.push('/login')}
//             className="text-blue-600 hover:underline"
//           >
//             Already have an account? Sign in
//           </button>
//         </div>

//         <p className="text-xs text-gray-500 mt-6 text-center">
//           By continuing you agree to our Terms and Privacy Policy.
//         </p>
//       </div>

//       <footer className="text-center py-6 text-sm text-gray-500">
//         © 2025 CHAT OCP — All rights reserved
//       </footer>
//     </main>
//   );

  // return (
  //   <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-indigo-100 text-gray-800 font-sans">
  //     <div className="text-center mb-10">
  //       <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 mb-2">
  //         Create Account
  //       </h1>
  //       <p className="text-lg text-gray-600">Join us today</p>
  //     </div>

  //     <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl p-8 w-[90%] sm:w-[420px]">
  //       <h2 className="text-2xl font-semibold mb-6 text-center">Sign Up</h2>

  //       <form onSubmit={onSubmit} className="space-y-4">
  //         <input
  //           type="email"
  //           placeholder="Email address"
  //           value={email}
  //           onChange={(e) => setEmail(e.target.value)}
  //           className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500"
  //           required
  //         />

  //         <input
  //           type="email"
  //           placeholder="Confirm email address"
  //           value={email2}
  //           onChange={(e) => setEmail2(e.target.value)}
  //           className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500"
  //           required
  //         />

  //         <input
  //           type="password"
  //           placeholder="Password"
  //           value={password}
  //           onChange={(e) => setPassword(e.target.value)}
  //           className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500"
  //           required
  //         />

  //         <input
  //           type="password"
  //           placeholder="Confirm password"
  //           value={password2}
  //           onChange={(e) => setPassword2(e.target.value)}
  //           className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500"
  //           required
  //         />

  //         <button
  //           type="submit"
  //           disabled={submitting}
  //           className={`w-full text-white py-3 rounded-lg transition-all ${
  //             submitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
  //           }`}
  //         >
  //           {submitting ? 'Submitting…' : 'Create Account'}
  //         </button>

  //         {status && (
  //           <p
  //             className={`text-sm text-center ${
  //               status.startsWith('✅') ? 'text-green-600' : 'text-red-600'
  //             }`}
  //           >
  //             {status}
  //           </p>
  //         )}
  //       </form>

  //       <div className="text-center mt-6">
  //         <button
  //           onClick={() => router.push('/login')}
  //           className="text-blue-600 hover:underline"
  //         >
  //           Already have an account? Sign in
  //         </button>
  //       </div>

  //       <p className="text-xs text-gray-500 mt-6 text-center">
  //         By continuing you agree to our Terms and Privacy Policy.
  //       </p>
  //     </div>

  //     <footer className="text-center py-6 text-sm text-gray-500">
  //       © 2025 — All rights reserved
  //     </footer>
  //   </main>
  // );
}
