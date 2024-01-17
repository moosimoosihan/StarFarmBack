const fs = require('fs');
const path = require('path');
const db = require('./db/db');
const sql = require('./sql.js');

// images에 폴더별로 카테고리가 되어있고
// 그 안에 이미지를 순서대로 upload/uploadGoods 폴더 안에
// 폴더명을 index값으로 하는 폴더를 만들고 그 안에 이미지를 0.jpg로 넣어주기
module.exports = async () => {
    // images 폴더 안에 있는 폴더들의 이름을 배열로 가져옴
    const categories = fs.readdirSync(path.join(__dirname, './images'));

    var num1 = 1;
    // 상품 수가 0일 경우만 실행
    db.query(sql.goods_count, (err, result) => {
        if(result[0].count === 0) {
            // 각 카테고리 폴더 안에 있는 이미지들을 순서대로 가져옴
            for(let index = 0; index < categories.length; index++) {
                const images = fs.readdirSync(path.join(__dirname, `./images/${categories[index]}`));

                
                var num = 0;
                // 각 카테고리 폴더 안에 있는 이미지들을 순서대로 가져옴
                images.forEach((image, index2) => {
                    // 이미지를 0.jpg로 넣어줌
                    
                    // upload/uploadGoods 폴더 안에 폴더명을 index값으로 하는 폴더를 만듦
                    if(!fs.existsSync(`./uploads/uploadGoods/${num1}`)) fs.mkdirSync(path.join(__dirname, `./uploads/uploadGoods/${num1}`), { recursive: true });

                    var extention = image.substring(image.indexOf('.'));
                    fs.copyFile(path.join(__dirname, `./images/${categories[index]}/${image}`), path.join(__dirname, `./uploads/uploadGoods/${num1}/0${extention}`), (err) => {
                        if(err) throw err;
                    });
                    num1++;

                    var cate = categories[index].split(' ')[0];
                    var subcate = categories[index].split(' ')[1];
                    var randomPrice = Math.floor(Math.random() * 100000) + 10000;
                    var randomTrade = Math.floor(Math.random() * 2);
                    var date = Math.floor(Math.random() * 20) + 10;
                    var dateQuery = `DATE_ADD(NOW(), INTERVAL ${date} DAY))`
                    var user_no = Math.floor(Math.random() * 30) + 1;
                    db.query(sql.goods_add2 + dateQuery, [cate, subcate, cate+num, `${cate+num}상품 입니다.`, randomPrice, randomTrade, randomTrade===0? 3000:0, user_no, `0${extention}`] , (err, result) => {
                        if(err) throw err;
                    });
                    num++;
                })
            }
        } else {
            console.log('상품이 이미 존재합니다.');
        }
    });
}