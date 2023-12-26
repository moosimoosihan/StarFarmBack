const db = {
    db : {
        database: "starfarm",
        connectionLimit: 10,
        host: "127.0.0.1",
        user: "root",
        password: "1234"
    }
}

const dbPool = require('mysql').createPool(db);

module.exports = dbPool;

// query('/:alias', async (request, res) => {
//     try {
//         res.send(await req.db(request.params.alias, request.body.param, request.body.where));
//     } catch (err) {
//         res.status(500).send({
//             error: err
//         });
//     }
// });

// const req = {
//     async db(alias, param = [], where = '') {
//         return new Promise((resolve, reject) => dbPool.query(sql[alias].query + where, param, (error, rows) => {
//             if(error){
//                 if(error.code != 'ER_DUP_ENTRY')
//                     console.log(error);
//                 resolve({
//                     error
//                 });
//             } else resolve(rows);
//         }));
//     }
// };