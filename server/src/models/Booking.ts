import { DataTypes, Model, type Optional } from "sequelize";
import { sequelize } from "../config/db.js";

export type BookingStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "completed";

export interface BookingAttributes {
  id: number;
  serviceId: number;
  studentId: number;
  startAt: Date;
  endAt: Date;
  status: BookingStatus;
  notes: string | null;
  rejectionReason: string | null;
  rescheduleCount: number;
  createdAt: Date;
  updatedAt: Date;
}

type Creation = Optional<
  BookingAttributes,
  "id" | "notes" | "rejectionReason" | "rescheduleCount" | "createdAt" | "updatedAt"
>;

export class Booking extends Model<BookingAttributes, Creation> implements BookingAttributes {
  declare id: number;
  declare serviceId: number;
  declare studentId: number;
  declare startAt: Date;
  declare endAt: Date;
  declare status: BookingStatus;
  declare notes: string | null;
  declare rejectionReason: string | null;
  declare rescheduleCount: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Booking.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    serviceId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "services", key: "id" },
    },
    studentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    startAt: { type: DataTypes.DATE, allowNull: false },
    endAt: { type: DataTypes.DATE, allowNull: false },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected", "cancelled", "completed"),
      allowNull: false,
      defaultValue: "pending",
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    rejectionReason: { type: DataTypes.STRING(255), allowNull: true },
    rescheduleCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "bookings",
    modelName: "Booking",
    indexes: [
      { fields: ["service_id", "start_at", "end_at"] },
      { fields: ["student_id", "status"] },
    ],
  }
);
