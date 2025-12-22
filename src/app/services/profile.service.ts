import { Injectable, inject } from '@angular/core';
import { Auth, User, authState } from '@angular/fire/auth';
import { doc, Firestore, getDoc, serverTimestamp, setDoc } from '@angular/fire/firestore';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';

export interface RegistrationRecord {
  uid?: string;
  email?: string | null;
  registrationCompleted?: boolean;
  registrationCompletedAt?: unknown;
  registrationPayload?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  async needsRegistration(user?: User | null): Promise<boolean> {
    try {
      const resolvedUser = user ?? (await this.resolveUser());
      if (!resolvedUser) return false;

      const snapshot = await getDoc(doc(this.firestore, 'users', resolvedUser.uid));
      if (!snapshot.exists()) return true;

      const data = snapshot.data() as RegistrationRecord;
      return data.registrationCompleted !== true;
    } catch (error) {
      console.error('Registration check failed', error);
      return false;
    }
  }

  async isRegistrationComplete(user?: User | null): Promise<boolean> {
    return !(await this.needsRegistration(user));
  }

  async markRegistrationComplete(user: User, payload: Record<string, unknown>): Promise<void> {
    const ref = doc(this.firestore, 'users', user.uid);
    await setDoc(
      ref,
      {
        uid: user.uid,
        email: user.email ?? null,
        registrationCompleted: true,
        registrationCompletedAt: serverTimestamp(),
        registrationPayload: payload,
      },
      { merge: true }
    );
  }

  async currentUser(): Promise<User | null> {
    return this.resolveUser();
  }

  private async resolveUser(): Promise<User | null> {
    try {
      if (this.auth.currentUser) return this.auth.currentUser;
      return await firstValueFrom(authState(this.auth).pipe(take(1)));
    } catch {
      return null;
    }
  }
}
