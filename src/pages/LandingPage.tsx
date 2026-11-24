import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { dataService, queueEvents } from '../services/dataService';
import {
  Search,
  MapPin,
  Clock,
  Users,
  ShieldCheck,
  Activity,
  ArrowRight,
  Sparkles,
  Stethoscope,
  HeartPulse,
  Baby,
  Bone,
  CheckCircle,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [stats, setStats] = useState({
    totalHospitals: 5,
    activeQueues: 7,
    tokensToday: 48,
    averageWaitTimeMins: 22,
  });

  useEffect(() => {
    const loadStats = async () => {
      const data = await dataService.getPlatformStats();
      setStats(data);
    };
    loadStats();
    const unsub = queueEvents.subscribe(loadStats);
    return unsub;
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.append('q', searchTerm);
    if (selectedArea) params.append('area', selectedArea);
    navigate(`/clinics?${params.toString()}`);
  };

  const handleTrackToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      navigate(`/track?token=${encodeURIComponent(tokenInput.trim())}`);
    }
  };

  const popularSpecialties = [
    { name: 'General Medicine', name_ta: 'பொது மருத்துவம்', icon: Stethoscope },
    { name: 'Pediatrics', name_ta: 'குழந்தைகள் நலம்', icon: Baby },
    { name: 'Cardiology', name_ta: 'இதயவியல்', icon: HeartPulse },
    { name: 'Orthopedics', name_ta: 'எலும்பு மூட்டு', icon: Bone },
  ];

  const popularAreas = ['Kilpauk', 'Adyar', 'Alwarpet', 'Vadapalani', 'T. Nagar'];

  return (
    <div className="space-y-16 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/70 via-white to-slate-50 pt-12 pb-20 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Tagline / Sub-badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold shadow-xs">
              <Sparkles size={14} className="text-teal-600" />
              <span>{t.tagline}</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              {t.heroTitle}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {t.heroSubtitle}
            </p>

            {/* Main Search Bar Form */}
            <form
              onSubmit={handleSearch}
              className="mt-8 p-2 sm:p-3 bg-white rounded-2xl shadow-xl shadow-sky-900/5 border border-slate-200 flex flex-col md:flex-row gap-2 max-w-3xl mx-auto"
            >
              {/* Keyword Search */}
              <div className="flex-1 flex items-center gap-2.5 px-3 py-2 bg-slate-50/60 rounded-xl border border-slate-200/70">
                <Search size={18} className="text-sky-600 shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden"
                />
              </div>

              {/* Location / Area Dropdown */}
              <div className="w-full md:w-56 flex items-center gap-2 px-3 py-2 bg-slate-50/60 rounded-xl border border-slate-200/70">
                <MapPin size={18} className="text-teal-600 shrink-0" />
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-800 focus:outline-hidden"
                >
                  <option value="">{t.filterAllAreas}</option>
                  {popularAreas.map((area) => (
                    <option key={area} value={area}>
                      {area}, Chennai
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <span>{t.searchButton}</span>
                <ArrowRight size={16} />
              </button>
            </form>

            {/* Quick Track Existing Token Drawer Bar */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
              <span className="font-medium text-slate-600">Already have a token?</span>
              <form onSubmit={handleTrackToken} className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="e.g. A028 or B014"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                  className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg uppercase font-mono font-bold w-28 bg-white focus:outline-hidden focus:border-sky-500"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors"
                >
                  Track Now
                </button>
              </form>
            </div>

            {/* Popular Chennai Hubs */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Quick Chennai Localities:</span>
              {popularAreas.map((area) => (
                <button
                  key={area}
                  onClick={() => navigate(`/clinics?area=${encodeURIComponent(area)}`)}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-sky-50 border border-slate-200 text-slate-700 hover:text-sky-700 font-medium transition-colors"
                >
                  {area}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. REAL-TIME STATS COUNTER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-sky-600 font-mono">
              {stats.totalHospitals}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-600">
              Chennai Hospitals Tracked
            </div>
            <div className="text-[11px] text-slate-400">Apollo, Kauvery, RGGGH, MIOT & more</div>
          </div>

          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-teal-600 font-mono">
              {stats.activeQueues}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-600">
              Live Pilot Queues
            </div>
            <div className="text-[11px] text-teal-600 font-medium flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              Connected Staff Desks
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
              {stats.tokensToday}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-600">
              Tokens Managed Today
            </div>
            <div className="text-[11px] text-slate-400">Actual patient visits recorded</div>
          </div>

          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-indigo-600 font-mono">
              ~{stats.averageWaitTimeMins}m
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-600">
              Average Waiting Time
            </div>
            <div className="text-[11px] text-indigo-500 font-medium">Predictive wait estimation</div>
          </div>
        </div>

        {/* Real-World Data Transparency Assurance Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <span className="font-bold text-slate-800">QueueCheck Data Transparency Guarantee: </span>
              <span className="text-slate-600">
                Live queue numbers are synchronized exclusively with authorized clinic receptionists (e.g. Apollo Greams Road, Kauvery Alwarpet). Unpartnered public institutions are clearly marked with &ldquo;Live queue unavailable&rdquo;. We never invent fake patients.
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate('/clinics')}
            className="text-sky-700 hover:text-sky-800 font-bold shrink-0 flex items-center gap-1"
          >
            <span>Explore Facilities</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </section>

      {/* 3. POPULAR SPECIALTIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {language === 'ta' ? 'சிறப்பு மருத்துவப் பிரிவுகள்' : 'Explore by Medical Specialty'}
          </h2>
          <p className="text-sm text-slate-500">
            Check live queue lengths across major clinical departments in Chennai
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {popularSpecialties.map((spec) => {
            const Icon = spec.icon;
            const title = language === 'ta' ? spec.name_ta : spec.name;
            return (
              <button
                key={spec.name}
                onClick={() => navigate(`/clinics?specialty=${encodeURIComponent(spec.name)}`)}
                className="p-5 rounded-2xl bg-white hover:bg-sky-50/50 border border-slate-200/90 hover:border-sky-300 shadow-xs hover:shadow-md transition-all text-left group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Icon size={24} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">{title}</h3>
                <span className="text-xs font-semibold text-sky-600 flex items-center gap-1">
                  <span>View Queues</span>
                  <ArrowRight size={12} />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              {t.howItWorksTitle}
            </h2>
            <p className="text-sm text-slate-400">
              {t.howItWorksSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 font-black flex items-center justify-center text-lg">
                1
              </div>
              <h3 className="text-lg font-bold text-white">{t.step1Title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{t.step1Desc}</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 font-black flex items-center justify-center text-lg">
                2
              </div>
              <h3 className="text-lg font-bold text-white">{t.step2Title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{t.step2Desc}</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 font-black flex items-center justify-center text-lg">
                3
              </div>
              <h3 className="text-lg font-bold text-white">{t.step3Title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{t.step3Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FEATURE CARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
              <Activity size={20} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">{t.feat1Title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{t.feat1Desc}</p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
              <Clock size={20} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">{t.feat2Title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{t.feat2Desc}</p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Users size={20} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">{t.feat3Title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{t.feat3Desc}</p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">{t.feat4Title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{t.feat4Desc}</p>
          </div>
        </div>
      </section>

      {/* 6. BOTTOM CALL TO ACTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-sky-600 to-teal-700 text-white rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-sky-900/10">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-black">
              Ready to check live queues in Chennai?
            </h2>
            <p className="text-sm text-sky-100">
              Browse 10+ verified hospitals, OpenStreetMap facilities, and authorized partner OPD queues.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={() => navigate('/clinics')}
              className="px-6 py-3 rounded-xl bg-white text-sky-800 font-bold text-sm shadow-md hover:bg-slate-50 transition-all cursor-pointer"
            >
              {t.ctaFindNearby}
            </button>
            <button
              onClick={() => navigate('/patient-dashboard')}
              className="px-6 py-3 rounded-xl bg-teal-800/80 hover:bg-teal-800 text-white font-bold text-sm border border-teal-500/50 transition-all cursor-pointer"
            >
              My Patient Tokens
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
