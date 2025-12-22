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
          return from(this.profileService.needsRegistration(user)).pipe(
            map((needsRegistration) => ({ user, needsRegistration }))
          );
        })
      )
      .subscribe((result) => {
        if (!result) return;
        if (result.needsRegistration && this.router.url !== '/register') {
          this.router.navigateByUrl('/register');
        }
      });
  }

  authForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  signInWithGoogle() {
    this.authError.set(null);
    signInWithPopup(this.auth, this.googleProvider).catch((error) => this.handleError(error));
  }

  registerNewUser() {
    this.authError.set(null);
    this.router.navigateByUrl('/register');
  }

  signInWithEmail() {
    this.authError.set(null);
    const { email, password } = this.authForm.getRawValue();
    if (!email || !password) return;
    signInWithEmailAndPassword(this.auth, email, password).catch((error) =>
      this.handleError(error)
    );
  }

  signOutUser() {
    signOut(this.auth);
  }

  private handleError(error: FirebaseError) {
    this.authError.set(error.message);
    console.error(error);
  }
}
