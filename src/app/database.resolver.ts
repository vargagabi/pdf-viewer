import { ResolveFn } from '@angular/router';

export const databaseResolver: ResolveFn<boolean> = (route, state) => {


  return true;
};
