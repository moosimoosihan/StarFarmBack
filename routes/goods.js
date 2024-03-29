const express = require('express');
const router = express.Router();
const db = require('../db/db.js');
const sql = require('../sql.js');
const fs = require('fs');

const multer = require('multer');
const path = require('path');

const { scheduleJob } = require('node-schedule');

// 메인 상품 리스트 
router.get('/maingoods', function (request, response, next) {
    db.query(sql.goods_list, function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '에러' });
        }
        response.json(results);
    });
});

// 상품 등록
router.post('/add_goods', function (request, response) {
    const goods = request.body;

    try {
        // 이미지를 제외한 굿즈 정보 먼저 입력
        db.query(sql.goods_add, [goods.goods_category, goods.goods_category_detail, goods.goods_nm, goods.goods_content, goods.goods_start_price, goods.goods_trade, goods.goods_deliv_price, goods.goods_timer, goods.user_no], function (error, results, fields) {
            if (error) {
                return response.status(200).json({
                    message: 'goods_add_fail'
                })
            }
            // filtter로 빈 값 제거
            goods.goods_img = goods.goods_img.filter((item) => {
                return item != '';
            });
            
            try {
                // 등록 상품의 번호 불러오기
                db.query(sql.get_goods_no, [goods.goods_nm], function (error, results, fields) {
                    const filename = results[0].goods_no

                    const imgList = [];
                    for(let i = 0; i < goods.goods_img.length; i++) {
                        const pastDir = `${__dirname}` + `/../uploads/` + goods.goods_img[i];
                        const newDir = `${__dirname}` + `/../uploads/uploadGoods/${filename}`;
                        const extension = goods.goods_img[i].substring(goods.goods_img[i].lastIndexOf('.'))
                        
                        if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true });

                        fs.rename(pastDir, newDir+ '/' + i + extension, (err) => {
                            if (err) {
                                throw err;
                            }
                        });
                        imgList.push(i + extension);
                    }
                    const img = imgList.join(',');

                    // 파일 변경 모두 성공했으면 바뀐 이름으로 DB에 입력 
                    db.query(sql.add_image, [img, filename], function (error, results, fields) {
                        if (error) {
                            throw error;
                        }
                        const job = scheduleJob(goods.goods_timer, async () => {
                            // 경매 종료 시간이 되면 상품 상태 변경 후 낙찰금액 DB에 입력
                            db.query(sql.goods_succ_bid, [filename], function (error, results, fields) {
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
                                    db.query(sql.goods_succ_bid_update, [ 0, 3, filename], function (error, results, fields) {
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
                    })
                    return response.status(200).json({
                        message: 'add_complete'
                    })
                })
            }
            catch (err) {
                // 이미지 등록 실패
                // -> DB에서 미리 등록한 상품도 다시 제거하기
                db.query(sql.delete_goods_2, [goods.goods_nm], function (error, results, fields) {
                    console.log(err);
                    return response.status(200).json({
                        message: 'goodsimage_add_fail'
                    })
                })
            }
        })
    } catch {
        return response.status(200).json({
            message: 'DB_error'
        })
    }
})

const upload = multer({
    storage: multer.diskStorage({
        destination(req, file, cb) {
            cb(null, 'uploads/');
        },
        filename(req, file, cb) {
            cb(null, file.originalname);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
});

// 이미지 등록 
router.post('/upload_img', upload.single('img'), (request, response) => {
    setTimeout(() => {
        return response.status(200).json({
            message: 'success'
        })
    }, 2000);
})

// 이미지 제거
router.post('/delete_img', (request, response) => {

    const pastname = request.body.pastname;
    try {
        if (pastname != "" && fs.existsSync(path.normalize(`${__dirname}../../uploads/${pastname}`))) {
            fs.unlinkSync(path.normalize(`${__dirname}../../uploads/${pastname}`))
        }
        return response.status(200).json({
            message: 'success'
        })
    }
    catch (error) {
        console.log(error)
    }
})

// 상품 정렬 방식 
function sortCaseReplace(sortCase) {
    let order = ` ORDER BY goods_no`; // 오래된 순
    if (sortCase == 1) { // 최근 순
        order = ` ORDER BY goods_no DESC`;
    }
    else if (sortCase == 2) { // 가격 낮은 순 
        order = ` ORDER BY goods_price`;
    }
    else if (sortCase == 3) { // 가격 높은 순 
        order = ` ORDER BY goods_price DESC`;
    }
    else if (sortCase == 4) {  // 이름
        order = ` ORDER BY goods_nm`;
    }
    return order;
}

// 관리자 상품 리스트 
router.get('/admin/goodslist/:sortCase/:keyword', function (request, response, next) {

    const sortCase = request.params.sortCase;
    const keyword = request.params.keyword;

    let search = '';

    if (keyword != 'none') {
        search = ' WHERE goods_nm Like "%' + keyword + '%" ';
    }

    const order = sortCaseReplace(sortCase);

    db.query(sql.goods_list + search + order, function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '상품리스트에러' });
        }
        response.json(results);
    });
});

// 상품 수정용 정보 가져오기
router.post('/admin/get_goods_info', function (request, response, next) {
    const goods_no = request.body.goodsno
    db.query(sql.get_goods_info, [goods_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: 'goods_info_error' })
        }
        response.json(results);
    })
})

