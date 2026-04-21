import { DataTypes, Model, type Optional } from "sequelize";
import { sequelize } from "../config/db.js";

export interface ServiceCategoryAttributes {
  id: number;
  name: string;
  icon: string | null;
}

type Creation = Optional<ServiceCategoryAttributes, "id" | "icon">;

export class ServiceCategory
  extends Model<ServiceCategoryAttributes, Creation>
  implements ServiceCategoryAttributes
{
  declare id: number;
  declare name: string;
  declare icon: string | null;
}

ServiceCategory.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    icon: { type: DataTypes.STRING(40), allowNull: true },
  },
  {
    sequelize,
    tableName: "service_categories",
    modelName: "ServiceCategory",
    timestamps: false,
  }
);
