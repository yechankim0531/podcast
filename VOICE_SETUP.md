# Voice Recognition Setup

## ⚠️ Important: Custom Dev Client Required

`@react-native-voice/voice` requires native modules and **will NOT work with Expo Go**.

You need to create a **custom development build**:

### Option 1: Use EAS Build (Recommended)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build development client
eas build --profile development --platform ios
# or
eas build --profile development --platform android
```

### Option 2: Local Development Build
```bash
# Install expo-dev-client
npx expo install expo-dev-client

# For iOS (Mac only)
npx expo run:ios

# For Android
npx expo run:android
```

## 📱 Permissions

Permissions are already configured in `app.json`:
- iOS: `NSMicrophoneUsageDescription`
- Android: `RECORD_AUDIO`

The app will prompt for microphone permission on first use.

## 🧪 Testing

1. Build custom dev client (see above)
2. Install on device/simulator
3. Open player screen
4. Tap microphone button
5. Grant microphone permission when prompted
6. Speak - text should appear below button
7. Check console for logs

## 🐛 Troubleshooting

**If voice recognition doesn't work:**
1. Make sure you're using custom dev client (not Expo Go)
2. Check microphone permissions in device settings
3. Check console logs for errors
4. Verify package is installed: `npm list @react-native-voice/voice`

## 📝 Current Implementation

- ✅ Microphone button in player screen
- ✅ Start/Stop listening
- ✅ Real-time transcription display
- ✅ Error handling
- ✅ Console logging for debugging

The transcribed text appears on the player screen below the microphone button.
