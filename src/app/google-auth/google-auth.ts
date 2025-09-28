import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, authState, User } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-google-auth',
  templateUrl: './google-auth.html',
  styleUrls: ['./google-auth.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class GoogleAuthComponent {
  private auth = inject(Auth);
  public user$: Observable<User | null> = authState(this.auth);

  signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
    signInWithPopup(this.auth, provider)
      .catch((error) => {
        console.error(error);
      });
  }

  signOutUser() {
    signOut(this.auth);
  }
}
