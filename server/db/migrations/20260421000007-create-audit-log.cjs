'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('audit_log', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      actor_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      action: { type: Sequelize.STRING(80), allowNull: false },
      target_type: { type: Sequelize.STRING(40), allowNull: false },
      target_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      meta: { type: Sequelize.JSON, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('audit_log');
  },
};