// 상품 수정
router.post('/update_goods', function (request, response, next) {
    const goods = request.body.goods

    db.query(sql.update_goods, [goods.goods_nm, goods.goods_category, goods.goods_price, goods.goods_hashtag1, goods.goods_hashtag2, goods.goods_hashtag3, goods.goods_cnt, goods.goods_no], function(error, results, fields) {
        if (error) {
            console.log(error);
            return response.status(500).json({ error: 'goods_update_error' })
        }
        else {
            return response.status(200).json({ message: 'update_complete' })
        }
    })
})

// 상품 제거
router.post('/delete_goods/:goods_no', function (request, response, next) {
    const goods_no = request.params.goods_no;
    // 이미지 이름 불러오기
    // db.query(sql.get_img_nm, [goods_no], function (error, results, fields) {
    //     if (error) {
    //         return response.status(500).json({ error: 'goods_error' })
    //     }
        // else {
            try {
                // const goods_img = results[0].goods_img;
                // const goods_detail_img = results[0].goods_detail_img;

                // 이미지 제거
                // fs.unlinkSync(`${__dirname}../uploads/uploadGoods/${goods_img}`);
                // fs.unlinkSync(`${__dirname}../uploads/uploadGoods/${goods_detail_img}`);

                // 상품 제거
                db.query(sql.delete_goods, [goods_no], function (error, results, fields) {
                    if (error) {
                        return response.status(500).json({ error: 'goods_error' })
                    }
                    else {
                        return response.status(200).json({
                            message: 'delete_complete'
                        })
                    }
                })
            }
            catch (error) {
                console.log("에러");
            }
        })
    // })
// })

// Main_카테고리별 상품 리스트 
router.get('/goodsCate/:category/:sortCase', function (request, response, next) {
    const category = request.params.category;
    const sortCase = request.params.sortCase;

    const order = sortCaseReplace(sortCase);

    db.query(sql.goods_catelist + order, [category], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '상품카테고리리스트에러' });
        }
        response.json(results);
    });
});

// Main 상품 검색 최대 숫자
router.get('/goodsSearchMax/:keyword', function (request, response, next) {
    const keyword = '%' + request.params.keyword + '%';

    db.query(sql.search_goods_count, [keyword], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: 'search_error' });
        }
        response.json(results);
    });
})

// Main_상품 검색 리스트
router.get('/goodsSearch/:keyword/:num/:sort', function (request, response, next) {
    const keyword = '%' + request.params.keyword + '%';
    const num = parseInt(request.params.num*10);
    const sort = request.params.sort;

    db.query(sql.goods_searchlist + ` ORDER BY goods_timer `+ sort +` limit `+num+`, 10`, [keyword], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: 'search_error' });
        }
        response.json(results);
    });
});

// 카테고리 검색
router.get('/category_search/:category/:num/:sort', function (request, response, next) {
    const category = request.params.category;
    const num = parseInt(request.params.num);
    const sort = request.params.sort;

    db.query(sql.search_category + ` ORDER BY goods_timer `+ sort +` limit `+num+`, 10`, [category], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: 'search_error' });
        }
        response.json(results);
    });
})

