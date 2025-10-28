import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';
import { Avatar } from '@components/ui';
import clsx from 'clsx';

export const ProfileMenu = () => {
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 transition-opacity hover:opacity-80"
      >
        <Avatar
          src={user.profile}
          alt={user.firstname}
          fallbackText={`${user.firstname} ${user.lastname || ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-xl backdrop-blur-lg">
          {/* User Info */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <Avatar
                src={user.profile}
                alt={user.firstname}
                fallbackText={`${user.firstname} ${user.lastname || ''}`}
                size="md"
              />
              <div className="flex-1">
                <p className="font-bold text-gray-900">
                  {user.firstname} {user.lastname || ''}
                </p>
                <p className="text-xs text-gray-600">Strava ID: {user.stravaId}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                'hover:bg-gray-100'
              )}
            >
              <span className="font-medium text-gray-900">Profile</span>
            </Link>
            <button
              onClick={handleLogout}
              className={clsx(
                'flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors',
                'hover:bg-gray-100'
              )}
            >
              <span className="font-medium text-gray-900">Logout</span>
            </button>

            {/* Separator */}
            <div className="my-2 border-t border-gray-200"></div>

            <Link
              to="/about"
              onClick={() => setIsOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                'hover:bg-gray-100'
              )}
            >
              <span className="font-medium text-gray-900">About Kompanion</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
