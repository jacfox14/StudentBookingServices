import type {
  LoginInput,
  RegisterInput,
  AuthResponse,
} from "@sbs/shared";
import { User } from "../models/User.js";
import { AppError } from "../errors/AppError.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";
import { toUserDTO } from "../dto/index.js";

export const AuthService = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const existing = await User.unscoped().findOne({ where: { email: input.email } });
    if (existing) {
      throw new AppError("CONFLICT", "Email already registered", {
        email: "This email is already in use",
      });
    }
    const passwordHash = await hashPassword(input.password);
    const created = await User.create({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      isBanned: false,
      emailVerifiedAt: null,
    });
    // Reload without passwordHash via default scope
    const user = (await User.findByPk(created.id))!;
    const token = signToken({ sub: user.id, role: user.role, email: user.email });
    return { token, user: toUserDTO(user) };
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await User.scope("withPassword").findOne({
      where: { email: input.email },
    });
    if (!user) {
      throw new AppError("UNAUTHENTICATED", "Invalid email or password");
    }
    if (user.isBanned) {
      throw new AppError("UNAUTHENTICATED", "Your account has been banned");
    }
    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) {
      throw new AppError("UNAUTHENTICATED", "Invalid email or password");
    }
    const token = signToken({ sub: user.id, role: user.role, email: user.email });
    return { token, user: toUserDTO(user) };
  },
};
