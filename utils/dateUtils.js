export function formatDate(dateValue) {
  if (!dateValue) {
    return "N/A";
  }

  return new Date(dateValue).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(dateValue) {
  if (!dateValue) {
    return "N/A";
  }

  return new Date(dateValue).toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDateTime(dateValue) {
  if (!dateValue) {
    return "N/A";
  }

  return `${formatDate(dateValue)} ${formatTime(dateValue)}`;
}

export function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

export function getCurrentTime() {
  return new Date().toLocaleTimeString("en-PH", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function startOfWeek(dateValue) {
  const date = new Date(dateValue);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

export function isWithinCurrentWeek(dateValue) {
  const now = new Date();
  const start = startOfWeek(now);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  const target = new Date(dateValue);
  return target >= start && target < end;
}

export function isWithinCurrentMonth(dateValue) {
  const now = new Date();
  const target = new Date(dateValue);
  return target.getMonth() === now.getMonth() && target.getFullYear() === now.getFullYear();
}

export function isWithinCurrentYear(dateValue) {
  const now = new Date();
  const target = new Date(dateValue);
  return target.getFullYear() === now.getFullYear();
}
