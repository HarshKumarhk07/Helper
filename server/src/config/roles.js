export const ROLES = Object.freeze({
  ADMIN: 'admin',
  MANAGER: 'manager',
  WORKER: 'worker',
  USER: 'user',
});

export const ROLE_LIST = Object.values(ROLES);

export const SELF_SIGNUP_ROLES = [ROLES.USER];
