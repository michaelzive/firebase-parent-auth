import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth, signInWithPopup, signOut, authState, User, GoogleAuthProvider } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { GOOGLE_AUTH_PROVIDER } from '../../app.config';

@Component({
  selector: 'app-google-auth',
  templateUrl: './google-auth.html',
  styleUrls: ['./google-auth.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class GoogleAuthComponent {
  private auth = inject(Auth);
  private googleProvider = inject(GOOGLE_AUTH_PROVIDER);
  public user$: Observable<User | null> = authState(this.auth);

  signInWithGoogle() {
    signInWithPopup(this.auth, this.googleProvider)
      .catch((error) => {
        console.error(error);
      });
  }

  signOutUser() {
    signOut(this.auth);
  }
}
