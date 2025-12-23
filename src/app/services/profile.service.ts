import { Injectable, inject } from '@angular/core';
import { Auth, User, authState, getIdTokenResult } from '@angular/fire/auth';
import {
  doc,
  Firestore,
  getDoc,
  serverTimestamp,
  setDoc,
  DocumentReference,
  updateDoc,
} from '@angular/fire/firestore';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';

export type RegistrationRole = 'parent' | 'teacher';

export interface RegistrationRecord {
  uid?: string;
  email?: string | null;
  registrationCompleted?: boolean;
  registrationCompletedAt?: unknown;
  registrationPayload?: Record<string, unknown>;
  approved?: boolean;
  approvedAt?: unknown;
  role?: RegistrationRole;
}

export interface PendingRegistration {
  uid: string;
  email: string | null;
  role: RegistrationRole;
  status: 'pending' | 'approved' | 'rejected';
  payload: Record<string, unknown>;
  rejectionReason?: string | null;
  escalationRequestedAt?: unknown;
  createdAt?: unknown;
  provider?: string;
}

export interface ApprovalStatus {
  approved: boolean;
  status: 'approved' | 'pending' | 'rejected' | 'none';
  rejectionReason?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  async submitPendingRegistration(
    user: User,
    role: RegistrationRole,
    payload: Record<string, unknown>,
    provider?: string
  ): Promise<void> {
    const ref = doc(this.firestore, 'pendingRegistrations', user.uid) as DocumentReference<PendingRegistration>;
    await setDoc(ref, {
      uid: user.uid,
      email: user.email ?? null,
      role,
      payload,
      provider: provider ?? 'password',
      status: 'pending',
      rejectionReason: null,
      createdAt: serverTimestamp(),
      escalationRequestedAt: null,
    });
  }

  async needsRegistration(user?: User | null): Promise<boolean> {
    try {
      const resolvedUser = user ?? (await this.resolveUser());
      if (!resolvedUser) return false;

      const pendingSnapshot = await getDoc(doc(this.firestore, 'pendingRegistrations', resolvedUser.uid));
      if (pendingSnapshot.exists()) return false;

      const approvedSnapshot = await getDoc(doc(this.firestore, 'users', resolvedUser.uid));
      if (!approvedSnapshot.exists()) return true;

      const data = approvedSnapshot.data() as RegistrationRecord;
      return data.registrationCompleted !== true;
    } catch (error) {
      console.error('Registration check failed', error);
      return false;
    }
  }

  async isRegistrationComplete(user?: User | null): Promise<boolean> {
    const resolvedUser = user ?? (await this.resolveUser());
    if (!resolvedUser) return false;
    const status = await this.getApprovalStatus(resolvedUser);
    return status.approved;
  }

  async getApprovalStatus(user: User): Promise<ApprovalStatus> {
    try {
      const token = await getIdTokenResult(user, true);
      const approvedClaim = token.claims['approved'] === true;
      if (approvedClaim) {
        return { approved: true, status: 'approved' };
      }

      const pendingSnapshot = await getDoc(doc(this.firestore, 'pendingRegistrations', user.uid));
      if (pendingSnapshot.exists()) {
        const data = pendingSnapshot.data() as PendingRegistration;
        if (data.status === 'rejected') {
          return { approved: false, status: 'rejected', rejectionReason: data.rejectionReason ?? null };
        }
        return { approved: false, status: 'pending', rejectionReason: data.rejectionReason ?? null };
      }

      const approvedSnapshot = await getDoc(doc(this.firestore, 'users', user.uid));
      if (approvedSnapshot.exists()) {
        const data = approvedSnapshot.data() as RegistrationRecord;
        if (data.approved === true) return { approved: true, status: 'approved' };
      }

      return { approved: false, status: 'none' };
    } catch (error) {
      console.error('Approval status check failed', error);
      return { approved: false, status: 'none' };
    }
  }

  async requestEscalation(user: User): Promise<void> {
    const ref = doc(this.firestore, 'pendingRegistrations', user.uid);
    await updateDoc(ref, {
      escalationRequestedAt: serverTimestamp(),
    });
  }

  async markRegistrationApproved(user: User, payload: Record<string, unknown>, role: RegistrationRole) {
    const ref = doc(this.firestore, 'users', user.uid);
    await setDoc(
      ref,
      {
        uid: user.uid,
        email: user.email ?? null,
        registrationCompleted: true,
        registrationCompletedAt: serverTimestamp(),
        registrationPayload: payload,
        approved: true,
        approvedAt: serverTimestamp(),
        role,
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