// 카테고리 디테일 검색
router.get('/category_detail_search/:category/:category_detail/:num/:sort', function (request, response, next) {
    const category = request.params.category;
    const category_detail = request.params.category_detail;
    const num = parseInt(request.params.num);
    const sort = request.params.sort;

    db.query(sql.search_category_detail + ` ORDER BY goods_timer `+ sort +` limit `+num+`, 10`, [category, category_detail], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: 'search_error' });
        }
        response.json(results);
    });
})

//카테고리 검색 최대 갯수
router.get('/category_search_max/:category', function (request, response, next) {
    const category = request.params.category;

    db.query(sql.search_category_count, [category], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: 'search_error' });
        }
        response.json(results);
    });
})

//카테고리 디테일 검색 최대 갯수
router.get('/category_detail_search_max/:category/:category_detail', function (request, response, next) {
    const category = request.params.category;
    const category_detail = request.params.category_detail;

    db.query(sql.search_category_detail_count, [category, category_detail], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: 'search_error' });
        }
        response.json(results);
    });
})

// 상품 상세정보
router.get('/goodsInfo/:id', function (request, response, next) {
    const goodsno = request.params.id;

    db.query(sql.get_goods_info, [goodsno], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '상품 상세정보 에러' });
        }
        response.json(results);
    });
});

// 상품 상세 유저정보
router.get('/goodsInfoUser/:id', function (request, response, next) {
    const goodsno = request.params.id;

    db.query(sql.get_goods_info_user, [goodsno], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '상품상세 유저정보 에러'});
        }
        response.json(results);
    })
});

//상품 최고 입찰가 및 낙찰가
router.get('/goodsSuccBid/:id', function (request, response, next) {
    const goodsno = request.params.id;

    db.query(sql.goods_succ_bid, [goodsno], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '상품 최고입찰가 낙찰가 에러' });
        }
        response.json(results);
    })
});

// 상품 경매 내역
router.get('/goodsBidList/:id', function (request, response, next) {
    const goodsno = request.params.id;

    db.query(sql.goods_auction, [goodsno], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '상품 경매 내역 에러' });
        }
        response.json(results);
    })
});

//상품 입찰
router.post('/goodsBidding/:id', function (request, response) {
    const goods = request.body;

    // 상품 상태가 0이 아닌 경우 입찰 불가
    db.query(sql.get_goods_info, [goods.goods_no], function (error, results1, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '상품 상태 에러' });
        }
        if (results1[0].goods_state == 0) {
            db.query(sql.goods_bidding, [goods.bid_amount, goods.goods_no, goods.user_no], function (error, results, fields) {
                if (error) {
                    console.error(error);
                    return response.status(500).json({ error: '상품 입찰 에러' });
                }
                else {
                    db.query(sql.auction_add_alram, [results1[0].user_no, goods.goods_no], function(error, results, fields){
                        if(error){
                            console.log(error);
                            response.status(500).send('Internal Server Error');
                        }
                    })
                    return response.status(200).json({
                        message: 'bidding_complete'
                    })
                }
            })
        } else {
            return response.status(200).json({
                message: 'bidding_fail'
            })
        }
    })
})

// 상품 상태 변경
router.post('/saleComp/:id', function (request, response, next) {
    const goodsno = request.params.id;

    db.query(sql.goods_comp, [goodsno], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '상품 상태 변경 에러' });
        }
        response.json(results);
    })
});

// 상품 결제 
router.post('/orderPayment', function (request, response, next) {
    const order = request.body;

    db.query(sql.order_payment, [order.order_receive_nm, order.order_mobile, order.order_addr1, order.order_addr2, order.order_zipcode, order.order_content, order.goods_no, order.user_no],
        function (error, results, fields) {
            if (error) {
                return response.status(500).json({
                    message: 'DB_error'
                });
            }
            db.query(sql.order_payment_no, [order.user_no], function (error, results, fields) {
                if(error) {
                    return response.status(500).json({
                        message: 'DB_error'
                    });
                }
                return response.status(200).json({
                    message: '완료',
                    order_no: results[0].order_no
                });
            })
        });
});

// 주문 리스트
router.get('/orderlist/:user_no/:sort/:page', function (request, response, next) {
    const user_no = request.params.user_no;
    var sort = request.params.sort;
    if(sort==='DESC'){
        sort = ' ORDER BY ORDER_DATE DESC';
    } else {
        sort = ' ORDER BY ORDER_DATE';
    }
    const page = ` limit ${request.params.page*10}, 10`;
    db.query(sql.get_order_list + sort + page, [user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '결제리스트에러' });
        }
        response.json(results);
    });
});

