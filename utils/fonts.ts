import { Platform } from 'react-native';

export const fonts = {
  // Single font for entire app - Inter is modern and professional
  primary: Platform.select({
    ios: 'Inter',
    android: 'Inter',
  }),
};

export const fontWeights = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

// Font styles for consistent usage across the app
export const fontStyles = {
  // Large headings
  h1: {
    fontFamily: fonts.primary,
    fontSize: 32,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.5,
  },
  
  // Medium headings
  h2: {
    fontFamily: fonts.primary,
    fontSize: 24,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.3,
  },
  
  // Small headings
  h3: {
    fontFamily: fonts.primary,
    fontSize: 20,
    fontWeight: fontWeights.semibold,
    letterSpacing: -0.2,
  },
  
  // Body text
  body: {
    fontFamily: fonts.primary,
    fontSize: 16,
    fontWeight: fontWeights.regular,
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  
  // Body text - medium weight
  bodyMedium: {
    fontFamily: fonts.primary,
    fontSize: 16,
    fontWeight: fontWeights.medium,
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  
  // Small text
  caption: {
    fontFamily: fonts.primary,
    fontSize: 14,
    fontWeight: fontWeights.regular,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  
  // Small text - medium weight
  captionMedium: {
    fontFamily: fonts.primary,
    fontSize: 14,
    fontWeight: fontWeights.medium,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  
  // Extra small text
  small: {
    fontFamily: fonts.primary,
    fontSize: 12,
    fontWeight: fontWeights.regular,
    lineHeight: 16,
    letterSpacing: -0.1,
  },
  
  // Button text
  button: {
    fontFamily: fonts.primary,
    fontSize: 16,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.1,
  },
  
  // Tab bar text
  tab: {
    fontFamily: fonts.primary,
    fontSize: 12,
    fontWeight: fontWeights.medium,
    letterSpacing: 0,
  },
}; 