export const ROLES = Object.freeze({
  ADMIN: 'admin',
  WORKER: 'worker',
  USER: 'user',
  BRAND: 'brand',
});

export const ROLE_LIST = Object.values(ROLES);

export const SELF_SIGNUP_ROLES = [ROLES.USER, ROLES.WORKER, ROLES.BRAND];