// 주문 상세보기
router.get('/orderODetail/:orderno', function (request, response, next) {
    const orderno = request.params.orderno;
    db.query(sql.orderlist_o_detail, [orderno], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '결제리스트에러' });
        }
        response.json(results);
    });
});

// 구매 확정 적립금
router.post('/orderPoint/:TRADE_NO/:user_no', function (request, response, next) {
    const user_no = request.params.user_no;
    const order_trade_no = request.params.TRADE_NO;
    db.query(sql.confirm_point, [order_trade_no, user_no], function (error) {
        if (error) {
            return response.status(500).json({
                message: 'DB_error'
            });
        }
        return response.status(200).json({
            message: '완료'
        });
    });
})

// 구매 취소 적립금 돌려주기
router.post('/orderPointRollback/:user_no/:order_dc', function (request, response, next) {
    const user_no = request.params.user_no;
    const order_dc = request.params.order_dc;

    db.query(sql.cancel_point, [order_dc, user_no], function (error) {
        if (error) {
            return response.status(500).json({
                message: 'DB_error'
            });
        }
        return response.status(200).json({
            message: '완료'
        });
    });
})

// 구매 취소 재고 롤백
router.post('/goodsRollback', function (request, response, next) {
    const goods = request.body;

    if (Array.isArray(goods)) {
        const rollbackPromises = goods.map((detail) => {
            return new Promise((resolve, reject) => {
                db.query(sql.cancel_goods, [detail.goods_cnt, detail.goods_no], function (error, results, fields) {
                    if (error) {
                        console.error(error);
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });
        });
        Promise.all(rollbackPromises)
            .then(() => {
                return response.status(200).json({
                    message: 'completed'
                });
            })
            .catch((error) => {
                console.error(error);
                return response.status(500).json({
                    message: 'DB_error'
                });
            });
    } else {
        return response.status(400).json({
            message: 'error'
        });
    }
});


// admin 주문관리 정렬방식
function orderSort(sortCase) {
    let order = ` ORDER BY o.ORDER_TRADE_NO`; // 오래된 순

    if (sortCase == 0) { // 결제완료
        order = ` WHERE o.ORDER_STATUS = 0`;
    }
    else if (sortCase == 1) { // 배송중 
        order = ` WHERE o.ORDER_STATUS = 1`;
    }
    else if (sortCase == 2) { // 배송완료 
        order = ` WHERE o.ORDER_STATUS = 2`;
    }
    else if (sortCase == 3) { // 구매확정 
        order = ` WHERE o.ORDER_STATUS = 3`;
    }
    else if (sortCase == 9) {  // 취소
        order = ` WHERE o.ORDER_STATUS = 9`;
    }
    return order;
}

// admin 주문관리 내역
router.get('/admin/orderM/:sortCase', function (request, response, next) {
    const sortCase = request.params.sortCase;
    const order = orderSort(sortCase);

    db.query(sql.admin_orderlist + order, function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '주문관리리스트에러' });
        }
        response.json(results);
    });
});

// admin 주문상태 업데이트
router.post('/admin/updateStatus', function (request, response, next) {
    const orderTradeNos = request.body.orderTradeNos;
    const status = request.body.status;

    db.query(sql.order_status_update, [status, orderTradeNos], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '에러' });
        }
        return response.status(200).json({ message: 'complete' });
    });
});

// 찜 추가
router.post('/likeInsert/:user_no/:goodsno', function (request, response, next) {
    const user_no = request.params.user_no;
    const goods_no = request.params.goodsno;

    db.query(sql.like_check, [user_no, goods_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '에러' });
        }

        if (results.length > 0) {
            return response.status(200).json({ message: 'complete', isLiked: true });
        } else {
            db.query(sql.like_insert, [user_no, goods_no], function (error, results, fields) {
                if (error) {
                    console.error(error);
                    return response.status(500).json({ error: '에러' });
                }

                return response.status(200).json({ message: 'complete', isLiked: false });
            });
        }
    });
});

