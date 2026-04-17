

## Get started

### Get started with Android Studio

- Connect to the repo in Android Studio (Git > Clone) using:
  `https://github.com/uvaCS4720/final-project-msw3jg-fkb5cz.git`
- Run `npm install`.
- Run `npx expo start`.
- Open Device Manager in Android Studio and start your Android emulator/device.
- In terminal, press `a` to launch the app on Android.
- Expo Go should be automatically installed on the emulator/device; it should open and launch the application. Wait for the project to load. May take some time. 

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

### Pages for Project Beta

- Login page is shown when the app opens.
- Create account page is connected to Firebase.
- Once logged in, there is currently one podcast available to view.
- On that page, select the user icon in the top-right corner to view your profile.
- If you click the podcast, you go to the podcast episodes page.
- If you click an episode, you can play that episode.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
