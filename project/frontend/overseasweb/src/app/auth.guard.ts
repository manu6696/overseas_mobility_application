import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserHttpService } from './user-http.service';

export const authGuard: CanActivateFn = (route, state) => {
  const us: UserHttpService = inject(UserHttpService);
  const router: Router = inject(Router);
  
  if(us.is_logged())
    return true;

  router.navigate(['/login']);
  return false;
};
