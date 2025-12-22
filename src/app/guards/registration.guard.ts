import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ProfileService } from '../services/profile.service';

export const redirectIncompleteProfileGuard: CanActivateFn = async () => {
  const profileService = inject(ProfileService);
  const router = inject(Router);

  const needsRegistration = await profileService.needsRegistration();
  return needsRegistration ? router.createUrlTree(['/register']) : true;
};

export const blockRegistrationIfCompleteGuard: CanActivateFn = async () => {
  const profileService = inject(ProfileService);
  const router = inject(Router);

  const user = await profileService.currentUser();
  if (!user) return true;

  const isComplete = await profileService.isRegistrationComplete(user);
  return isComplete ? router.createUrlTree(['/']) : true;
};
