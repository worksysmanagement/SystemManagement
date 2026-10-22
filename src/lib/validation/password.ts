/**
 * Password strength validation and rules for RKonekte platform.
 */

export interface PasswordValidationResult {
  isValid: boolean;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  errors: string[];
}

export function validateStrongPassword(password: string): PasswordValidationResult {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const errors: string[] = [];
  if (!hasMinLength) errors.push("au moins 8 caractères");
  if (!hasUppercase) errors.push("au moins une majuscule (A-Z)");
  if (!hasLowercase) errors.push("au moins une minuscule (a-z)");
  if (!hasNumber) errors.push("au moins un chiffre (0-9)");
  if (!hasSpecial) errors.push("au moins un caractère spécial (!@#$%^&*...)");

  return {
    isValid: hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
    errors,
  };
}
