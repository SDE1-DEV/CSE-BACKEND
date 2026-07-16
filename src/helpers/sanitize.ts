/**
 * Strips sensitive fields from user objects before returning to client
 */
export const sanitizeUser = <T extends { passwordHash?: string }>(user: T): Omit<T, 'passwordHash'> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _pw, ...sanitized } = user;
  return sanitized;
};

/**
 * Strips null/undefined keys from an object for cleaner updates
 */
export const stripNulls = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== undefined),
  ) as Partial<T>;
};
