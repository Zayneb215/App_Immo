import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '../firebaseConfig';
import { byDateDesc, Listing, listingFromDoc } from '../utils/listing';

// = listingsProvider mta3 Flutter: kol les annonces, live (ki tزid annonce tban direct)
export function useListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'listings'),
      (snap) => {
        setListings(snap.docs.map((d) => listingFromDoc(d)).sort(byDateDesc));
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.log('LISTINGS ERROR', err?.code, err?.message);
        setError(err?.message ?? 'Erreur');
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  return { listings, loading, error };
}