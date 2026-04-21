import { DataTypes, Model, type Optional } from "sequelize";
import { sequelize } from "../config/db.js";

export interface AvailabilityBlockAttributes {
  id: number;
  serviceId: number;
  startAt: Date;
  endAt: Date;
  recurrenceRule: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type Creation = Optional<
  AvailabilityBlockAttributes,
  "id" | "recurrenceRule" | "createdAt" | "updatedAt"
>;

export class AvailabilityBlock
  extends Model<AvailabilityBlockAttributes, Creation>
  implements AvailabilityBlockAttributes
{
  declare id: number;
  declare serviceId: number;
  declare startAt: Date;
  declare endAt: Date;
  declare recurrenceRule: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

AvailabilityBlock.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    serviceId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "services", key: "id" },
      onDelete: "CASCADE",
    },
    startAt: { type: DataTypes.DATE, allowNull: false },
    endAt: { type: DataTypes.DATE, allowNull: false },
    recurrenceRule: { type: DataTypes.STRING(255), allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "availability_blocks",
    modelName: "AvailabilityBlock",
    indexes: [{ fields: ["service_id", "start_at"] }],
  }
);
