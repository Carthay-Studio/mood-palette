import type { Palette } from '../types';

export const encodePalette = (palette: Palette): string => {
  try {
    const jsonString = JSON.stringify(palette);
    return btoa(jsonString);
  } catch (e) {
    console.error("Failed to encode palette", e);
    return "";
  }
};

export const decodePalette = (encoded: string): Palette | null => {
  try {
    const jsonString = atob(encoded);
    return JSON.parse(jsonString) as Palette;
  } catch (e) {
    console.error("Failed to decode palette", e);
    return null;
  }
};
