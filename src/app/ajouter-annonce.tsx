import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AuthRequired from '../components/AuthRequired';
import LocationPicker, { LatLng } from '../components/LocationPicker';
import ScreenHeader from '../components/ScreenHeader';
import { useAuth } from '../context/auth';
import { db } from '../firebaseConfig';
import { uploadImage } from '../services/cloudinary';

const PRIMARY = '#003B95';
const DARK = '#1A202C';
const GREY = '#718096';
const FIELD_BG = '#F5F7FB';
const ERROR = '#E53E3E';
const AMENITIES: { key: string; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
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
const TYPES: Record<string, string> = {
  appartement: 'Appartement',
  maison: 'Maison',
  villa: 'Villa',
  terrain: 'Terrain',
  local: 'Local commercial',
};

type Photo = { uri: string; width?: number };
type Errors = Partial<Record<'title' | 'price' | 'city' | 'desc' | 'phone', string>>;

const toNum = (s: string) => {
  const n = Number(s.trim().replace(/\s/g, '').replace(',', '.'));
  return Number.isNaN(n) ? 0 : n;
};

function Label({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

function FieldError({ text }: { text?: string }) {
  return text ? <Text style={styles.fieldError}>{text}</Text> : null;
}

export default function AjouterAnnonceScreen() {
  const { isLoggedIn, user } = useAuth();

  const [transaction, setTransaction] = useState<'location' | 'vente'>('location');
  const [type, setType] = useState('appartement');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [rooms, setRooms] = useState('');
  const [baths, setBaths] = useState('');
  const [surface, setSurface] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [location, setLocation] = useState<LatLng | null>(null);

  const [typeModal, setTypeModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});

  // Téléphone mel profil (kima Flutter _prefillPhone)
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'profiles', user.uid))
      .then((snap) => {
        const p = snap.data()?.phone;
        if (p) setPhone((t) => t || String(p));
      })
      .catch(() => {});
  }, [user]);

  const pickPhotos = async () => {
    if (photos.length >= 8) {
      Alert.alert('Photos', 'Maximum 8 photos.');
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 8 - photos.length,
        quality: 0.75,
      });
      if (result.canceled) return;
      const added = result.assets.map((a) => ({ uri: a.uri, width: a.width }));
      setPhotos((prev) => [...prev, ...added].slice(0, 8));
      setError(null);
    } catch {
      setError('Impossible d’ouvrir la galerie.');
    }
  };

  const fail = (message: string) => {
    setError(message);
    Alert.alert('Erreur', message);
  };

  const validate = () => {
    const errs: Errors = {};
    if (title.trim().length < 5) errs.title = 'Titre trop court';
    if (toNum(price) <= 0) errs.price = 'Entrez un prix valide';
    if (city.trim().length < 2) errs.city = 'Entrez la ville';
    if (desc.trim().length < 10) errs.desc = 'Décrivez un peu plus (10 caractères minimum)';
    if (!/^\d{8,12}$/.test(phone.replace(/[\s+]/g, ''))) errs.phone = 'Numéro invalide';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };


