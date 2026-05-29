export function normalizeAdminReturnUrl(value: unknown): string {
  if (typeof value !== "string") {
    return "/admin";
  }

  if (
    value !== "/admin" &&
    !value.startsWith("/admin/") &&
    !value.startsWith("/admin?")
  ) {
    return "/admin";
  }

  if (value.startsWith("//")) {
    return "/admin";
  }

  return value;
}
