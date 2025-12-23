import { ApplicationConfig, InjectionToken, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { FirebaseApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { initializeAppCheck, provideAppCheck, ReCaptchaV3Provider } from '@angular/fire/app-check';
import { GoogleAuthProvider, connectAuthEmulator, getAuth, provideAuth } from '@angular/fire/auth';
import { connectFirestoreEmulator, getFirestore, provideFirestore } from '@angular/fire/firestore';
import { connectFunctionsEmulator, getFunctions, provideFunctions } from '@angular/fire/functions';
import { environment } from '../environments/environment';
import { routes } from './app.routes';

export const GOOGLE_AUTH_PROVIDER = new InjectionToken<GoogleAuthProvider>('google-auth-provider', {
  providedIn: 'root',
  factory: () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
    return provider;
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    ...(environment.production
      ? [
          provideAppCheck(() => {
            const app = inject(FirebaseApp);
            return initializeAppCheck(app, {
              provider: new ReCaptchaV3Provider(environment.recaptchaSiteKey),
              isTokenAutoRefreshEnabled: true,
            });
          }),
        ]
      : []),
    provideAuth(() => {
      const app = inject(FirebaseApp);
      const auth = getAuth(app);
      if (!environment.production && environment.useEmulators && environment.emulators?.auth) {
        const { host, port } = environment.emulators.auth;
        connectAuthEmulator(auth, `http://${host}:${port}`, { disableWarnings: true });
      }
      return auth;
    }),
    provideFirestore(() => {
      const app = inject(FirebaseApp);
      const firestore = getFirestore(app);
      if (!environment.production && environment.useEmulators && environment.emulators?.firestore) {
        const { host, port } = environment.emulators.firestore;
        connectFirestoreEmulator(firestore, host, port);
      }
      return firestore;
    }),
    provideFunctions(() => {
      const app = inject(FirebaseApp);
      const functions = getFunctions(app);
      if (!environment.production && environment.useEmulators && environment.emulators?.functions) {
        const { host, port } = environment.emulators.functions;
        connectFunctionsEmulator(functions, host, port);
      }
      return functions;
    }),
  ]
};
