import { ApplicationConfig, InjectionToken, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { FirebaseApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { initializeAppCheck, provideAppCheck, ReCaptchaV3Provider } from '@angular/fire/app-check';
import { GoogleAuthProvider, getAuth, provideAuth } from '@angular/fire/auth';
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
    provideAppCheck(() => {
      const app = inject(FirebaseApp);
      return initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(environment.recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
    }),
    provideAuth(() => {
      const app = inject(FirebaseApp);
      return getAuth(app);
    })
  ]
};
