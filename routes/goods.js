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
                    .then(() => {
                        return response.status(200).json({
                            message: 'add_complete'
                        })
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
router.get('/goodsSearch/:keyword/:num', function (request, response, next) {
    const keyword = '%' + request.params.keyword + '%';
    const num = parseInt(request.params.num);

    db.query(sql.goods_searchlist, [keyword, num], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: 'search_error' });
        }
        response.json(results);
    });
});

// 카테고리 검색
router.get('/category_search/:category/:num', function (request, response, next) {
    const category = request.params.category;
    const num = parseInt(request.params.num);

    db.query(sql.search_category, [category, num], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: 'search_error' });
        }
        response.json(results);
    });
})

// 카테고리 디테일 검색
router.get('/category_detail_search/:category/:category_detail/:num', function (request, response, next) {
    const category = request.params.category;
    const category_detail = request.params.category_detail;
    const num = parseInt(request.params.num);

    db.query(sql.search_category_detail, [category, category_detail, num], function (error, results, fields) {
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
    db.query(sql.get_goods_info, [goods.goods_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '상품 상태 에러' });
        }
        if (results[0].goods_state == 0) {
            db.query(sql.goods_bidding, [goods.bid_amount, goods.goods_no, goods.user_no], function (error, results, fields) {
                if (error) {
                    console.error(error);
                    return response.status(500).json({ error: '상품 입찰 에러' });
                }
                else {
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

    console.log(order);

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
            

            // if (Array.isArray(order_detail)) {
            //     const detailPromises = order_detail.map((detail) => {
            //         return new Promise((resolve, reject) => {
            //             db.query(sql.order_payment_detail, [orderTradeNo, detail.goods_no, detail.order_goods_nm, detail.order_goods_price,
            //                 detail.order_goods_img, detail.order_goods_cnt],
            //                 function (error, results, fields) {
            //                     if (error) {
            //                         reject(error);
            //                     } else {
            //                         resolve();
            //                     }
            //                 });
            //         });
            //     });

            //     Promise.all(detailPromises)
            //         .then(() => {
            //             db.query(sql.order_goods_cnt, [order_detail.goods_cnt, order_detail.goods_no], function (error) {
            //                 if (error) {
            //                     return response.status(500).json({
            //                         message: 'DB_error'
            //                     });
            //                 }

            //                 if (order.order_dc > 0) {
            //                     db.query(sql.order_usepoint, [order.order_dc, order.user_no], function (error) {
            //                         if (error) {
            //                             return response.status(500).json({
            //                                 message: 'DB_error'
            //                             });
            //                         }

            //                         return response.status(200).json({
            //                             message: '완료'
            //                         });
            //                     });
            //                 } else {
            //                     return response.status(200).json({
            //                         message: '완료'
            //                     });
            //                 }
            //             });
            //         })
            //         .catch(() => {
            //             return response.status(500).json({
            //                 message: 'DB_error'
            //             });
            //         });
            // } else {
            //     // order_detail이 배열이 아닌 경우에는 해당 주문 상세 정보 하나만 처리
            //     db.query(sql.order_payment_detail, [orderTradeNo, order_detail.goods_no, order_detail.order_goods_nm, order_detail.order_goods_price,
            //         order_detail.order_goods_img, order_detail.order_goods_cnt],
            //         function (error, results, fields) {
            //             if (error) {
            //                 return response.status(500).json({
            //                     message: 'DB_error'
            //                 });
            //             }
            //             db.query(sql.order_goods_cnt, [order_detail.goods_cnt, order_detail.goods_no], function (error) {
            //                 if (error) {
            //                     return response.status(500).json({
            //                         message: 'DB_error'
            //                     });
            //                 }

            //                 if (order.order_dc > 0) {
            //                     db.query(sql.order_usepoint, [order.order_dc, order.user_no], function (error) {
            //                         if (error) {
            //                             return response.status(500).json({
            //                                 message: 'DB_error'
            //                             });
            //                         }

            //                         return response.status(200).json({
            //                             message: '완료'
            //                         });
            //                     });
            //                 } else {
            //                     return response.status(200).json({
            //                         message: '완료'
            //                     });
            //                 }
            //             });
            //         });
            // }
        });
});

// 주문 리스트
router.get('/orderlist/:userno', function (request, response, next) {

    const userno = request.params.userno;
    db.query(sql.get_order_list, [userno], function (error, results, fields) {
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
router.get('/orderDDetail/:orderno', function (request, response, next) {
    const orderno = request.params.orderno;
    db.query(sql.orderlist_d_detail, [orderno], function (error, results, fields) {
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


// admi 주문관리 정렬방식 
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


        // 주문 상세에서 리뷰 체크 속성 0 -> 1 변경
        // db.query(sql.check_review, [review.order_no], function (error, results, fields) {
        //     if (error) {
        //         console.error(error);
        //         return response.status(500).json({ error: 'error' });
        //     }
        // })

        return response.status(200).json({
            message: 'review_complete'
        });
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

router.get('/allGoodsPage/:num', function (request, response, next) {
    const num = parseInt(request.params.num) * 10

    db.query(sql.all_goods_page, [num], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: 'DB 에러' });
        }
        return response.json(results);
    })
})

router.get('/allGoods', function (request, response, next) {

    db.query(sql.all_goods, function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error:'DB 에러' });
        }
        return response.json(results);
    })
})

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

module.exports = router;