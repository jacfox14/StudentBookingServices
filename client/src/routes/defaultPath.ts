import type { Role } from "@shared/schemas";

export function defaultPathForRole(role: Role): string {
  switch (role) {
    case "student":
      return "/dashboard";
    case "staff":
      return "/provider";
    case "admin":
      return "/admin";
  }
}
