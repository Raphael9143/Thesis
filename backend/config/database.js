const { Sequelize } = require('sequelize');

// Tạo connection đến MySQL database
const sequelize = new Sequelize(
	process.env.DB_NAME || 'thesis_db',
	process.env.DB_USER || 'root',
	process.env.DB_PASSWORD || '',
	{
		host: process.env.DB_HOST || 'localhost',
		port: process.env.DB_PORT || 3306,
		dialect: process.env.DB_DIALECT || 'mysql',
		logging: process.env.NODE_ENV === 'development' ? console.log : false,
		pool: {
			max: 5,
			min: 0,
			acquire: 30000,
			idle: 10000
		}
	}
);

// Test connection
const testConnection = async () => {
	try {
		await sequelize.authenticate();
		console.log('✅ MySQL database connected successfully!');
	} catch (error) {
		console.error('❌ Unable to connect to MySQL database:', error.message);
	}
};

module.exports = { sequelize, testConnection };
