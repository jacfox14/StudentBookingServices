'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      "ALTER TABLE `notifications` MODIFY COLUMN `type` ENUM(" +
        "'booking_created'," +
        "'booking_approved'," +
        "'booking_rejected'," +
        "'booking_cancelled'," +
        "'booking_rescheduled'," +
        "'reminder'" +
      ") NOT NULL"
    );
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "DELETE FROM `notifications` WHERE `type` = 'booking_rescheduled'"
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE `notifications` MODIFY COLUMN `type` ENUM(" +
        "'booking_created'," +
        "'booking_approved'," +
        "'booking_rejected'," +
        "'booking_cancelled'," +
        "'reminder'" +
      ") NOT NULL"
    );
  },
};
