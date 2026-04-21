'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('availability_blocks', {
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
        onDelete: 'CASCADE',
      },
      start_at: { type: Sequelize.DATE, allowNull: false },
      end_at: { type: Sequelize.DATE, allowNull: false },
      recurrence_rule: { type: Sequelize.STRING(255), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('availability_blocks', ['service_id', 'start_at']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('availability_blocks');
  },
};
