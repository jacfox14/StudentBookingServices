import { DataTypes, Model, type Optional } from "sequelize";
import { sequelize } from "../config/db.js";

export interface ServiceAttributes {
  id: number;
  categoryId: number;
  providerId: number;
  title: string;
  description: string;
  location: string;
  durationMinutes: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type Creation = Optional<
  ServiceAttributes,
  "id" | "isActive" | "createdAt" | "updatedAt"
>;

export class Service extends Model<ServiceAttributes, Creation> implements ServiceAttributes {
  declare id: number;
  declare categoryId: number;
  declare providerId: number;
  declare title: string;
  declare description: string;
  declare location: string;
  declare durationMinutes: number;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Service.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    categoryId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "service_categories", key: "id" },
    },
    providerId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    title: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    location: { type: DataTypes.STRING(160), allowNull: false },
    durationMinutes: { type: DataTypes.INTEGER, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "services", modelName: "Service" }
);
