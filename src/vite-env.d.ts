/// <reference types="vite/client" />

declare global {
  interface Window {
    google: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            options?: {
              fields: string[];
            }
          ) => google.maps.places.Autocomplete;
        };
      };
    };
  }
}

export {};
