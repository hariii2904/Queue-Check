import { Hospital, HospitalSource } from '../types';

export interface OverpassElement {
  type: 'node' | 'way';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export class OsmHospitalService {
  private static readonly OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';
  private static lastRequestTimestamp = 0;
  private static readonly RATE_LIMIT_DELAY_MS = 2000;

  /**
   * Fetches real publicly accessible hospitals and clinics in Chennai or a specified bounding box
   * using the OpenStreetMap Overpass API.
   *
   * Bounding box format: [south, west, north, east]
   * Default: Greater Chennai Region [12.85, 80.05, 13.25, 80.35]
   */
  public static async fetchHospitalsFromOSM(
    bbox: [number, number, number, number] = [12.85, 80.05, 13.25, 80.35]
  ): Promise<{ hospitals: Hospital[]; sources: HospitalSource[] }> {
    const now = Date.now();
    if (now - this.lastRequestTimestamp < this.RATE_LIMIT_DELAY_MS) {
      // Respect OSM Overpass fair use policy
      await new Promise((resolve) => setTimeout(resolve, this.RATE_LIMIT_DELAY_MS - (now - this.lastRequestTimestamp)));
    }
    this.lastRequestTimestamp = Date.now();

    const [s, w, n, e] = bbox;
    const overpassQuery = `
      [out:json][timeout:20];
      (
        node["amenity"="hospital"](${s},${w},${n},${e});
        node["amenity"="clinic"](${s},${w},${n},${e});
        way["amenity"="hospital"](${s},${w},${n},${e});
        way["amenity"="clinic"](${s},${w},${n},${e});
      );
      out center 50;
    `;

    try {
      const response = await fetch(this.OVERPASS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(overpassQuery)}`,
      });

      if (!response.ok) {
        throw new Error(`Overpass API responded with HTTP ${response.status}`);
      }

      const json = await response.json();
      const elements: OverpassElement[] = json.elements || [];

      const hospitals: Hospital[] = [];
      const sources: HospitalSource[] = [];

      elements.forEach((el) => {
        const tags = el.tags || {};
        const name = tags.name || tags['name:en'];
        if (!name) return; // Skip unnamed nodes

        const lat = el.lat || el.center?.lat;
        const lon = el.lon || el.center?.lon;
        if (!lat || !lon) return;

        const hospId = `osm-${el.type}-${el.id}`;
        const area = tags['addr:suburb'] || tags['addr:district'] || tags['addr:neighbourhood'] || 'Chennai';
        const address =
          tags['addr:full'] ||
          [tags['addr:housenumber'], tags['addr:street'], area, 'Chennai', tags['addr:postcode']]
            .filter(Boolean)
            .join(', ') ||
          `${area}, Chennai, Tamil Nadu`;

        const phone = tags.phone || tags['contact:phone'] || 'Contact via Reception';
        const website = tags.website || tags['contact:website'];
        const openingHours = tags.opening_hours || '08:00 AM - 08:00 PM';

        // Extract departments / specialties if tagged in OSM
        const specialtiesRaw = tags['healthcare:speciality'] || tags.speciality || '';
        const departments = specialtiesRaw
          ? specialtiesRaw.split(';').map((s) => s.trim().replace(/_/g, ' '))
          : ['General Medicine', 'Outpatient Services (OPD)'];

        const hospital: Hospital = {
          id: hospId,
          name: name,
          name_ta: tags['name:ta'],
          address,
          area,
          city: 'Chennai',
          latitude: lat,
          longitude: lon,
          phone,
          emergency_phone: tags['emergency:phone'] || tags.emergency === 'yes' ? '108' : undefined,
          website,
          opening_time: openingHours.includes('-') ? openingHours.split('-')[0].trim() : '08:00 AM',
          closing_time: openingHours.includes('-') ? openingHours.split('-')[1].trim() : '08:00 PM',
          status: 'active',
          is_partner_queue: false, // Live queue is UNAVAILABLE because this is an unpartnered OSM listing
          data_source: 'OpenStreetMap Overpass API (ODbL License)',
          data_source_url: `https://www.openstreetmap.org/${el.type}/${el.id}`,
          verification_status: 'community_submitted',
          last_verified: new Date().toISOString(),
          departments,
          osm_id: `${el.type}/${el.id}`,
          created_at: new Date().toISOString(),
        };

        const source: HospitalSource = {
          id: `source-${hospId}`,
          hospital_id: hospId,
          source_name: 'OpenStreetMap Overpass API',
          source_url: `https://www.openstreetmap.org/${el.type}/${el.id}`,
          verified_at: new Date().toISOString(),
          verification_status: 'community_submitted',
          license: 'ODbL - OpenStreetMap contributors',
          notes: `OSM ${el.type} #${el.id}. Real public facility coordinates and tags extracted from OpenStreetMap open database.`,
        };

        hospitals.push(hospital);
        sources.push(source);
      });

      return { hospitals, sources };
    } catch (error) {
      console.warn('Overpass API query failed or was rate-limited. Falling back to verified registry.', error);
      return { hospitals: [], sources: [] };
    }
  }

  /**
   * Free-text geolocation query using OpenStreetMap Nominatim API
   * Follows Nominatim usage policy (1 request/sec, meaningful User-Agent)
   */
  public static async searchLocationNominatim(
    query: string
  ): Promise<{ lat: number; lon: number; display_name: string }[]> {
    if (!query || query.trim().length < 3) return [];

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query + ', Chennai, Tamil Nadu, India'
      )}&limit=5`;

      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'QueueCheck-Healthcare-Platform/2.0 (Chennai Health Queue Project)',
        },
      });

      if (!res.ok) return [];
      const data = await res.json();
      return (data || []).map((item: any) => ({
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        display_name: item.display_name,
      }));
    } catch {
      return [];
    }
  }
}
