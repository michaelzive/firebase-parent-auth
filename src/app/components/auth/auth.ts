import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Auth,
  signInWithPopup,
  signOut,
  authState,
  User,
  signInWithEmailAndPassword,
} from '@angular/fire/auth';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, from, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { GOOGLE_AUTH_PROVIDER } from '../../app.config';
import { FirebaseError } from 'firebase/app';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.html',
  styleUrls: ['./auth.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
})
export class AuthComponent {
  private auth = inject(Auth);
  private googleProvider = inject(GOOGLE_AUTH_PROVIDER);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private profileService = inject(ProfileService);
  private destroyRef = inject(DestroyRef);

  public user$: Observable<User | null> = authState(this.auth);
  public authError = signal<string | null>(null);

  constructor() {
    authState(this.auth)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((user) => {
          if (!user) return of(null);
          return from(this.profileService.getApprovalStatus(user)).pipe(
            map((approvalStatus) => ({ user, approvalStatus }))
          );
        })
      )
      .subscribe((result) => {
        if (!result) return;
        const { approvalStatus } = result;
        if (approvalStatus.status === 'approved') return;
        if (approvalStatus.status === 'pending' || approvalStatus.status === 'rejected') {
          if (this.router.url !== '/pending-approval') {
            this.router.navigateByUrl('/pending-approval');
          }
          return;
        }
        if (this.router.url !== '/register') {
          this.router.navigateByUrl('/register');
        }
      });
  }

  authForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async signInWithGoogle() {
    this.authError.set(null);
    try {
      const cred = await signInWithPopup(this.auth, this.googleProvider);
      await this.handlePostLoginApproval(cred.user);
    } catch (error) {
      this.handleError(error as FirebaseError);
    }
  }

  registerNewUser() {
    this.authError.set(null);
    this.router.navigateByUrl('/register');
  }

  async signInWithEmail() {
    this.authError.set(null);
    const { email, password } = this.authForm.getRawValue();
    if (!email || !password) return;
    try {
      const cred = await signInWithEmailAndPassword(this.auth, email, password);
      await this.handlePostLoginApproval(cred.user);
    } catch (error) {
      this.handleError(error as FirebaseError);
    }
  }

  signOutUser() {
    signOut(this.auth);
  }

  private handleError(error: FirebaseError) {
    this.authError.set(error.message);
    console.error(error);
  }

  private async handlePostLoginApproval(user: User) {
    const status = await this.profileService.getApprovalStatus(user);
    if (status.approved) return;

    if (status.status === 'pending') {
      this.authError.set('Your account is awaiting approval.');
      this.router.navigateByUrl('/pending-approval');
      return;
    }

    if (status.status === 'rejected') {
      this.authError.set('Your account was rejected. Please contact support.');
      this.router.navigateByUrl('/pending-approval');
      return;
    }

    this.router.navigateByUrl('/register');
  }
}
