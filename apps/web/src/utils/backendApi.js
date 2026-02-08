const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export const API_ENUMS = {
  workflowTypes: ["task", "product", "habit", "generic"],
  itemTypes: ["task", "product", "habit"],
  itemStatuses: ["not_started", "in_progress", "completed", "archived"],
  stepTypes: ["manual", "checklist", "approval", "timer"],
  stepStatuses: ["pending", "active", "done", "skipped"],
  substepStatuses: ["pending", "done"],
};

export function apiUrl(path) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}

export function isValidEnumValue(value, allowed) {
  return typeof value === "string" && allowed.includes(value);
}

export function assertRequiredString(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required`);
  }
}

export function assertMaxLength(value, field, max) {
  if (typeof value === "string" && value.length > max) {
    throw new Error(`${field} must be <= ${max} characters`);
  }
}