// 찜 체크
router.post('/likeCheck/:user_no/:goodsno', function (request, response, next) {
    const user_no = request.params.user_no;
    const goods_no = request.params.goodsno;

    if (user_no == 'null') {
        return response.status(200).json({ message: 'complete', isLiked: false });
    }

    db.query(sql.like_check, [user_no, goods_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '에러' });
        }

        if (results.length > 0) {
            return response.status(200).json({ message: 'complete', isLiked: true });
        } else {
            return response.status(200).json({ message: 'complete', isLiked: false });
        }
    });
});

// 찜 제거
router.post('/likeDelete/:goodsno/:user_no', function (request, response, next) {
    const user_no = request.params.user_no;
    const goods_no = request.params.goodsno;

    db.query(sql.like_delete, [user_no, goods_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '에러' });
        }
        return response.status(200).json({ message: 'complete', isLiked: false });
    });
});

// 찜 카운트
router.get('/likeCount/:goodsno', function (request, response, next) {
    const goods_no = request.params.goodsno;

    db.query(sql.like_count, [goods_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '에러' });
        }
        return response.status(200).json(results[0]['COUNT(*)']);
    });
});


//좋아요 많은 메인상품
router.get('/PopularProducts',function(request,response,next){
    db.query(sql.main_popul_goods, function(error,results,fields){
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '에러' });
        }
        //결과가 있는지 확인 후 반환시킨다.
        if(results.length > 0) {
            return response.status(200).json(results);
        }
        else {
            return response.status(200).json({ message: 'no item' });
        }
        
    });
});

// 좋아요 많은 상품이 없을 경우 기본 상품
router.get('/DefaultProducts',function(request,response,next){
    db.query(sql.main_popul_empty_goods, function(error,results,fields){
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '에러' });
        }
        //결과가 있는지 확인 후 반환시킨다.
        if(results.length > 0) {
            return response.status(200).json(results);
        }
        else {
            return response.status(200).json({ message: 'no item' });
        }
        
    });
});

// 리뷰 작성
router.post('/write_review/:goods_no', function (request, response, next) {

    const review = request.body;

    // 이미지를 제외한 리뷰 정보 먼저 입력
    db.query(sql.review_write, [review.review_con, review.writer_user, review.review_goods, review.sell_user_no, review.review_score], function (error, result) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: 'error' });
        }

        // 리뷰 후 점수 유저에게 적용 (review.review_score) 0==+1 1==-1 2==0
        db.query(sql.get_user_fr, [review.sell_user_no], function (error, resultfr) {
            if (error) {
                console.error(error);
                return response.status(500).json({ error: 'error' });
            }
            const score = (review.review_score==0?1:review.review_score==1?-1:0)+resultfr[0].user_fr;
            db.query(sql.review_score_update, [score, review.sell_user_no], function (error, result) {
                if (error) {
                    console.error(error);
                    return response.status(500).json({ error: 'error' });
                }
                return response.status(200).json({
                    message: 'review_complete'
                });
            })
        })
    })
});

//리뷰 상품정보 가져오기
router.get('/write_review_info/:goods_no', function (request, response, next) {

    const goods_no = request.params.goods_no;

    db.query(sql.get_review_info, [goods_no], function (error, results, fields) {
        if(error) {
            console.error(error);
            return response.status(500).json({ error: 'error' });
        }
        return response.json(results);
    })
})

// 판매자가 리뷰를 작성할때 리뷰 상품 정보와 구매자의 정보를 가져온다.
router.get('/sale_write_review_info/:goods_no', function (request, response, next) {
        const goods_no = request.params.goods_no;
    
        db.query(sql.get_sale_review_info, [goods_no], function (error, results, fields) {
            if(error) {
                console.error(error);
                return response.status(500).json({ error: 'error' });
            }
            return response.json(results);
        })
})

// 상품 상세 페이지 리뷰 리스트 불러오기
router.get('/getReview/:goodsno', function (request, response, next) {
    const goods_no = request.params.goodsno;

    db.query(sql.goods_get_review, [goods_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: 'DB 에러' });
        }
        return response.json(results);
    })
})

// 장바구니 추가 
router.post('/basketInsert', function (request, response, next) {
    const basket = request.body;

    db.query(sql.basket_check, [basket.user_no, basket.basket_goods_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: 'error' });
        }

        if (results.length > 0) {
            return response.status(200).json({ message: 'check_error' });
        } else {
            db.query(sql.basket_insert, [basket.user_no, basket.basket_goods_price, basket.basket_goods_count,
            basket.basket_goods_nm, basket.basket_goods_img, basket.basket_goods_no], function (error, data) {
                if (error) {
                    console.error(error);
                    return response.status(500).json({ error: 'error' });
                }

                return response.status(200).json({ message: 'complete' });
            });
        }
    });
});

