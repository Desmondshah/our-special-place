import { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

type Location = {
  name: string;
  address: string;
  placeId: string;
  rating?: number;
  mapsUrl: string;
};

type PlacesSearchProps = {
  onPlaceSelect: (location: Location | null) => void;
};

export function PlacesSearch({ onPlaceSelect }: PlacesSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loader = new Loader({
      apiKey: 'AIzaSyBOwOGwPCTPY5MQ2RLdJxpuMsLqRxaU2GU',
      version: 'weekly',
      libraries: ['places']
    });

    loader.load().then(() => {
      if (!inputRef.current) return;

      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        fields: ['place_id', 'name', 'formatted_address', 'rating', 'url']
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (!place.place_id) {
          onPlaceSelect(null);
          return;
        }

        onPlaceSelect({
          name: place.name || '',
          address: place.formatted_address || '',
          placeId: place.place_id,
          rating: place.rating,
          mapsUrl: place.url || `https://www.google.com/maps/place/?q=place_id:${place.place_id}`
        });
      });
    });
  }, [onPlaceSelect]);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="Search for a location..."
      className="p-2 border border-pink-200 rounded w-full"
    />
  );
}