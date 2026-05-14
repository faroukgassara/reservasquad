/**
 * Utility functions for email handling
 */

/**
 * Normalizes an email address by converting it to lowercase and trimming whitespace
 * @param email - The email address to normalize
 * @returns The normalized email address
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return email;
  }
  return email.toLowerCase().trim();
}

/**
 * Normalizes an array of email addresses
 * @param emails - Array of email addresses to normalize
 * @returns Array of normalized email addresses
 */
export function normalizeEmails(emails: string[]): string[] {
  if (!Array.isArray(emails)) {
    return emails;
  }
  return emails.map(email => normalizeEmail(email));
}
