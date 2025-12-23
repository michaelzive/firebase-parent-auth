import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth, authState } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { ProfileService } from '../../services/profile.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-pending-approval',
  standalone: true,
  templateUrl: './pending-approval.html',
  styleUrls: ['./pending-approval.css'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingApprovalComponent {
  private auth = inject(Auth);
  private profileService = inject(ProfileService);
  private router = inject(Router);

  isLoading = signal(true);
  status = signal<'pending' | 'rejected' | 'unknown'>('pending');
  rejectionReason = signal<string | null>(null);
  escalationRequested = signal(false);
  escalationRequestedAt = signal<Date | null>(null);
  error = signal<string | null>(null);

  constructor() {
    authState(this.auth)
      .pipe(take(1))
      .subscribe(async (user) => {
        try {
          if (!user) {
            this.status.set('unknown');
            this.error.set('Please sign in to view your approval status.');
            this.isLoading.set(false);
            return;
          }
          const approval = await this.profileService.getApprovalStatus(user);
          if (approval.status === 'rejected') {
            this.status.set('rejected');
            this.rejectionReason.set(approval.rejectionReason ?? 'No reason provided.');
          } else if (approval.status === 'pending') {
            this.status.set('pending');
            this.rejectionReason.set(null);
          } else if (approval.status === 'approved') {
            // If already approved, send the user back to the main flow.
            this.router.navigateByUrl('/');
            return;
          } else {
            this.status.set('unknown');
          }
        } finally {
          this.isLoading.set(false);
        }
      });
  }

  async requestEscalation() {
    this.error.set(null);
    try {
      const user = this.auth.currentUser;
      if (!user) {
        this.error.set('Please sign in to request escalation.');
        return;
      }
      await this.profileService.requestEscalation(user);
      this.escalationRequested.set(true);
      this.escalationRequestedAt.set(new Date());
    } catch (err) {
      console.error(err);
      this.error.set('Unable to request escalation right now. Please try again later.');
    }
  }

  goToSignIn() {
    this.router.navigateByUrl('/');
  }
}
