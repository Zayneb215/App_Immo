import type { MaterialIcons } from '@expo/vector-icons';

export type Amenity = {
  key: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
};

export const AMENITIES: Amenity[] = [
  { key: 'chauffage', label: 'Chauffage', icon: 'local-fire-department' },
  { key: 'climatisation', label: 'Climatisation', icon: 'ac-unit' },
  { key: 'television', label: 'Télévision', icon: 'tv' },
  { key: 'machine', label: 'Machine à laver', icon: 'local-laundry-service' },
  { key: 'wifi', label: 'Wifi', icon: 'wifi' },
  { key: 'parking', label: 'Parking', icon: 'local-parking' },
  { key: 'ascenseur', label: 'Ascenseur', icon: 'elevator' },
  { key: 'meuble', label: 'Meublé', icon: 'chair' },
  { key: 'terrasse', label: 'Terrasse / balcon', icon: 'deck' },
  { key: 'jardin', label: 'Jardin', icon: 'yard' },
  { key: 'cuisine', label: 'Cuisine équipée', icon: 'kitchen' },
  { key: 'securite', label: 'Sécurité / gardiennage', icon: 'security' },
];

export const amenityByKey = (key: string) => AMENITIES.find((a) => a.key === key);