import React from 'react';
import { Logo } from './Logo';
import { useLanguage } from '../../context/LanguageContext';
import { PhoneCall, MapPin, Heart, ShieldAlert } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t, language } = useLanguage();

  return (
    <footer className="bg-slate-900 text-slate-400 text-sm mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Brand & Tagline */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center">
              <Logo size="md" className="text-white brightness-125" />
            </div>
            <p className="text-slate-300 font-medium">
              "{t.tagline}"
            </p>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              QueueCheck is Chennai's smart hospital and clinic queue monitoring platform.
              We empower patients to skip crowded waiting halls by checking real-time queue
              lengths and calculated doctor consultation times before leaving home.
            </p>
            <div className="flex items-center gap-2 text-xs text-sky-400 pt-1">
              <MapPin size={14} />
              <span>Target Region: Chennai, Tamil Nadu, India</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              {language === 'ta' ? 'இணைப்புகள்' : 'Quick Links'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="/clinics" className="hover:text-white transition-colors">
                  {t.navFindClinics}
                </a>
              </li>
              <li>
                <a href="/track" className="hover:text-white transition-colors">
                  {t.trackerTitle}
                </a>
              </li>
              <li>
                <a href="/#how-it-works" className="hover:text-white transition-colors">
                  {t.navHowItWorks}
                </a>
              </li>
              <li>
                <a href="/login" className="hover:text-white transition-colors">
                  {t.navLogin}
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Emergency & Health Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert size={14} />
              {language === 'ta' ? 'அவசர உதவி' : 'Emergency Contacts'}
            </h4>
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/50 text-xs space-y-2 text-rose-200">
              <div className="flex items-center gap-2 font-bold text-white">
                <PhoneCall size={14} className="text-rose-400" />
                <span>Ambulance: 108</span>
              </div>
              <div className="text-[11px] text-rose-300">
                Chennai Health Helpline: 044-2538 4520
              </div>
              <div className="text-[10px] text-rose-400/80 leading-tight">
                For life-threatening conditions, please proceed to the nearest emergency room immediately.
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer Bar */}
        <div className="pt-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            © {new Date().getFullYear()} QueueCheck Platform. Built for Tamil Nadu Healthcare.
          </p>
          <div className="flex items-center gap-1 text-[11px]">
            <span>Empowering patient convenience in Chennai</span>
            <Heart size={12} className="text-rose-500 fill-rose-500" />
          </div>
        </div>
      </div>
    </footer>
  );
};
