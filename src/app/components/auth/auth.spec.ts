import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthComponent } from './auth';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { GOOGLE_AUTH_PROVIDER } from '../../app.config'

describe('AuthComponent', () => {
  let component: AuthComponent;
  let fixture: ComponentFixture<AuthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthComponent],
      providers: [
        provideFirebaseApp(() => initializeApp({})),
        provideAuth(() => getAuth()),
        { provide: GOOGLE_AUTH_PROVIDER, useValue: {} }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
