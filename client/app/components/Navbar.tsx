'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Hide navbar on login/signup pages
  if (pathname === '/login' || pathname === '/signup') {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleLogoClick = () => {
    handleLogout();
  };

  return (
    <nav className="w-full bg-white/80 backdrop-blur-lg shadow-sm px-6 py-4 flex justify-between items-center relative z-50">
      {/* Left: Logo */}
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={handleLogoClick}
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
          A
        </div>
        <h1 className="text-lg font-semibold tracking-tight text-gray-800">
          A2X CORP
        </h1>
      </div>

      {/* Right: Links + Profile */}
      <div className="hidden md:flex items-center gap-8">

        <button
          onClick={() => router.push('/dashboard')}
          className="text-gray-700 hover:text-blue-600 transition-all font-medium"
        >
          Dashboard
        </button>

        {/* NEW Chatbot button */}
        <button
          onClick={() => router.push('/chatbot')}
          className="text-gray-700 hover:text-blue-600 transition-all font-medium"
        >
          Chatbot
        </button>

        <button
          onClick={() => router.push('/profile')}
          className="text-gray-700 hover:text-blue-600 transition-all font-medium"
        >
          Profile
        </button>

        {/* User Avatar + Dropdown */}
        <div className="relative group">
          <div className="w-9 h-9 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center cursor-pointer font-semibold hover:bg-gray-300 transition">
            <img
              src="/icons/profile.png"
              alt="Profile"
              className="w-6 h-6 rounded-full"
            />
          </div>

          <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 shadow-lg rounded-lg opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 ease-out z-50">
            <button
              onClick={() => router.push('/account')}
              className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 text-sm"
            >
              Manage Profile
            </button>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden text-gray-700"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile Dropdown */}
      {open && (
        <div className="absolute top-16 right-0 w-full bg-white border-t border-gray-200 flex flex-col items-center py-4 shadow-md md:hidden">

          <button
            onClick={() => router.push('/dashboard')}
            className="py-2 text-gray-700 hover:text-blue-600"
          >
            Dashboard
          </button>

          {/* NEW Chatbot mobile button */}
          <button
            onClick={() => router.push('/chatbot')}
            className="py-2 text-gray-700 hover:text-blue-600"
          >
            Chatbot
          </button>

          <button
            onClick={() => router.push('/profile')}
            className="py-2 text-gray-700 hover:text-blue-600"
          >
            Profile
          </button>

          <button
            onClick={() => router.push('/account')}
            className="py-2 text-gray-700 hover:text-blue-600"
          >
            Manage Profile
          </button>

          <button
            onClick={handleLogout}
            className="py-2 text-gray-700 hover:text-blue-600"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
