import { Routes } from '@angular/router';
import { AuthComponent } from './components/auth/auth';
import { RegisterComponent } from './components/register/register';
import { blockRegistrationIfCompleteGuard, redirectIncompleteProfileGuard } from './guards/registration.guard';

export const routes: Routes = [
    { path: '', component: AuthComponent, canActivate: [redirectIncompleteProfileGuard] },
    { path: 'register', component: RegisterComponent, canActivate: [blockRegistrationIfCompleteGuard] },
];
