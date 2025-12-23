import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ProfileService } from '../services/profile.service';

export const redirectIncompleteProfileGuard: CanActivateFn = async () => {
  const profileService = inject(ProfileService);
  const router = inject(Router);

  const user = await profileService.currentUser();
  if (!user) return true;

  const status = await profileService.getApprovalStatus(user);
  if (status.status === 'approved') return true;
  if (status.status === 'pending' || status.status === 'rejected') {
    return router.createUrlTree(['/pending-approval']);
  }

  const needsRegistration = await profileService.needsRegistration(user);
  return needsRegistration ? router.createUrlTree(['/register']) : true;
};

export const blockRegistrationIfCompleteGuard: CanActivateFn = async () => {
  const profileService = inject(ProfileService);
  const router = inject(Router);

  const user = await profileService.currentUser();
  if (!user) return true;

  const status = await profileService.getApprovalStatus(user);
  if (status.status === 'approved') return router.createUrlTree(['/']);
  if (status.status === 'pending' || status.status === 'rejected') {
    return router.createUrlTree(['/pending-approval']);
  }

  return true;
};

export const approvalAdminGuard: CanActivateFn = async () => {
  const profileService = inject(ProfileService);
  const router = inject(Router);

  const user = await profileService.currentUser();
  if (!user) return router.createUrlTree(['/']);

  const token = await user.getIdTokenResult(true);
  if (token.claims['approval_admin'] === true) return true;

  return router.createUrlTree(['/pending-approval']);
};
