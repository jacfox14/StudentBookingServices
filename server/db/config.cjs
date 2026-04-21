require('dotenv').config();

const common = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'dev',
  database: process.env.DB_NAME || 'sbs_dev',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  dialect: 'mysql',
  seederStorage: 'sequelize',
};

module.exports = {
  development: common,
  test: { ...common, database: process.env.DB_NAME_TEST || 'sbs_test' },
  production: common,
};
