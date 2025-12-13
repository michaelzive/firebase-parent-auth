import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Auth,
  signInWithPopup,
  signOut,
  authState,
  User,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from '@angular/fire/auth';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { GOOGLE_AUTH_PROVIDER } from '../../app.config';
import { FirebaseError } from 'firebase/app';

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

  public user$: Observable<User | null> = authState(this.auth);
  public authError = signal<string | null>(null);

  authForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  signInWithGoogle() {
    this.authError.set(null);
    signInWithPopup(this.auth, this.googleProvider).catch((error) => this.handleError(error));
  }

  signUpWithEmail() {
    this.authError.set(null);
    const { email, password } = this.authForm.getRawValue();
    if (!email || !password) return;
    createUserWithEmailAndPassword(this.auth, email, password).catch((error) =>
      this.handleError(error)
    );
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