// 장바구니 삭제 
router.post('/basketDelete/:basket_no', function (request, response, next) {
    const basket = request.params.basket_no;
    console.log(basket)

    db.query(sql.basket_delete, [basket], function (error, data) {
        if (error) {
            return response.status(500).json({
                message: 'DB_error'
            })
        }
        return response.status(200).json({
            message: 'complete'
        });
    })
});

// 장바구니 리스트
router.get('/basketList/:user_no', function (request, response, next) {
    const user_no = request.params.user_no;

    db.query(sql.basket_list, [user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '에러' });
        }
        return response.status(200).json(results);
    });
});

// 장바구니 결제
router.post('/basketUpdate', function (request, response, next) {
    const basketNos = request.body.basket_no;
    const basketCounts = request.body.basket_goods_count;

    // 배열의 길이를 확인하여 모든 값에 대해 업데이트 수행
    if (basketNos.length !== basketCounts.length) {
        return response.status(400).json({ error: '장바구니 번호와 수량의 개수가 일치하지 않습니다.' });
    }

    for (let i = 0; i < basketNos.length; i++) {
        const basket_no = basketNos[i];
        const basket_goods_count = basketCounts[i];

        db.query(sql.basket_update, [basket_goods_count, basket_no], function (error, results, fields) {
            if (error) {
                console.error(error);
                return response.status(500).json({ error: '에러' });
            }
            // 모든 업데이트가 성공하면 마지막에 결과를 반환
            if (i === basketNos.length - 1) {
                return response.status(200).json({ message: 'update_complete' });
            }
        });
    }
});


// 장바구니 결제상품
router.get('/basketOrder/:user_no', function (request, response, next) {
    const user_no = request.params.user_no;

    db.query(sql.basket_tp, [user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '에러' });
        }
        return response.status(200).json(results);
    });
});

// 장바구니 결제 이탈시 check 업데이트
router.get('/basketCancel/:user_no', function (request, response, next) {
    const user_no = request.params.user_no;

    db.query(sql.basket_cancel, [user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '에러' });
        }
        return response.status(200).json(results);
    });
});

// 장바구니 결제 완료후 목록에서 삭제
router.post('/basketSuccess/:user_no', function (request, response, next) {
    const user_no = request.params.user_no;

    db.query(sql.basket_success, [user_no], function (error, data) {
        if (error) {
            return response.status(500).json({
                message: 'DB_error'
            })
        }
        return response.status(200).json({
            message: 'complete'
        });
    })
});

// 상품 번호 가져오기
router.get('/getUserNo/:goods_no', function (request, response, next) {
    const goods_no = request.params.goods_no;

    db.query(sql.get_goods_user_no, [goods_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: 'DB 에러' });
        }
        return response.json(results);
    })
})

//관리자 페이지 리스트 페이징 라우터
router.get('/allGoodsPage/:keyword/:sort/:num', function (request, response, next) {
    var keyword = '';
    if(request.params.keyword != 'none') {
        keyword = ` WHERE GOODS_NM LIKE '%${request.params.keyword}%'`;
    } else {
        keyword = '';
    }
    const num = parseInt(request.params.num) * 10;
    const sort = ` ORDER BY GOODS_UPLOAD_DATE ${request.params.sort}`;
    const page = ` limit ${num}, 10`;

    db.query(sql.all_goods_page + keyword + sort + page, function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: 'DB 에러' });
        }
        return response.json(results);
    })
})

// 관리자 페이지 검색 라우터
router.get('/allGoods/:keyword', function (request, response, next) {
    var keyword = '';
    if(request.params.keyword != 'none') {
        keyword = ` WHERE GOODS_NM LIKE '%${request.params.keyword}%'`;
    } else {
        keyword = '';
    }
    db.query(sql.all_goods + keyword, function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error:'DB 에러' });
        }
        return response.json(results);
    })
})

