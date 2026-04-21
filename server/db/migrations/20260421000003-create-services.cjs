'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('services', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      category_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'service_categories', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      provider_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      title: { type: Sequelize.STRING(160), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false },
      location: { type: Sequelize.STRING(160), allowNull: false },
      duration_minutes: { type: Sequelize.INTEGER, allowNull: false },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('services');
  },
};
