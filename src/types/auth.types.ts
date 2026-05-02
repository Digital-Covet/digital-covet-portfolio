export type UserRole = "superadmin" | "admin" | "employee";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  departmentId?: string | null;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
}
