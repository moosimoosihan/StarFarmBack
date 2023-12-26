const db = {
    database: "starfarm",
    connectionLimit: 10,
    host: "127.0.0.1",
    user: "root",
    password: "12341234"
  };
const dbPool = require('mysql').createPool(db);

module.exports = dbPool;