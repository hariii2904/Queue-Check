import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, Activity, User, Shield, Stethoscope, Ticket } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser, switchRole } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <Logo size="md" />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive('/')
                  ? 'text-sky-600 bg-sky-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
            >
              {t.navHome}
            </Link>

            <Link
              to="/clinics"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive('/clinics')
                  ? 'text-sky-600 bg-sky-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
            >
              {t.navFindClinics}
            </Link>

            <Link
              to="/track"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${isActive('/track')
                  ? 'text-teal-700 bg-teal-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
            >
              <Activity size={15} className="text-teal-600" />
              <span>{t.trackerTitle}</span>
            </Link>

            <Link
              to="/patient-dashboard"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${isActive('/patient-dashboard')
                  ? 'text-sky-700 bg-sky-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
            >
              <Ticket size={15} className="text-sky-600" />
              <span>{t.navPatientPortal}</span>
            </Link>

            <a
              href="/#how-it-works"
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              {t.navHowItWorks}
            </a>
          </nav>

          {/* Right Tools: Language + Auth Actions */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />

            <div className="h-5 w-px bg-slate-200" />

            {currentUser.role === 'receptionist' ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/receptionist"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-xs transition-all"
                >
                  <Stethoscope size={16} />
                  <span>{t.navDashboard}</span>
                </Link>
                <button
                  onClick={() => switchRole('patient')}
                  className="px-2.5 py-1 rounded-md text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {t.navLogout}
                </button>
              </div>
            ) : currentUser.role === 'admin' ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-all"
                >
                  <Shield size={16} />
                  <span>{t.navAdmin}</span>
                </Link>
                <button
                  onClick={() => switchRole('patient')}
                  className="px-2.5 py-1 rounded-md text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {t.navLogout}
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all border border-slate-200"
              >
                <User size={15} />
                <span>{t.navLogin}</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            {t.navHome}
          </Link>
          <Link
            to="/clinics"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            {t.navFindClinics}
          </Link>
          <Link
            to="/track"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-teal-700 hover:bg-teal-50"
          >
            {t.trackerTitle}
          </Link>
          <Link
            to="/patient-dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-sky-700 hover:bg-sky-50"
          >
            {t.navPatientPortal}
          </Link>

          <div className="pt-2 border-t border-slate-100">
            {currentUser.role === 'receptionist' ? (
              <Link
                to="/receptionist"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full px-4 py-2 rounded-xl text-sm font-semibold text-white bg-teal-600"
              >
                {t.navDashboard}
              </Link>
            ) : currentUser.role === 'admin' ? (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600"
              >
                {t.navAdmin}
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 border border-slate-200"
              >
                {t.navLogin}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
