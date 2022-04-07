const mysql = require('mysql');
const util = require('util');
require('dotenv').config();

const MYSQL_CONFIG = {
    host: process.env.MYSQL_HOST || 'localhost',
    database: process.env.MYSQL_DATABASE || 'rkfl-bigcommerce',
    user: process.env.MYSQL_USERNAME || 'root',
    ...(process.env.MYSQL_PASSWORD && { password: process.env.MYSQL_PASSWORD }),
    ...(process.env.MYSQL_PORT && { port: process.env.MYSQL_PORT }),
};

const connection = mysql.createConnection(process.env.CLEARDB_DATABASE_URL ? process.env.CLEARDB_DATABASE_URL : MYSQL_CONFIG);
const query = util.promisify(connection.query.bind(connection));

const usersCreate = query('CREATE TABLE `users` (\n' +
    '  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,\n' +
    '  `userId` int(11) NOT NULL,\n' +
    '  `email` text NOT NULL,\n' +
    '  `username` text,\n' +
    '  PRIMARY KEY (`id`),\n' +
    '  UNIQUE KEY `userId` (`userId`)\n' +
    ') ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;\n'
);

const storesCreate = query('CREATE TABLE `stores` (\n' +
    '  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,\n' +
    '  `storeHash` varchar(10) NOT NULL,\n' +
    '  `accessToken` text,\n' +
    '  `scope` text,\n' +
    '  PRIMARY KEY (`id`),\n' +
    '  UNIQUE KEY `storeHash` (`storeHash`)\n' +
    ') ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;'
);

const storeUsersCreate = query('CREATE TABLE `storeUsers` (\n' +
    '  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,\n' +
    '  `userId` int(11) NOT NULL,\n' +
    '  `storeHash` varchar(10) NOT NULL,\n' +
    '  `isAdmin` boolean,\n' +
    '  PRIMARY KEY (`id`),\n' +
    '  UNIQUE KEY `userId` (`userId`,`storeHash`)\n' +
    ') ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;\n'
);

const merchantCreate = query('CREATE TABLE `merchants` (\n' +
    '  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,\n' +
    '  `email` varchar(100) NOT NULL,\n' +
    '  `environment` varchar(10) NOT NULL,\n' +
    '  `merchantId` varchar(50) NOT NULL,\n' +
    '  `password` varchar(200) NOT NULL,\n' +
    '   `publicKey` text NOT NULL,\n' +
    '  `storeHash` varchar(10) NOT NULL,\n' +
    '  PRIMARY KEY (`id`),\n' +
    '  UNIQUE KEY `storeHash` (`storeHash`)\n' +
    ') ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;\n'
);
Promise.all([usersCreate, storesCreate,storeUsersCreate,merchantCreate]).then(() => {
    connection.end();
});
