# Nexst - Your AI Health Companion

A React Native app that helps you manage your health through voice symptom tracking, personalized recommendations, and appointment preparation.

## Features

- 🎤 **Voice Symptom Tracking** - Record symptoms in 30 seconds
- 💡 **Personalized Action Items** - Get immediate recommended next steps
- 📅 **Appointment Prep** - Walk into appointments with tailored questions and symptom history

## Development

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- React Native development environment

### Installation
```bash
npm install
```

### Running the App
```bash
npm start
```

## Deployment

### Landing Page Website (nexst.app)

The website is a **static landing page** that showcases the Nexst mobile app and provides download links to app stores. It's deployed using Vercel and connected to the domain `nexst.app`.

#### What the website does:
- Introduces the Nexst app and its features
- Provides download links to App Store and Google Play Store
- Serves as a marketing/information page for potential users

#### Deployment Steps:
1. **Connect to Vercel:**
   - Install Vercel CLI: `npm i -g vercel`
   - Login: `vercel login`
   - Deploy: `vercel --prod`

2. **Domain Configuration:**
   - In Vercel dashboard, go to your project settings
   - Add custom domain: `nexst.app`
   - Update DNS records in Namecheap (see DNS Configuration below)

#### DNS Configuration (Namecheap):
Add these records in your Namecheap DNS settings:

```
Type: A
Name: @
Value: 76.76.19.19

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Mobile App Deployment

The React Native app will be deployed to:
- **iOS App Store** via Expo or React Native CLI
- **Google Play Store** via Expo or React Native CLI

Once the app is published, update the download links in `index.html` with the actual app store URLs.

## Project Structure

```
Nexst/
├── screens/           # App screens
├── components/        # Reusable components
├── contexts/          # React contexts
├── utils/            # Utility functions
├── types/            # TypeScript type definitions
├── index.html        # Website landing page
└── vercel.json       # Vercel deployment config
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

Private - All rights reserved 