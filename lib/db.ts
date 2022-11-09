import { Db } from '../types'

const { DB_TYPE } = process.env;

let db: Db;

switch (DB_TYPE) {
    case 'firebase':
        db = require('./dbs/mysql');
        break;
    case 'mysql':
        db = require('./dbs/mysql');
        break;
    default:
        db = require('./dbs/mysql');
        break;
}

export default db;
