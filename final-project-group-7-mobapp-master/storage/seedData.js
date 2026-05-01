import { INCIDENT_TYPES, PUROK_OPTIONS } from "../constants/appConstants";
import { createId } from "../utils/idUtils";

const now = new Date();
const timestamp = now.toISOString();

export const seedAccounts = [
  {
    id: "admin_001",
    role: "admin",
    fullName: "Barangay Admin",
    email: "admin@gmail.com",
    password: "admin123",
    purok: "Barangay Hall",
    contactNumber: "09123456789",
    createdAt: timestamp,
    updatedAt: timestamp,
    passwordUpdatedAt: timestamp,
  },
  {
    id: "resident_001",
    role: "resident",
    fullName: "Ana Cruz",
    email: "resident@barangay.local",
    password: "resident123",
    purok: "Purok 3",
    contactNumber: "09987654321",
    createdAt: timestamp,
    updatedAt: timestamp,
    passwordUpdatedAt: timestamp,
  },
];

export const seedReports = [
  {
    id: createId("report"),
    residentId: "resident_001",
    residentName: "Ana Cruz",
    incidentType: INCIDENT_TYPES[0],
    description: "Garbage has not been collected near the covered court for two days.",
    purok: PUROK_OPTIONS[2],
    date: now.toISOString().split("T")[0],
    time: "09:30",
    photoUri: "",
    location: {
      latitude: 14.5995,
      longitude: 120.9842,
      address: "Covered Court, Purok 3",
    },
    status: "Pending",
    adminFeedback: [],
    residentReplies: [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },
];

export const seedNotifications = [
  {
    id: createId("notif"),
    userId: "resident_001",
    title: "Welcome",
    message: "Your resident demo account is ready. You can file and track reports locally.",
    type: "info",
    read: false,
    createdAt: now.toISOString(),
  },
  {
    id: createId("notif"),
    userId: "admin_001",
    title: "Demo Admin Ready",
    message: "You can manage residents, update reports, and review analytics in this local mobile build.",
    type: "info",
    read: false,
    createdAt: now.toISOString(),
  },
];
