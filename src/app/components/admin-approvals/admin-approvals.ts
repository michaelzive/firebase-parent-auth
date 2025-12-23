import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, collectionData, query, where } from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Observable } from 'rxjs';

interface PendingRow {
  uid: string;
  email: string | null;
  role: string;
  payload: Record<string, unknown>;
  createdAt?: unknown;
  provider?: string;
}

@Component({
  selector: 'app-admin-approvals',
  standalone: true,
  templateUrl: './admin-approvals.html',
  styleUrls: ['./admin-approvals.css'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminApprovalsComponent {
  private firestore = inject(Firestore);
  private functions = inject(Functions);

  pending$: Observable<PendingRow[]> = collectionData(
    query(collection(this.firestore, 'pendingRegistrations'), where('status', '==', 'pending')),
    { idField: 'uid' }
  ) as Observable<PendingRow[]>;

  busyFor = signal<string | null>(null);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  async approve(uid: string) {
    this.error.set(null);
    this.success.set(null);
    this.busyFor.set(uid);
    try {
      const callable = httpsCallable(this.functions, 'approveRegistration');
      await callable({ uid });
      this.success.set('Approved user successfully.');
    } catch (err) {
      console.error(err);
      this.error.set('Unable to approve right now.');
    } finally {
      this.busyFor.set(null);
    }
  }

  async reject(uid: string) {
    this.error.set(null);
    this.success.set(null);
    const reason = window.prompt('Enter a rejection reason');
    if (!reason) return;
    this.busyFor.set(uid);
    try {
      const callable = httpsCallable(this.functions, 'rejectRegistration');
      await callable({ uid, reason });
      this.success.set('Rejected registration.');
    } catch (err) {
      console.error(err);
      this.error.set('Unable to reject right now.');
    } finally {
      this.busyFor.set(null);
    }
  }
}
