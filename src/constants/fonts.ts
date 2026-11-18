/**
 * Font files for expo-font, keyed by the names in `fontFamily` (theme.ts).
 * Loaded once by app/_layout.tsx. Kept out of theme.ts so that tests and
 * utilities importing the tokens never pull in font assets.
 */
import { Archivo_600SemiBold, Archivo_700Bold } from '@expo-google-fonts/archivo';
import { ArchivoNarrow_700Bold } from '@expo-google-fonts/archivo-narrow';
import { fontFamily } from './theme';

export const FONT_SOURCES = {
  [fontFamily.heading]:     Archivo_600SemiBold,
  [fontFamily.headingBold]: Archivo_700Bold,
  [fontFamily.numeral]:     ArchivoNarrow_700Bold,
} as const;
