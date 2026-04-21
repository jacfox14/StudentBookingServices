'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('service_categories', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: { type: Sequelize.STRING(80), allowNull: false, unique: true },
      icon: { type: Sequelize.STRING(40), allowNull: true },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('service_categories');
  },
};
