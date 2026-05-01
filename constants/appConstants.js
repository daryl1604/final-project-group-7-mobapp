export const APP_STORAGE_KEY = "@barangay_finals_app_data";
export const APP_SESSION_KEY = "@barangay_finals_session";
export const APP_REMEMBERED_LOGIN_KEY = "@barangay_finals_remembered_login";
export const APP_PREFERENCES_KEY = "@barangay_finals_preferences";

export const INCIDENT_TYPES = [
  "Trash Complaint",
  "Noise Complaint",
  "Broken Streetlight",
  "Drainage Concern",
  "Public Disturbance",
  "Water Leak",
  "Road Damage",
  "Illegal Parking",
  "Other",
];

export const PUROK_OPTIONS = [
  "Purok 1",
  "Purok 2",
  "Purok 3",
  "Purok 4",
  "Purok 5",
  "Purok 6",
];

export const REPORT_STATUSES = [
  "Pending",
  "Ongoing",
  "For Confirmation",
  "Resolved",
  "Rejected",
];

export const REPORT_SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Status", value: "status" },
  { label: "Incident Type", value: "type" },
];

export const THEME_OPTIONS = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

// Coffee / Lipa City status palette
export const STATUS_COLORS = {
  Pending: "#D4A055",
  Ongoing: "#7B4F2E",
  "For Confirmation": "#9B6B3A",
  Resolved: "#2E7D52",
  Rejected: "#C0392B",
};
