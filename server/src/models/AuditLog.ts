import { DataTypes, Model, type Optional } from "sequelize";
import { sequelize } from "../config/db.js";

export interface AuditLogAttributes {
  id: number;
  actorId: number | null;
  action: string;
  targetType: string;
  targetId: number | null;
  meta: Record<string, unknown> | null;
  createdAt: Date;
}

type Creation = Optional<
  AuditLogAttributes,
  "id" | "actorId" | "targetId" | "meta" | "createdAt"
>;

export class AuditLog extends Model<AuditLogAttributes, Creation> implements AuditLogAttributes {
  declare id: number;
  declare actorId: number | null;
  declare action: string;
  declare targetType: string;
  declare targetId: number | null;
  declare meta: Record<string, unknown> | null;
  declare readonly createdAt: Date;
}

AuditLog.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    actorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "users", key: "id" },
      onDelete: "SET NULL",
    },
    action: { type: DataTypes.STRING(80), allowNull: false },
    targetType: { type: DataTypes.STRING(40), allowNull: false },
    targetId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    meta: { type: DataTypes.JSON, allowNull: true },
    createdAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "audit_log",
    modelName: "AuditLog",
    timestamps: true,
    updatedAt: false,
  }
);