const submit = async () => {
  if (saving) return;

  if (!validate()) {
    fail('Vérifiez les champs en rouge.');
    return;
  }

  if (photos.length === 0) {
    fail('Ajoutez au moins une photo.');
    return;
  }

  if (!location) {
    fail('Placez l’épingle sur la carte.');
    return;
  }

  if (!user?.uid) {
    fail('Utilisateur non connecté. Reconnectez-vous.');
    return;
  }

  setSaving(true);
  setError(null);

  try {
    // 1. Upload des photos vers Cloudinary
    const imageUrls: string[] = [];

    for (const p of photos) {
      const imageUrl = await uploadImage(p.uri, p.width);
      imageUrls.push(imageUrl);
    }

    // 2. Vérifier que les photos sont bien uploadées
    if (imageUrls.length === 0) {
      throw new Error('Aucune photo uploadée.');
    }

    // 3. Préparer les données de l'annonce
    const listingData = {
      title: title.trim(),
      description: desc.trim(),
      type,
      transaction,
      price: toNum(price),
      rooms: Math.trunc(toNum(rooms)),
      bathrooms: Math.trunc(toNum(baths)),
      surface: toNum(surface),
      city: city.trim(),
      address: address.trim(),
      lat: location.latitude,
      lng: location.longitude,
      amenities: selected,
      imageUrls,

      // IMPORTANT : UID du propriétaire
      ownerId: user.uid,
      ownerName: user.displayName ?? '',
      ownerPhone: phone.trim(),

      status: 'active',
      createdAt: serverTimestamp(),
    };

    // 4. Enregistrer dans Firestore
    const docRef = await addDoc(
      collection(db, 'listings'),
      listingData
    );

    console.log('ANNONCE ENREGISTREE:', docRef.id);
    console.log('OWNER UID:', user.uid);

    // 5. Redirection vers Mes annonces
    Alert.alert(
      'Annonce publiée ✅',
      'Votre annonce a été publiée avec succès.',
      [
        {
          text: 'OK',
          onPress: () => router.replace('/mes-annonces'),
        },
      ]
    );

  } catch (e: any) {
    console.log('PUBLISH ERROR:', e?.code, e?.message, e);

    let message = 'Une erreur est survenue.';

    if (e?.code === 'permission-denied') {
      message =
        'Firebase refuse l’enregistrement. Vérifiez les règles Firestore.';
    } else if (e?.name === 'AbortError') {
      message = 'Délai dépassé pendant le téléchargement.';
    } else if (e?.message) {
      message = e.message;
    }

    setError(message);
    Alert.alert('Erreur de publication', message);

  } finally {
    setSaving(false);
  }
};


  const toggleAmenity = (key: string) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Publier une annonce" fallback="/" />
        <AuthRequired
          title="Publier une annonce"
          heading="Connectez-vous pour publier votre bien."
          description="Publiez gratuitement et recevez des offres rapidement."
          showRegister
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Publier une annonce" fallback="/" />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photos */}
          <Label>Photos (1 à 8)</Label>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 96 }}>
            <TouchableOpacity
              style={styles.addPhoto}
              activeOpacity={0.8}
              onPress={pickPhotos}
              disabled={saving}
            >
              <MaterialIcons name="add-a-photo" size={24} color={PRIMARY} />
              <Text style={styles.addPhotoText}>Ajouter</Text>
            </TouchableOpacity>

            {photos.map((p, i) => (
              <View key={p.uri + i} style={styles.thumbWrap}>
                <Image source={{ uri: p.uri }} style={styles.thumb} />
                <TouchableOpacity
                  style={styles.thumbClose}
                  onPress={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                  hitSlop={6}
                >
                  <Ionicons name="close" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {/* Type d’annonce */}
          <Label>Type d’annonce</Label>
          <View style={styles.pills}>
            {(['location', 'vente'] as const).map((t) => {
              const active = transaction === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.pill, active && styles.pillActive]}
                  activeOpacity={0.85}
                  onPress={() => setTransaction(t)}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>
                    {t === 'location' ? 'Location' : 'Vente'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Titre */}
          <Label>Titre</Label>
          <TextInput
            style={[styles.input, !!errors.title && styles.inputError]}
            placeholder="Appartement S+2 · La Marsa"
            placeholderTextColor="#9AA3B2"
            value={title}
            onChangeText={setTitle}
          />
          <FieldError text={errors.title} />

          {/* Type de bien */}
          <Label>Type de bien</Label>
          <TouchableOpacity style={[styles.input, styles.select]} activeOpacity={0.8} onPress={() => setTypeModal(true)}>
            <Text style={styles.selectText}>{TYPES[type]}</Text>
            <Ionicons name="caret-down" size={16} color={GREY} />
          </TouchableOpacity>

          {/* Prix */}
          <Label>{transaction === 'location' ? 'Prix par mois (DT)' : 'Prix (DT)'}</Label>
          <TextInput
            style={[styles.input, !!errors.price && styles.inputError]}
            placeholder="500"
            placeholderTextColor="#9AA3B2"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />
          <FieldError text={errors.price} />

          {/* Chambres / SdB / Surface */}
          <View style={styles.threeCols}>
            <View style={{ flex: 1 }}>
              <Label>Chambres</Label>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#9AA3B2"
                keyboardType="numeric"
                value={rooms}
                onChangeText={setRooms}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Label>Salles de bain</Label>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#9AA3B2"
                keyboardType="numeric"
                value={baths}
                onChangeText={setBaths}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Label>Surface m²</Label>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#9AA3B2"
                keyboardType="numeric"
                value={surface}
                onChangeText={setSurface}
              />
            </View>
          </View>

          {/* Ville / Adresse */}
          <Label>Ville / région</Label>
          <TextInput
            style={[styles.input, !!errors.city && styles.inputError]}
            placeholder="La Marsa, Tunis"
            placeholderTextColor="#9AA3B2"
            value={city}
            onChangeText={setCity}
          />
          <FieldError text={errors.city} />

          <Label>Adresse (optionnel)</Label>
          <TextInput
            style={styles.input}
            placeholder="Rue, quartier..."
            placeholderTextColor="#9AA3B2"
            value={address}
            onChangeText={setAddress}
          />

          {/* Description */}
          <Label>Description</Label>
          <TextInput
            style={[styles.input, styles.textArea, !!errors.desc && styles.inputError]}
            placeholder="Décrivez le bien, les équipements..."
            placeholderTextColor="#9AA3B2"
            value={desc}
            onChangeText={setDesc}
            multiline
            textAlignVertical="top"
          />
          <FieldError text={errors.desc} />

          {/* Équipements */}
          <Label>Équipements</Label>
          <View style={styles.amenities}>
            {AMENITIES.map((a) => {
              const on = selected.includes(a.key);
              return (
                <TouchableOpacity
                  key={a.key}
                  style={[styles.amenity, on && styles.amenityOn]}
                  activeOpacity={0.8}
                  onPress={() => toggleAmenity(a.key)}
                >
                  <MaterialIcons name={a.icon} size={18} color={PRIMARY} />
                  <Text style={styles.amenityText}>{a.label}</Text>
                  {on && <Ionicons name="checkmark" size={16} color={PRIMARY} style={{ marginLeft: 4 }} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Carte */}
          <Label>Localisation sur la carte</Label>
          <LocationPicker value={location} onChange={setLocation} />

          {/* Téléphone */}
          <Label>Téléphone de contact</Label>
          <View style={[styles.input, styles.phoneRow, !!errors.phone && styles.inputError]}>
            <Ionicons name="call-outline" size={20} color={GREY} />
            <TextInput
              style={styles.phoneInput}
              placeholder="+216 20 123 456"
              placeholderTextColor="#9AA3B2"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>
          <FieldError text={errors.phone} />

          {!!error && <Text style={styles.globalError}>{error}</Text>}

          <TouchableOpacity
            style={[styles.publishBtn, saving && { opacity: 0.8 }]}
            activeOpacity={0.85}
            onPress={submit}
            disabled={saving}
          >
            {saving ? (
              <View style={styles.savingRow}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.publishText}>Publication en cours...</Text>
              </View>
            ) : (
              <Text style={styles.publishText}>Publier</Text>
            )}
          </TouchableOpacity>
          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Choix du type de bien */}
      <Modal visible={typeModal} transparent animationType="fade" onRequestClose={() => setTypeModal(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setTypeModal(false)}>
          <View style={styles.sheet}>
            {Object.entries(TYPES).map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={styles.sheetItem}
                onPress={() => {
                  setType(key);
                  setTypeModal(false);
                }}
              >
                <Text style={[styles.sheetText, key === type && { color: PRIMARY, fontWeight: '700' }]}>
                  {label}
                </Text>
                {key === type && <Ionicons name="checkmark" size={20} color={PRIMARY} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { padding: 20 },

  label: { fontSize: 14, fontWeight: '600', color: DARK, marginTop: 20, marginBottom: 6 },
  fieldError: { color: ERROR, fontSize: 12, marginTop: 4 },
  globalError: { color: ERROR, marginTop: 12 },

  input: {
    backgroundColor: FIELD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 18,
    height: 56,
    fontSize: 16,
    color: DARK,
  },
  inputError: { borderColor: ERROR },
  textArea: { height: 130, paddingTop: 16 },
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectText: { fontSize: 16, color: DARK },
  phoneRow: { flexDirection: 'row', alignItems: 'center' },
  phoneInput: { flex: 1, fontSize: 16, color: DARK, marginLeft: 12 },
  threeCols: { flexDirection: 'row', gap: 10 },

  addPhoto: {
    width: 96,
    height: 96,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PRIMARY,
    backgroundColor: FIELD_BG,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  addPhotoText: { color: PRIMARY, fontSize: 12, marginTop: 4 },
  thumbWrap: { width: 96, height: 96, marginRight: 10 },
  thumb: { width: 96, height: 96, borderRadius: 16 },
  thumbClose: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  pills: { flexDirection: 'row', gap: 10 },
  pill: {
    flex: 1,
    height: 48,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  pillText: { fontSize: 15, fontWeight: '600', color: GREY },
  pillTextActive: { color: '#FFFFFF' },

  amenities: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  amenity: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D5DAE5',
    backgroundColor: '#F8F9FE',
  },
  amenityOn: { backgroundColor: 'rgba(11,60,140,0.12)', borderColor: PRIMARY },
  amenityText: { fontSize: 14, color: DARK, marginLeft: 8 },

  publishBtn: {
    backgroundColor: PRIMARY,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  savingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  publishText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 32 },
  sheet: { backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 8 },
  sheetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  sheetText: { fontSize: 16, color: DARK },
});