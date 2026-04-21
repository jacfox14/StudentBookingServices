'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      type: {
        type: Sequelize.ENUM(
          'booking_created',
          'booking_approved',
          'booking_rejected',
          'booking_cancelled',
          'reminder'
        ),
        allowNull: false,
      },
      payload: { type: Sequelize.JSON, allowNull: false },
      read_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('notifications', ['user_id', 'read_at']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
  },
};
