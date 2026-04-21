import { sequelize } from "../config/db.js";
import { User } from "./User.js";
import { ServiceCategory } from "./ServiceCategory.js";
import { Service } from "./Service.js";
import { AvailabilityBlock } from "./AvailabilityBlock.js";
import { Booking } from "./Booking.js";
import { Notification } from "./Notification.js";
import { AuditLog } from "./AuditLog.js";

ServiceCategory.hasMany(Service, { foreignKey: "categoryId", as: "services" });
Service.belongsTo(ServiceCategory, { foreignKey: "categoryId", as: "category" });

User.hasMany(Service, { foreignKey: "providerId", as: "providedServices" });
Service.belongsTo(User, { foreignKey: "providerId", as: "provider" });

Service.hasMany(AvailabilityBlock, {
  foreignKey: "serviceId",
  as: "availability",
  onDelete: "CASCADE",
});
AvailabilityBlock.belongsTo(Service, { foreignKey: "serviceId", as: "service" });

Service.hasMany(Booking, { foreignKey: "serviceId", as: "bookings" });
Booking.belongsTo(Service, { foreignKey: "serviceId", as: "service" });

User.hasMany(Booking, { foreignKey: "studentId", as: "bookings" });
Booking.belongsTo(User, { foreignKey: "studentId", as: "student" });

User.hasMany(Notification, {
  foreignKey: "userId",
  as: "notifications",
  onDelete: "CASCADE",
});
Notification.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(AuditLog, { foreignKey: "actorId", as: "auditEntries" });
AuditLog.belongsTo(User, { foreignKey: "actorId", as: "actor" });

export {
  sequelize,
  User,
  ServiceCategory,
  Service,
  AvailabilityBlock,
  Booking,
  Notification,
  AuditLog,
};
