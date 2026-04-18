const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const fullNamePattern = /^[A-Za-z][A-Za-z\s.'-]{1,}$/;
const phonePattern = /^(09|\+639)\d{9}$/;
const MAX_AGE = 120;

export const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];

export function getPasswordStrength(password) {
  const value = String(password || "");

  if (!value) {
    return null;
  }

  let score = 0;

  if (value.length >= 8) {
    score += 1;
  }
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) {
    score += 1;
  }
  if (/\d/.test(value)) {
    score += 1;
  }
  if (/[^A-Za-z0-9]/.test(value) || value.length >= 12) {
    score += 1;
  }

  if (score <= 1) {
    return { label: "Weak", tone: "weak", score };
  }
  if (score <= 3) {
    return { label: "Medium", tone: "medium", score };
  }

  return { label: "Strong", tone: "strong", score };
}

export function normalizePhoneNumber(phoneNumber) {
  const value = String(phoneNumber || "").trim().replace(/[^\d+]/g, "");

  if (value.startsWith("+639")) {
    return `09${value.slice(4)}`;
  }

  if (value.startsWith("639")) {
    return `09${value.slice(3)}`;
  }

  return value;
}

export function isCanonicalPhoneNumber(phoneNumber) {
  return /^09\d{9}$/.test(normalizePhoneNumber(phoneNumber));
}

export function findPhoneConflict(accounts = [], phoneNumber, excludeUserId = null) {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  if (!isCanonicalPhoneNumber(normalizedPhone)) {
    return null;
  }

  return (
    accounts.find((account) => {
      if (excludeUserId && account.id === excludeUserId) {
        return false;
      }

      return normalizePhoneNumber(account.contactNumber) === normalizedPhone;
    }) || null
  );
}

export function validateEmail(email) {
  const value = String(email || "").trim();
  if (!value) {
    return "Email is required.";
  }
  if (!emailPattern.test(value)) {
    return "Enter a valid email address.";
  }
  return "";
}

export function validatePassword(password) {
  const value = String(password || "");
  if (!value) {
    return "Password is required.";
  }
  if (!passwordPattern.test(value)) {
    return "Use 8+ characters with uppercase, lowercase, and a number.";
  }
  return "";
}

export function validateLoginPassword(password) {
  const value = String(password || "");
  if (!value) {
    return "Password is required.";
  }
  return "";
}

export function validateConfirmPassword(password, confirmPassword) {
  if (!String(confirmPassword || "")) {
    return "Confirm your password.";
  }
  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }
  return "";
}

export function validateCurrentPassword(currentPassword, expectedPassword) {
  const value = String(currentPassword || "");

  if (!value.trim()) {
    return "Current password is required.";
  }

  if (String(expectedPassword || "") !== value) {
    return "Current password is incorrect.";
  }

  return "";
}

export function validateFullName(fullName) {
  const value = String(fullName || "").trim();
  if (!value) {
    return "Full name is required.";
  }
  if (value.length < 3) {
    return "Full name is too short.";
  }
  if (!fullNamePattern.test(value)) {
    return "Use letters, spaces, apostrophes, periods, or hyphens only.";
  }
  return "";
}

export function validatePhoneNumber(phoneNumber) {
  const rawValue = String(phoneNumber || "").trim();
  const value = normalizePhoneNumber(rawValue);
  if (!value) {
    return "Phone number is required.";
  }
  if (!phonePattern.test(rawValue) && !isCanonicalPhoneNumber(value)) {
    return "Enter a valid Philippine mobile number.";
  }
  return "";
}

export function validateAddress(address) {
  const value = String(address || "").trim();
  if (!value) {
    return "Address is required.";
  }
  if (value.length < 5) {
    return "Address must be at least 5 characters.";
  }
  return "";
}

export function validatePurok(purok) {
  if (!purok || purok.trim() === "") {
    return "Please select your purok.";
  }
  return "";
}

export function calculateAgeFromDob(dateOfBirth) {
  const value = String(dateOfBirth || "").trim();

  if (!value) {
    return "";
  }

  const today = new Date();
  const birthDate = new Date(`${value}T00:00:00`);

  if (Number.isNaN(birthDate.getTime()) || birthDate.getTime() > today.getTime()) {
    return "";
  }

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age >= 0 ? String(age) : "";
}

export function validateDateOfBirth(dateOfBirth) {
  const value = String(dateOfBirth || "").trim();

  if (!value) {
    return "Date of birth is required.";
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const birthDate = new Date(`${value}T00:00:00`);

  if (Number.isNaN(birthDate.getTime())) {
    return "Please select a valid date of birth.";
  }

  if (birthDate.getTime() > today.getTime()) {
    return "Date of birth cannot be in the future.";
  }

  return "";
}

export function validateGender(gender) {
  const value = String(gender || "").trim();

  if (!value) {
    return "Gender is required.";
  }

  if (!GENDER_OPTIONS.includes(value)) {
    return "Please choose a valid gender option.";
  }

  return "";
}

export function validateAge(age, dateOfBirth = "") {
  const value = String(age || "").trim();
  const dobError = validateDateOfBirth(dateOfBirth);

  if (!value) {
    return "Age is required.";
  }

  if (!/^\d+$/.test(value)) {
    return "Age must be a valid number.";
  }

  if (Number(value) < 0 || Number(value) > MAX_AGE) {
    return "Please provide a realistic age.";
  }

  if (!dobError) {
    const derivedAge = calculateAgeFromDob(dateOfBirth);

    if (derivedAge !== value) {
      return "Age must match the selected date of birth.";
    }
  }

  return "";
}

export function getLoginErrors({ email, password }) {
  return {
    email: validateEmail(email),
    password: validateLoginPassword(password),
  };
}

export function getSignupErrors({
  fullName,
  email,
  password,
  confirmPassword,
  contactNumber,
  address,
  purok,
  dateOfBirth,
  gender,
  age,
}) {
  return {
    fullName: validateFullName(fullName),
    email: validateEmail(email),
    password: validatePassword(password),
    confirmPassword: validateConfirmPassword(password, confirmPassword),
    contactNumber: validatePhoneNumber(contactNumber),
    address: validateAddress(address),
    dateOfBirth: validateDateOfBirth(dateOfBirth),
    gender: validateGender(gender),
    age: validateAge(age, dateOfBirth),
    purok: validatePurok(purok),
  };
}

export function getEmailForgotPasswordErrors({ email, password, confirmPassword }, step = 1) {
  if (step === 1) {
    return {
      email: validateEmail(email),
    };
  }

  return {
    email: validateEmail(email),
    password: validatePassword(password),
    confirmPassword: validateConfirmPassword(password, confirmPassword),
  };
}

export function hasValidationErrors(errors) {
  return Object.values(errors).some(Boolean);
}

export function isSamePassword(previousPassword, nextPassword) {
  return Boolean(String(nextPassword || "")) && String(previousPassword || "") === String(nextPassword || "");
}

export function getForgotPasswordErrors({ phoneNumber, password, confirmPassword }, step = 1) {
  if (step === 1) {
    return {
      phoneNumber: validatePhoneNumber(phoneNumber),
    };
  }

  return {
    phoneNumber: validatePhoneNumber(phoneNumber),
    password: validatePassword(password),
    confirmPassword: validateConfirmPassword(password, confirmPassword),
  };
}
