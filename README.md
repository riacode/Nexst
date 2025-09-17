# Nexst

A comprehensive health companion app that helps users track symptoms and get AI-powered personalized health guidance and doctor-ready questions.

## Project Structure

This workspace contains **two separate subprojects**:

### React Native App (Mobile App) - Nexst
- **Location**: Root directory (all files except `website/` and `vercel.json`)
- **Purpose**: The actual mobile app built with Expo/React Native
- **Key Files**:
  - `App.tsx` - Main app component
  - `app.json` - Expo configuration
  - `package.json` - React Native dependencies
  - `components/` - React Native components
  - `screens/` - App screens
  - `utils/` - App utilities (including AI integration)
  - `assets/` - App assets (icons, images for the mobile app)

### Static Website (Informational Site) - nexst.app
- **Location**: `website/` directory
- **Purpose**: Informational website about the app (marketing site)
- **Key Files**:
  - `website/index.html` - Main website page
  - `website/website_icon.png` - Website logo and favicon
- **Deployment**: Served by Vercel via `vercel.json` configuration

## Development

### For the Mobile App via Expo:
```bash
npm start          # Start Expo development server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
```

### For the Website:
The website is automatically deployed to Vercel when you push to the main branch.

## Deployment

- **Mobile App**: Deploy to TestFlight/App Store using EAS Build
- **Website**: Automatically deployed to Vercel via `vercel.json` configuration

## License

Private - All rights reserved 