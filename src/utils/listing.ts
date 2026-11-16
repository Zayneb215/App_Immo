import type { DocumentData } from 'firebase/firestore';

// Nafs el modèle "Listing" mta3 Flutter (collection "listings")
export type Listing = {
  id: string;
  title: string;
  description: string;
  type: string; // appartement | maison | villa | terrain | local
  transaction: string; // vente | location
  price: number;
  rooms: number;
  bathrooms: number;
  surface: number;
  city: string;
  address: string;
  lat: number | null;
  lng: number | null;
  imageUrls: string[];
  amenities: string[];
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  createdAtMs: number | null; // null = l'annonce vient d'être publiée
};

const num = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0);
const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);

export function listingFromDoc(doc: { id: string; data: () => DocumentData | undefined }): Listing {
  const d = doc.data() ?? {};
  return {
    id: doc.id,
    title: str(d.title),
    description: str(d.description),
    type: str(d.type, 'appartement'),
    transaction: str(d.transaction, 'location'),
    price: num(d.price),
    rooms: num(d.rooms),
    bathrooms: num(d.bathrooms),
    surface: num(d.surface),
    city: str(d.city),
    address: str(d.address),
    lat: typeof d.lat === 'number' ? d.lat : null,
    lng: typeof d.lng === 'number' ? d.lng : null,
    imageUrls: Array.isArray(d.imageUrls) ? d.imageUrls.filter((u: unknown) => typeof u === 'string') : [],
    amenities: Array.isArray(d.amenities) ? d.amenities.filter((a: unknown) => typeof a === 'string') : [],
    ownerId: str(d.ownerId),
    ownerName: str(d.ownerName),
    ownerPhone: str(d.ownerPhone),
    createdAtMs: d.createdAt?.toMillis ? d.createdAt.toMillis() : null,
  };
}

// 580000 -> "580 000 TND"
export const formatPrice = (price: number) =>
  `${Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} TND`;

// Mel a7dath lel 9dim (createdAt == null = jdid bark)
export const byDateDesc = (a: Listing, b: Listing) =>
  (b.createdAtMs ?? Date.now()) - (a.createdAtMs ?? Date.now());