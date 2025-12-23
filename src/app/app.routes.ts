import { Routes } from '@angular/router';
import { AuthComponent } from './components/auth/auth';
import { RegisterComponent } from './components/register/register';
import {
    approvalAdminGuard,
    blockRegistrationIfCompleteGuard,
    redirectIncompleteProfileGuard,
} from './guards/registration.guard';
import { PendingApprovalComponent } from './components/pending-approval/pending-approval';
import { AdminApprovalsComponent } from './components/admin-approvals/admin-approvals';

export const routes: Routes = [
    { path: '', component: AuthComponent, canActivate: [redirectIncompleteProfileGuard] },
    { path: 'register', component: RegisterComponent, canActivate: [blockRegistrationIfCompleteGuard] },
    { path: 'pending-approval', component: PendingApprovalComponent },
    { path: 'admin/approvals', component: AdminApprovalsComponent, canActivate: [approvalAdminGuard] },
];
