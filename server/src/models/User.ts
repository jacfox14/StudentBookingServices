import { DataTypes, Model, type Optional } from "sequelize";
import { sequelize } from "../config/db.js";

export type Role = "student" | "staff" | "admin";

export interface UserAttributes {
  id: number;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: Role;
  isBanned: boolean;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type UserCreation = Optional<
  UserAttributes,
  "id" | "isBanned" | "emailVerifiedAt" | "createdAt" | "updatedAt"
>;

export class User extends Model<UserAttributes, UserCreation> implements UserAttributes {
  declare id: number;
  declare email: string;
  declare passwordHash: string;
  declare firstName: string;
  declare lastName: string;
  declare role: Role;
  declare isBanned: boolean;
  declare emailVerifiedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

User.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false },
    firstName: { type: DataTypes.STRING(80), allowNull: false },
    lastName: { type: DataTypes.STRING(80), allowNull: false },
    role: {
      type: DataTypes.ENUM("student", "staff", "admin"),
      allowNull: false,
    },
    isBanned: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    emailVerifiedAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "users",
    modelName: "User",
    defaultScope: {
      attributes: { exclude: ["passwordHash"] },
    },
    scopes: {
      withPassword: { attributes: { include: ["passwordHash"] } },
    },
  }
);
