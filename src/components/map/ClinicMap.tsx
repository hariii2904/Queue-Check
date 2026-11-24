import React, { useEffect, useRef } from 'react';
import { ClinicWithQueueSummary } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import L from 'leaflet';

interface ClinicMapProps {
  clinics: ClinicWithQueueSummary[];
  selectedClinicId?: string;
  onSelectClinic?: (clinicId: string) => void;
}

export const ClinicMap: React.FC<ClinicMapProps> = ({
  clinics,
  selectedClinicId,
  onSelectClinic,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const { language, t } = useLanguage();

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Center on Greater Chennai: [13.06, 80.24]
    const map = L.map(mapContainerRef.current, {
      center: [13.06, 80.24],
      zoom: 12,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    clinics.forEach((clinic) => {
      const isSelected = clinic.id === selectedClinicId;
      const clinicName = (language === 'ta' && clinic.name_ta) ? clinic.name_ta : clinic.name;
      const clinicArea = (language === 'ta' && clinic.area_ta) ? clinic.area_ta : clinic.area;

      const isPartner = clinic.is_partner_queue;
      const pinColor = isSelected ? '#0284c7' : isPartner ? '#0f766e' : '#475569';

      const badgeText = isPartner
        ? `${clinic.total_waiting} waiting | ~${clinic.min_wait_time}m`
        : 'Directory Listing';

      const pinHtml = `
        <div style="transform: translate(-50%, -100%); cursor: pointer; text-align: center;">
          <div style="
            background: ${pinColor};
            color: white;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 8px;
            border-radius: 9999px;
            white-space: nowrap;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.25);
            border: 2px solid white;
            display: inline-flex;
            align-items: center;
            gap: 4px;
          ">
            ${isPartner ? '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#34d399;"></span>' : ''}
            <span>${badgeText}</span>
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 6px solid ${pinColor};
            margin: 0 auto;
          "></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-clinic-pin',
        html: pinHtml,
        iconSize: [140, 40],
        iconAnchor: [70, 40],
      });

      const marker = L.marker([clinic.latitude, clinic.longitude], { icon: customIcon }).addTo(map);

      const popupContent = `
        <div style="font-family: system-ui, sans-serif; padding: 4px; min-width: 200px;">
          <div style="font-size: 10px; font-weight: 800; color: ${isPartner ? '#0f766e' : '#64748b'}; text-transform: uppercase; margin-bottom: 2px;">
            ${isPartner ? 'Live Queue Connected' : 'Verified Public Directory'}
          </div>
          <div style="font-weight: 800; font-size: 14px; color: #0f172a; margin-bottom: 4px; line-height: 1.2;">
            ${clinicName}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
            ${clinicArea}, Chennai
          </div>
          <div style="font-size: 11px; margin-bottom: 8px; background: #f8fafc; padding: 6px 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
            ${isPartner
          ? `<strong>${clinic.total_waiting}</strong> patients waiting • <strong>~${clinic.min_wait_time}m</strong> wait`
          : '<span style="color:#64748b;font-style:italic;">Live queue unavailable</span>'
        }
          </div>
          <a href="/clinics/${clinic.id}" style="
            display: block;
            text-align: center;
            background: #0284c7;
            color: white;
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 700;
            text-decoration: none;
          ">
            ${t.viewDetails}
          </a>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        if (onSelectClinic) onSelectClinic(clinic.id);
      });

      markersRef.current[clinic.id] = marker;
    });

    if (selectedClinicId && markersRef.current[selectedClinicId]) {
      const selected = clinics.find((c) => c.id === selectedClinicId);
      if (selected) {
        map.flyTo([selected.latitude, selected.longitude], 14, { duration: 1 });
        markersRef.current[selectedClinicId].openPopup();
      }
    }
  }, [clinics, selectedClinicId, language, onSelectClinic, t.viewDetails]);

  return (
    <div className="relative w-full h-[450px] lg:h-[550px] rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm">
      <div ref={mapContainerRef} className="w-full h-full" />
      <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 shadow-sm border border-slate-200 pointer-events-none">
        OpenStreetMap • Greater Chennai Healthcare Map
      </div>
    </div>
  );
};
