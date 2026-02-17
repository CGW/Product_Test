export const ROLES = {
  APP_OWNER_ADMIN: 'app_owner_admin',
  APP_ADMIN: 'app_admin',
  ORACLE_CARD_ADMIN: 'oracle_card_admin',
  USER: 'user',
};

export const ROLE_LEVELS = {
  app_owner_admin: 40,
  app_admin: 30,
  oracle_card_admin: 20,
  user: 10,
};

export const SPREAD_TYPES = {
  SINGLE: 'single',
  THREE_CARD: 'three_card',
  CUSTOM: 'custom',
};

export const WEBHOOK_EVENTS = {
  USER_REGISTERED: 'user.registered',
  ONBOARDING_COMPLETED: 'user.onboarding_completed',
  READING_COMPLETED: 'reading.completed',
};
