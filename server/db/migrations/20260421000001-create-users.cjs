'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      first_name: { type: Sequelize.STRING(80), allowNull: false },
      last_name: { type: Sequelize.STRING(80), allowNull: false },
      role: {
        type: Sequelize.ENUM('student', 'staff', 'admin'),
        allowNull: false,
      },
      is_banned: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      email_verified_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
