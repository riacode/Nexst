// ============================================================================
// NEXST COLOR SYSTEM - Matches Website Colors
// ============================================================================

export const colors = {
  // Primary Colors (matching website)
  accent: '#00B39F',           // Primary teal
  accentBright: '#00E6CC',     // Brighter teal
  accentMint: '#7FFFD4',       // Mint green
  accentElectric: '#00FFFF',   // Electric blue
  
  // Semantic Colors
  primary: '#00B39F',          // Main brand color
  secondary: '#7FFFD4',        // Secondary actions
  highlight: '#00FFFF',        // Highlights and CTAs
  
  // Status Colors
  success: '#00B39F',          // Success states
  warning: '#FFA500',          // Warning states
  error: '#FF6B6B',            // Error states
  info: '#00FFFF',             // Information states
  
  // Background Colors
  background: '#FFFFFF',       // Main background
  surface: '#F8FAFC',          // Card backgrounds
  surfaceVariant: '#F1F5F9',   // Alternative surfaces
  
  // Text Colors
  text: '#1E293B',             // Primary text
  textSecondary: '#64748B',    // Secondary text
  textTertiary: '#94A3B8',     // Tertiary text
  
  // Border Colors
  border: '#E2E8F0',           // Default borders
  borderLight: '#F1F5F9',      // Light borders
  
  // Shadow Colors
  shadow: 'rgba(0, 179, 159, 0.1)',  // Brand-colored shadows
  shadowDark: 'rgba(0, 0, 0, 0.1)',  // Dark shadows
};

// ============================================================================
// GRADIENT PRESETS
// ============================================================================

export const gradients = {
  primary: ['#00B39F', '#7FFFD4'],           // Teal to mint
  secondary: ['#7FFFD4', '#00FFFF'],         // Mint to electric blue
  accent: ['#00B39F', '#00FFFF'],            // Teal to electric blue
  bright: ['#00E6CC', '#7FFFD4'],            // Bright teal to mint
  subtle: ['#00B39F', '#00B39F'],            // Solid teal
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const getPriorityColor = (priority: 'HIGH' | 'MEDIUM' | 'LOW') => {
  switch (priority) {
    case 'HIGH': return colors.accent;
    case 'MEDIUM': return colors.accentMint;
    case 'LOW': return colors.accentElectric;
    default: return colors.accent;
  }
};

export const getSeverityColor = (severity: 'mild' | 'moderate' | 'severe') => {
  switch (severity) {
    case 'mild': return colors.accentElectric;
    case 'moderate': return colors.accentMint;
    case 'severe': return colors.accent;
    default: return colors.accentElectric;
  }
};

export const getHealthDomainColor = (domain: string) => {
  const domainColors: { [key: string]: string } = {
    physical_injury: colors.accent,
    illness: colors.accentMint,
    mental_health: colors.accentElectric,
    weight_management: colors.accentBright,
    nutrition: colors.accentMint,
    sleep: colors.accentElectric,
    exercise: colors.accent,
    reproductive: colors.accentBright,
    chronic_conditions: colors.accent,
    medication: colors.accentMint,
    preventive: colors.accentElectric,
    general_wellness: colors.accent,
  };
  
  return domainColors[domain] || colors.accent;
}; 