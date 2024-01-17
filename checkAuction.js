const { scheduleJob } = require('node-schedule');
const db = require('./db/db.js');
const sql = require('./sql.js');

module.exports = async () => {
  try {
    // 경매 종료 시간이 지난 상품들을 가져옴
    db.query(sql.getExpiredGoods, function (error, results1, fields) {
      if(error) {
        console.error(error);
        return response.status(500).json({ error: 'DB 에러' });
      }
      // 경매 종료 시간이 지난 상품들 중 최고 입찰자가 있는 상품들을 가져옴
      for (let i = 0; i < results1.length; i++) {
        db.query(sql.goods_succ_bid, [results1[i].goods_no], function (error, results2, fields) {
          if(error) {
            console.error(error);
            return response.status(500).json({ error: 'DB 에러' });
          }
          if(results2[0].succ_bid!=null){
            var goods_succ_bid = results2[0].succ_bid;
            var goods_no = results1[i].goods_no;
            db.query(sql.goods_succ_bid_update, [goods_succ_bid, 1, goods_no], function (error, results, fields) {
              if(error) {
                console.error(error);
                return response.status(500).json({ error: 'DB 에러' });
              }
              // console.log(goods_no+'번 상품의 낙찰금액이 '+goods_succ_bid+'원으로 변경되며 상태가 낙찰로 바뀌었습니다.')
            })
          }
          else {
            var goods_no = results1[i].goods_no;
            // 낙찰자가 없는 경우 상태 변경 후 종료
            db.query(sql.goods_succ_bid_update, [ 0, 3, goods_no], function (error, results, fields) {
              if(error) {
                console.error(error);
                return response.status(500).json({ error: 'DB 에러' });
              }
              // console.log(goods_no+'번 상품의 낙찰금액이 0원으로 변경되며 상태가 낙찰 없음으로 바뀌었습니다.')
            })
          }
        })
      }
    })

    // 경매가 아직 진행중인 상품들을 가져와서 스케줄링 해줌
    db.query(sql.getGoodsList, function (error, results, fields) {
      if(error) {
        console.error(error);
        return response.status(500).json({ error: 'DB 에러' });
      }
      const goodsList = results;
      for(let i = 0; i < goodsList.length; i++) {
        // console.log(goodsList[i].goods_no+'번 상품의 경매가 '+goodsList[i].goods_timer+'에 종료되도록 다시 스케줄링 되었습니다.');
        const job = scheduleJob(goodsList[i].goods_timer, async () => {
          // 경매 종료 시간이 되면 상품 상태 변경 후 낙찰금액 DB에 입력
          db.query(sql.goods_succ_bid, [goodsList.goods_no], function (error, results, fields) {
            if(error) {
                console.error(error);
                return response.status(500).json({ error: 'DB 에러' });
            }
            if(results[0].succ_bid!=null){
                var goods_succ_bid = results[0].succ_bid;
                var goods_no = results[0].goods_no;
                db.query(sql.goods_succ_bid_update, [goods_succ_bid, 1, goods_no], function (error, results, fields) {
                    if(error) {
                        console.error(error);
                        return response.status(500).json({ error: 'DB 에러' });
                    }
                  })
              } else {
                // 낙찰자가 없는 경우 상태 변경 후 종료
                db.query(sql.goods_succ_bid_update, [ 0, 3, goods_no], function (error, results, fields) {
                    if(error) {
                        console.error(error);
                        return response.status(500).json({ error: 'DB 에러' });
                    }
                  })
                }
            })
          })
          job.on('error', (err) => {
            console.error('스케줄링 에러', err);
          });
          job.on('success', () => {
              console.log('스케줄링 성공');
          });
        }
    })
    } catch (err) {
      console.error(err);
    }
}