// 관리자 페이지 상품 삭제 후 복구 라우터
router.post('/restoreGoods/:goods_no', function (request, response, next) {
    const goods_no = request.params.goods_no;
    try{
        db.query(sql.restore_goods, [goods_no], function (error, result, fields) {
            if(error) {
                console.error(error);
                return response.status(500).json({ error: 'DB 에러' }); 
            } else {
                return response.status(200).json({
                    message: 'restore_complete'
                })
            }
        })
    } catch (error) {
        console.log(error)
    }
})

// 주문 상세보기
router.get('/orderInfo/:orderno', function (request, response, next) {
    const orderno = request.params.orderno;
    db.query(sql.order_info, [orderno], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '결제리스트에러' });
        }
        response.json(results);
    });
});

// 마이페이지 메인 리뷰쓴 상품 4개씩 가져오는 라우터
router.get('/reviewCount/:goods_no/:user_no', function (request, response, next) {
    const goods_no = request.params.goods_no;
    const user_no = request.params.user_no;

    db.query(sql.review_count, [goods_no, user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error:'DB 에러' });
        }
        return response.json(results);
    })
})

// 마이페이지 판매리스트 페이징을 위한 상품수 카운트
router.get('/getReviewCount/:goods_no/:user_no', function (request, response, next) {
    const goods_no = request.params.goods_no;
    const user_no = request.params.user_no;

    db.query(sql.get_review_count, [goods_no, user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error:'DB 에러' });
        }
        return response.json(results);
    })
})

// 마이페이지 입찰 상품 리스트 개수
router.get('/orderCount/:goods_no/:user_no', function (request, response, next) {
    const goods_no = request.params.goods_no;
    const user_no = request.params.user_no;

    db.query(sql.order_count, [goods_no, user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error:'DB 에러' });
        }
        return response.json(results);
    })
})

// 마이페이지 찜 상품 리스트 개수
router.get('/likeCounts/:goods_no' , function (request, response, next) {
    const goods_no = request.params.goods_no;

    db.query(sql.like_count, [goods_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error:'DB 에러' });
        }
        return response.json(results);
    })
})

// 해당 판매자가 해당 상품의 리뷰 작성할수 있는 권한 체크
router.get('/sale_review_check/:goods_no/:user_no', function (request, response, next) {
    const goods_no = request.params.goods_no;
    const user_no = request.params.user_no;

    db.query(sql.sale_review_check, [goods_no, user_no], function (error, results, fields) {
        if(error) {
            console.error(error);
            return response.status(500).json({ error: 'error' });
        }
        if(results.length > 0) {
            // 해당 상품에 대한 판매자 리뷰가 있는지 확인
            db.query(sql.sale_review_check3, [goods_no, user_no], function (error, results2, fields) {
                if(error) {
                    console.error(error);
                    return response.status(500).json({ error: 'error' });
                }
                if(results2.length == 0) {
                    return response.status(200).json({
                        message: 'review_ok'
                    })
                } else {
                    return response.status(200).json({
                        message: 'review_no'
                    })
                }
            })
        } else {
            return response.status(200).json({
                message: 'review_no'
            })
        }
    })
})

// 해당 구매자가 해당 상품의 리뷰 작성할수 있는 권한 체크
router.get('/review_check/:goods_no/:user_no', function (request, response, next) {
    const goods_no = request.params.goods_no;
    const user_no = request.params.user_no;

    db.query(sql.review_check, [goods_no], function (error, results, fields) {
        if(error) {
            console.error(error);
            return response.status(500).json({ error: 'error' });
        }
        if(results[0].user_no == user_no) {
            db.query(sql.sale_review_check2, [goods_no, user_no], function (error, results2, fields) {
                if(error) {
                    console.error(error);
                    return response.status(500).json({ error: 'error' });
                }
                console.log(results2)
                if(results2.length > 0) {
                    return response.status(200).json({
                        message: 'review_no'
                    })
                } else {
                    return response.status(200).json({
                        user_no : results[0].user_no,
                    })
                }
            })
        } else {
            return response.status(200).json({
                message: 'review_no'
            })
        }
    })
})

// 상품 페이지 확인시 알람 삭제
router.post('/auction_delete_alram', function (request, response, next) {
    const user_no = request.body.user_no;
    const goods_no = request.body.goods_no;

    db.query(sql.auction_delete_alram, [user_no, goods_no], function (error, results, fields) {
        if(error) {
            console.error(error);
            return response.status(500).json({ error: 'error' });
        }
        return response.status(200).json({
            message: 'delete_complete'
        })
    })
})

module.exports = router;