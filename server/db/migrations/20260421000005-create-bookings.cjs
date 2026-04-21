'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('bookings', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      service_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'services', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      student_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      start_at: { type: Sequelize.DATE, allowNull: false },
      end_at: { type: Sequelize.DATE, allowNull: false },
      status: {
        type: Sequelize.ENUM(
          'pending',
          'approved',
          'rejected',
          'cancelled',
          'completed'
        ),
        allowNull: false,
        defaultValue: 'pending',
      },
      notes: { type: Sequelize.TEXT, allowNull: true },
      rejection_reason: { type: Sequelize.STRING(255), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('bookings', ['service_id', 'start_at', 'end_at']);
    await queryInterface.addIndex('bookings', ['student_id', 'status']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('bookings');
  },
};
