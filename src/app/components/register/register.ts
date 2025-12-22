import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithPopup,
  User,
} from '@angular/fire/auth';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { FirebaseError } from 'firebase/app';
import { GOOGLE_AUTH_PROVIDER } from '../../app.config';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
})
export class RegisterComponent {
  private auth = inject(Auth);
  private fb = inject(FormBuilder);
  private googleProvider = inject(GOOGLE_AUTH_PROVIDER);
  private profileService = inject(ProfileService);

  mode = signal<'parent' | 'teacher'>('parent');
  authError = signal<string | null>(null);
  isSubmitting = signal(false);
  submittedUser = signal<User | null>(null);

  gradeOptions = Array.from({ length: 8 }, (_, i) => i);

  private atLeastOne: ValidatorFn = (control) => {
    const value = control.value as unknown[] | null;
    return value && value.length > 0 ? null : { required: true };
  };

  parentForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    idNumber: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    children: this.fb.array([this.createChildGroup()]),
  });

  teacherForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    gradesTaught: this.fb.control<number[]>([], { validators: [this.atLeastOne], nonNullable: true }),
  });

  childrenArray = computed(() => this.parentForm.get('children') as FormArray);

  setMode(mode: 'parent' | 'teacher') {
    this.mode.set(mode);
    this.authError.set(null);
  }

  toggleGrade(grade: number) {
    const gradeControl = this.teacherForm.get('gradesTaught');
    if (!gradeControl) return;

    const currentValue = gradeControl.value as number[];
    const index = currentValue.indexOf(grade);

    if (index > -1) {
      currentValue.splice(index, 1);
    } else {
      currentValue.push(grade);
    }

    gradeControl.setValue([...currentValue]);
    gradeControl.markAsTouched();
  }

  isGradeSelected(grade: number): boolean {
    const gradeControl = this.teacherForm.get('gradesTaught');
    if (!gradeControl) return false;

    const currentValue = gradeControl.value as number[] | null;
    return currentValue ? currentValue.includes(grade) : false;
  }

  addChild() {
    this.childrenArray().push(this.createChildGroup());
  }

  removeChild(index: number) {
    if (this.childrenArray().length > 1) {
      this.childrenArray().removeAt(index);
    }
  }

  async registerParent() {
    this.authError.set(null);
    this.submittedUser.set(null);
    if (this.parentForm.invalid) {
      this.parentForm.markAllAsTouched();
      return;
    }
    const { email, password } = this.parentForm.getRawValue();
    if (!email || !password) return;
    this.isSubmitting.set(true);
    try {
      const cred = await createUserWithEmailAndPassword(this.auth, email, password);
      this.submittedUser.set(cred.user);
      await this.persistRegistration(cred.user, 'parent', this.buildParentPayload());
    } catch (error) {
      this.handleError(error as FirebaseError);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async registerTeacher() {
    this.authError.set(null);
    this.submittedUser.set(null);
    if (this.teacherForm.invalid) {
      this.teacherForm.markAllAsTouched();
      return;
    }
    const { email, password } = this.teacherForm.getRawValue();
    if (!email || !password) return;
    this.isSubmitting.set(true);
    try {
      const cred = await createUserWithEmailAndPassword(this.auth, email, password);
      this.submittedUser.set(cred.user);
      await this.persistRegistration(cred.user, 'teacher', this.buildTeacherPayload());
    } catch (error) {
      this.handleError(error as FirebaseError);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async registerWithGoogle() {
    this.authError.set(null);
    this.submittedUser.set(null);
    this.isSubmitting.set(true);
    try {
      const cred = await signInWithPopup(this.auth, this.googleProvider);
      this.submittedUser.set(cred.user);
      await this.persistRegistration(cred.user, this.mode(), { mode: this.mode(), provider: 'google' });
    } catch (error) {
      this.handleError(error as FirebaseError);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private createChildGroup(): FormGroup {
    return this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      grade: [null, [Validators.required, Validators.min(0), Validators.max(7)]],
    });
  }

  private handleError(error: FirebaseError) {
    this.authError.set(error.message);
    console.error(error);
  }

  private async persistRegistration(user: User, role: 'parent' | 'teacher', payload: Record<string, unknown>) {
    await this.profileService.markRegistrationComplete(user, {
      role,
      payload,
    });
  }

  private buildParentPayload() {
    const { firstName, lastName, idNumber, email, children } = this.parentForm.getRawValue();
    return { firstName, lastName, idNumber, email, children };
  }

  private buildTeacherPayload() {
    const { firstName, lastName, email, gradesTaught } = this.teacherForm.getRawValue();
    return { firstName, lastName, email, gradesTaught };
  }
}
