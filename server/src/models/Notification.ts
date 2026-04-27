import { DataTypes, Model, type Optional } from "sequelize";
import { sequelize } from "../config/db.js";

export type NotificationType =
  | "booking_created"
  | "booking_approved"
  | "booking_rejected"
  | "booking_cancelled"
  | "booking_rescheduled"
  | "reminder";

export interface NotificationAttributes {
  id: number;
  userId: number;
  type: NotificationType;
  payload: Record<string, unknown>;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type Creation = Optional<
  NotificationAttributes,
  "id" | "readAt" | "createdAt" | "updatedAt"
>;

export class Notification
  extends Model<NotificationAttributes, Creation>
  implements NotificationAttributes
{
  declare id: number;
  declare userId: number;
  declare type: NotificationType;
  declare payload: Record<string, unknown>;
  declare readAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Notification.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
    },
    type: {
      type: DataTypes.ENUM(
        "booking_created",
        "booking_approved",
        "booking_rejected",
        "booking_cancelled",
        "booking_rescheduled",
        "reminder"
      ),
      allowNull: false,
    },
    payload: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
    readAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "notifications",
    modelName: "Notification",
    indexes: [{ fields: ["user_id", "read_at"] }],
  }
);
