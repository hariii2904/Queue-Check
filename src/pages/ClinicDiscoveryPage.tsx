import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ClinicWithQueueSummary } from '../types';
import { dataService, queueEvents } from '../services/dataService';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { ClinicMap } from '../components/map/ClinicMap';
import { WaitTimeBadge } from '../components/queue/WaitTimeBadge';
import {
  Search,
  MapPin,
  Stethoscope,
  Users,
  Clock,
  ArrowRight,
  Map,
  List,
  Filter,
  Activity,
  AlertCircle,
  ShieldCheck,
  Globe,
  Database,
  Building2,
  Sparkles,
} from 'lucide-react';

export const ClinicDiscoveryPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [clinics, setClinics] = useState<ClinicWithQueueSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetchingOsm, setIsFetchingOsm] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedClinicId, setSelectedClinicId] = useState<string | undefined>(undefined);

  // Filters state from URL or initial
  const querySearch = searchParams.get('q') || '';
  const queryArea = searchParams.get('area') || '';
  const querySpecialty = searchParams.get('specialty') || '';
  const [onlyPartner, setOnlyPartner] = useState(false);
  const [sortBy, setSortBy] = useState<'wait' | 'distance' | 'name'>('name');

  const fetchClinics = async () => {
    setLoading(true);
    const data = await dataService.getClinicSummaries();
    setClinics(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchClinics();
    const unsub = queueEvents.subscribe(fetchClinics);
    return unsub;
  }, []);

  const handleQueryOsm = async () => {
    setIsFetchingOsm(true);
    showToast(t.fetchOsmLoading, 'info');
    try {
      const count = await dataService.fetchAndMergeOsmHospitals();
      if (count > 0) {
        showToast(`Imported ${count} real health facilities from OpenStreetMap!`, 'success', 'OpenStreetMap Live Query');
      } else {
        showToast('OpenStreetMap facilities are already synchronized with your local directory.', 'info');
      }
      fetchClinics();
    } catch {
      showToast('Could not reach OpenStreetMap Overpass servers. Using verified local registry.', 'warning');
    } finally {
      setIsFetchingOsm(false);
    }
  };

  // Filter options
  const specialties = useMemo(() => {
    const set = new Set<string>();
    clinics.forEach((c) => {
      if (c.departments) c.departments.forEach((dept) => set.add(dept));
      c.doctors.forEach((d) => set.add(d.specialty));
    });
    return Array.from(set).sort();
  }, [clinics]);

  const areas = useMemo(() => {
    const set = new Set<string>();
    clinics.forEach((c) => set.add(c.area));
    return Array.from(set).sort();
  }, [clinics]);

  // Filtered & Sorted clinics
  const filteredClinics = useMemo(() => {
    return clinics
      .filter((c) => {
        const nameMatch =
          !querySearch ||
          c.name.toLowerCase().includes(querySearch.toLowerCase()) ||
          (c.name_ta && c.name_ta.includes(querySearch));

        const areaMatch =
          !queryArea ||
          c.area.toLowerCase() === queryArea.toLowerCase() ||
          c.address.toLowerCase().includes(queryArea.toLowerCase());

        const specialtyMatch =
          !querySpecialty ||
          c.doctors.some((d) => d.specialty.toLowerCase() === querySpecialty.toLowerCase()) ||
          (c.departments && c.departments.some((d) => d.toLowerCase().includes(querySpecialty.toLowerCase())));

        const partnerMatch = !onlyPartner || c.is_partner_queue;

        return nameMatch && areaMatch && specialtyMatch && partnerMatch;
      })
      .sort((a, b) => {
        if (sortBy === 'wait') {
          // Put partner clinics with active queues first
          if (a.is_partner_queue && !b.is_partner_queue) return -1;
          if (!a.is_partner_queue && b.is_partner_queue) return 1;
          return a.min_wait_time - b.min_wait_time;
        } else if (sortBy === 'distance') {
          return (a.distance_km || 99) - (b.distance_km || 99);
        } else {
          return a.name.localeCompare(b.name);
        }
      });
  }, [clinics, querySearch, queryArea, querySpecialty, onlyPartner, sortBy]);

  const updateParam = (key: string, val: string) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set(key, val);
    else next.delete(key);
    setSearchParams(next);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t.discoveryTitle}
          </h1>
          <p className="text-sm text-slate-500">
            {t.discoverySubtitle}
          </p>
        </div>

        {/* Live OpenStreetMap Query Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleQueryOsm}
            disabled={isFetchingOsm}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            title="Queries the live OpenStreetMap Overpass API for real hospitals in Chennai"
          >
            <Globe size={14} className={isFetchingOsm ? 'animate-spin' : 'text-teal-400'} />
            <span>{isFetchingOsm ? t.fetchOsmLoading : t.fetchOsmBtn}</span>
          </button>
        </div>
      </div>

      {/* Real Data Transparency Notice */}
      <div className="flex items-start gap-3 p-4 bg-sky-50/80 border border-sky-200/90 rounded-2xl text-xs text-sky-950">
        <Database size={18} className="text-sky-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Real-World Healthcare Directory:</strong> Facility names, addresses, coordinates, and contact details are sourced from verified public registries and OpenStreetMap (ODbL). 
          Hospitals with an authorized Receptionist Desk connected display <strong>LIVE</strong> tokens. For other facilities, queue state is transparently marked as <strong>UNAVAILABLE</strong> until hospital onboarding.
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={querySearch}
              onChange={(e) => updateParam('q', e.target.value)}
              className="w-full bg-transparent text-slate-900 focus:outline-hidden text-xs"
            />
          </div>

          {/* Specialty / Department Filter */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm">
            <Stethoscope size={16} className="text-slate-400 shrink-0" />
            <select
              value={querySpecialty}
              onChange={(e) => updateParam('specialty', e.target.value)}
              className="w-full bg-transparent text-slate-800 text-xs focus:outline-hidden"
            >
              <option value="">{t.filterAllSpecialties}</option>
              {specialties.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Area Filter */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm">
            <MapPin size={16} className="text-slate-400 shrink-0" />
            <select
              value={queryArea}
              onChange={(e) => updateParam('area', e.target.value)}
              className="w-full bg-transparent text-slate-800 text-xs focus:outline-hidden"
            >
              <option value="">{t.filterAllAreas}</option>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}, Chennai
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm">
            <Filter size={16} className="text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'wait' | 'distance' | 'name')}
              className="w-full bg-transparent text-slate-800 text-xs focus:outline-hidden font-medium"
            >
              <option value="name">{t.sortName}</option>
              <option value="wait">{t.sortShortestWait}</option>
              <option value="distance">{t.sortDistance}</option>
            </select>
          </div>
        </div>

        {/* Second Row: Partner Toggle & View Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none font-medium text-slate-700">
            <input
              type="checkbox"
              checked={onlyPartner}
              onChange={(e) => setOnlyPartner(e.target.checked)}
              className="rounded-md border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
            />
            <span>{t.filterPartnerOnly}</span>
          </label>

          <div className="flex items-center gap-3">
            <div className="text-slate-500 font-medium">
              <strong className="text-slate-900">{filteredClinics.length}</strong> {t.clinicsFound}
            </div>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all font-medium ${
                  viewMode === 'list'
                    ? 'bg-white text-sky-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List size={13} />
                <span>{t.viewModeList}</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all font-medium ${
                  viewMode === 'map'
                    ? 'bg-white text-teal-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Map size={13} />
                <span>{t.viewModeMap}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: List or Map View */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 space-y-2">
          <Activity size={32} className="mx-auto text-sky-500 animate-spin" />
          <p className="text-sm">{t.loading}</p>
        </div>
      ) : viewMode === 'map' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ClinicMap
              clinics={filteredClinics}
              selectedClinicId={selectedClinicId}
              onSelectClinic={(id) => setSelectedClinicId(id)}
            />
          </div>
          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {filteredClinics.map((clinic) => {
              const clinicName = (language === 'ta' && clinic.name_ta) ? clinic.name_ta : clinic.name;
              const isSelected = clinic.id === selectedClinicId;
              return (
                <div
                  key={clinic.id}
                  onClick={() => setSelectedClinicId(clinic.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">{clinicName}</h3>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                        clinic.is_partner_queue
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {clinic.is_partner_queue ? 'LIVE' : 'DIRECTORY'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                    <MapPin size={12} className="text-slate-400 shrink-0" />
                    <span>{clinic.area}, Chennai ({clinic.distance_km} km)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                    {clinic.is_partner_queue ? (
                      <>
                        <span className="text-emerald-700 font-bold">
                          {clinic.total_waiting} waiting
                        </span>
                        <WaitTimeBadge minutes={clinic.min_wait_time} size="sm" />
                      </>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        Live queue unavailable
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClinics.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
              <AlertCircle size={36} className="mx-auto text-slate-300" />
              <p className="text-sm text-slate-600 font-medium">{t.noClinicsFound}</p>
              <button
                onClick={() => {
                  setSearchParams(new URLSearchParams());
                  setOnlyPartner(false);
                }}
                className="text-xs text-sky-600 font-semibold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            filteredClinics.map((clinic) => {
              const clinicName = (language === 'ta' && clinic.name_ta) ? clinic.name_ta : clinic.name;
              const clinicArea = (language === 'ta' && clinic.area_ta) ? clinic.area_ta : clinic.area;

              return (
                <div
                  key={clinic.id}
                  className={`bg-white rounded-3xl border transition-all flex flex-col justify-between overflow-hidden group shadow-xs hover:shadow-md ${
                    clinic.is_partner_queue
                      ? 'border-teal-200/90 hover:border-teal-400 ring-1 ring-teal-500/10'
                      : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div className="p-6 space-y-4">
                    {/* Top Status & Verification Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          clinic.is_partner_queue
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {clinic.is_partner_queue ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{t.partnerBadge}</span>
                          </>
                        ) : (
                          <>
                            <Building2 size={11} />
                            <span>{t.publicDirectoryBadge}</span>
                          </>
                        )}
                      </span>

                      {clinic.distance_km && (
                        <span className="text-[11px] font-mono text-slate-400">
                          {clinic.distance_km} km away
                        </span>
                      )}
                    </div>

                    {/* Hospital Name & Locality */}
                    <div>
                      <h2 className="font-black text-slate-900 text-lg group-hover:text-sky-600 transition-colors leading-tight">
                        {clinicName}
                      </h2>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1.5">
                        <MapPin size={13} className="text-slate-400 shrink-0" />
                        <span>{clinicArea}, Chennai</span>
                      </div>
                    </div>

                    {/* Verified Departments preview */}
                    {clinic.departments && clinic.departments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {clinic.departments.slice(0, 3).map((dept, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                          >
                            {dept}
                          </span>
                        ))}
                        {clinic.departments.length > 3 && (
                          <span className="text-[10px] bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded-md">
                            +{clinic.departments.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Dynamic Queue Metrics or Transparent Unavailable Notice */}
                    {clinic.is_partner_queue ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100 text-center">
                          <div>
                            <div className="text-[11px] text-emerald-800 font-semibold">
                              {t.patientsWaiting}
                            </div>
                            <div className="text-2xl font-black text-emerald-700 font-mono mt-0.5">
                              {clinic.total_waiting}
                            </div>
                          </div>

                          <div>
                            <div className="text-[11px] text-emerald-800 font-semibold">
                              {t.currentlyServing}
                            </div>
                            <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                              {clinic.doctors[0]?.current_token || 'None'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs px-1">
                          <span className="text-slate-500 font-medium">{t.estimatedWait}:</span>
                          <WaitTimeBadge
                            minutes={clinic.min_wait_time}
                            lower={clinic.min_wait_time}
                            upper={clinic.max_wait_time}
                            size="sm"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-500 space-y-1">
                        <div className="font-bold text-slate-700 flex items-center gap-1.5">
                          <Clock size={13} className="text-slate-400" />
                          <span>{t.statusUnavailable}</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-400">
                          {t.unverifiedNotice}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Source Transparency & View Action */}
                  <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="text-[10px] text-slate-400 max-w-[55%] truncate" title={clinic.data_source}>
                      {t.dataSourceLabel}: {clinic.data_source}
                    </div>

                    <button
                      onClick={() => navigate(`/clinics/${clinic.id}`)}
                      className="inline-flex items-center gap-1 font-bold text-sky-600 hover:text-sky-800 transition-colors group-hover:translate-x-0.5 cursor-pointer shrink-0"
                    >
                      <span>{t.viewDetails}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
