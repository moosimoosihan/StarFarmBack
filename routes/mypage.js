var express = require('express');
const router = express.Router();
const db = require('../db/db.js');
var sql = require('../sql.js');
const fs = require('fs');
const path = require("path");
const multer = require('multer');
const bcrypt = require('bcrypt');
const { scheduleJob } = require('node-schedule');

// 이미지 업로더 
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

// 마이페이지
router.get('/mypage/:user_no', function (request, response, next) {
    const user_no = request.params.user_no;

    db.query(sql.get_user_info, [user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '회원에러' });
        }
        response.json(results);
    });
});

//마이페이지 페이징 라우터
router.get('/mypage')

//마이페이지 메인 내가 찜한 상품
router.get('/likelist_preview/:user_no', function (request, response, next) {
    const user_no = request.params.user_no;

    db.query(sql.mypage_like_list2, [user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '찜목록 에러' });
        }
        response.json(results);
    })
})
//마이페이지 메인 나의 입찰 상품
router.get('/orderlist_preview/:user_no', function (request, response, next) {
    const user_no = request.params.user_no;

    db.query(sql.mypage_orderList2, [user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '입찰목록 에러' });
        }
        response.json(results);
    })
})
// 마이페이지 나의 판매 상품
router.get('/saleList_preview/:user_no', function (request, response, next) {
    const user_no = request.params.user_no;

    db.query(sql.mypage_saleList2, [user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '판매목록 에러' });
        }
        response.json(results);
    })
})

// 판매 상품 리스트
router.get('/salelist/:user_no/:sort/:page', function (request, response, next) {
    const user_no = request.params.user_no;
    var sort = request.params.sort;
    if(sort=='none'){
        sort = ''
    } else if(sort=='0'){
        sort = ` and goods_state = 0`
    } else if(sort=='1'){
        sort = ` and goods_state = 1`
    } else if(sort=='2') {
        sort = ` and goods_state = 2`
    } else {
        sort = ` and goods_state = 3`
    }
    const page = ` limit ${request.params.page*10}, 10`;

    db.query(sql.mypage_saleList + sort + page, [user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '회원에러' });
        }
        response.json(results);
    });
});

// 판매 상품 갯수 불러오기
router.get('/salelistCount/:user_no/:sort', function (request, response, next) {
    const user_no = request.params.user_no;
    var sort = request.params.sort;
    if(sort=='none'){
        sort = ''
    } else if(sort=='0'){
        sort = ` and goods_state = 0`
    } else if(sort=='1'){
        sort = ` and goods_state = 1`
    } else if(sort=='2') {
        sort = ` and goods_state = 2`
    } else {
        sort = ` and goods_state = 3`
    }

    db.query(sql.mypage_saleList_count + sort, [user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '회원에러' });
        }
        response.json(results);
    });
})

// 관심 상품 리스트
router.get('/likelist/:user_no/:sort/:num', function (request, response, next) {
    const user_no = request.params.user_no;
    var sort = request.params.sort;
    if(sort=='none'){
        sort = ' order by g.goods_upload_date desc'
    } else if(sort=='0'){
        sort = ` and goods_state = 0 order by g.goods_upload_date desc`
    } else if(sort=='1'){
        sort = ` and goods_state = 1 order by g.goods_upload_date desc`
    } else if(sort=='2') {
        sort = ` and goods_state = 2 order by g.goods_upload_date desc`
    } else {
        sort = ` and goods_state = 3 order by g.goods_upload_date desc`
    }
    const num = ` limit ${request.params.num*10}, 10`;


    db.query(sql.mypage_likeList + sort + num, [user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '회원에러' });
        }
        response.json(results);
    });
});

// 마이페이지 찜 상품 총 갯수
router.get('/likecount/:user_no/:sort', function (request, response, next) {
    const user_no = request.params.user_no;
    var sort = request.params.sort;
    if(sort=='none'){
        sort = ''
    } else if(sort=='0'){
        sort = ` and goods_state = 0`
    } else if(sort=='1'){
        sort = ` and goods_state = 1`
    } else if(sort=='2') {
        sort = ` and goods_state = 2`
    } else {
        sort = ` and goods_state = 3`
    }

    db.query(sql.mypage_likeList_count + sort, [user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '회원에러' });
        }
        response.json(results);
    });
})

// 마이 리뷰
router.get('/myreview/:user_no/:page', function (request, response, next) {
    const user_no = request.params.user_no;
    const page = ` limit ${request.params.page*10}, 10`;

    db.query(sql.mypage_review + page, [user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '회원에러' });
        }
        response.json(results);
    });
});


// 회원 탈퇴
router.delete('/mypage/user/:user_no', function (request, response, next) {
    const userNo = request.params.user_no;

    db.query(sql.deleteUser, [userNo], function (error, result, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '회원탈퇴에러' });
        }
        return response.status(200).json({ message: '회원탈퇴성공' });
    });
});

// 정보 수정
router.post('/mypageupdate', function (request, response, next) {
    const user = request.body;
    db.query(sql.mobile_check2, [user.user_mobile, user.user_no], function (error, results, fields) {
        if(results.length <= 0) {
            db.query(sql.mypage_update, [user.user_nick, user.user_email, user.user_mobile, user.user_zipcode, user.user_adr1, user.user_adr2, user.user_no], function (error, result, fields) {
                if (error) {
                    console.error(error);
                    return response.status(500).json({ error: 'mypage_update_error' });
                }
                if(user.user_img == '' || user.user_img == null) {
                    db.query(sql.add_user_img, [user.user_img, user.user_no], function (error, results, fields) {
                        if (error) {
                            throw error;
                        }
                        else {
                            // 해당 유저의 폴더 지우기
                            const dir = `${__dirname}` + `/../uploads/userImg/` + user.user_no;
                            if (fs.existsSync(dir)) {
                                fs.readdir(dir, (err, files) => {
                                    if (err) throw err;
                
                                    for (const file of files) {
                                        fs.unlink(path.join(dir, file), err => {
                                            if (err) throw err;
                                        });
                                    }
                                    fs.rmdir(dir, { recursive: true }, (err) => {
                                        if (err) throw err;
                                    });
                                });
                            }
                            return response.status(200).json({
                                message: 'mypage_update'
                            })
                        }
                    })
                } else {
                    try {
                        // 현재 이미지 지우고 새 이미지로 변경
                        const dir = `${__dirname}` + `/../uploads/userImg/` + user.user_no;
                        if (fs.existsSync(dir)) {
                            fs.readdir(dir, (err, files) => {
                                if (err) throw err;
            
                                for (const file of files) {
                                    fs.unlink(path.join(dir, file), err => {
                                        if (err) throw err;
                                    });
                                }
                                fs.rmdir(dir, { recursive: true }, (err) => {
                                    if (err) throw err;
                                });
                            });
                        }

                        const filename = user.user_no

                        const pastDir = `${__dirname}` + `/../uploads/` + user.user_img;
                        const newDir = `${__dirname}` + `/../uploads/userImg/${filename}`;
                        const extension = user.user_img.substring(user.user_img.lastIndexOf('.'))
                        
                        if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true });

                        fs.rename(pastDir, newDir+ '/' + filename + extension, (err) => {
                            if (err) {
                                throw err;
                            }
                        });

                        // 파일 변경 모두 성공했으면 바뀐 이름으로 DB에 입력 
                        db.query(sql.add_user_img, [filename+extension, filename], function (error, results, fields) {
                            if (error) {
                                throw error;
                            }
                            else {
                                return response.status(200).json({
                                    message: 'mypage_update'
                                })
                            }
                        })
                    }
                    catch (err) {
                        // 이미지 등록 실패
                        // -> DB에서 미리 등록한 유저도 다시 제거하기
                        db.query(sql.delete_user, [user.user_id], function (error, results, fields) {
                            console.log(err);
                            return response.status(200).json({
                                message: 'image_add_fail'
                            })
                        })
                    }
                }
            });
        } else {
            return response.status(200).json({
                message: 'already_exist_phone'
            })
        }
    })
});

// 정보
router.get('/getUserData', function (request, response, next) {
    const user_no = request.query.user_no;

    db.query(sql.user_info, [user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '정보에러' });
        }
        response.json(results);
    });
});

// 비밀번호 변경
router.post('/pass_process', function (request, response) {
    const pass = request.body;

    db.query(sql.get_password, [pass.user_no], function (error, results, fields) {
        if (results.length <= 0) {
            if (error) {
                return response.status(500).json({
                    message: 'DB_error'
                });
            }
        } else {
            const same = bcrypt.compareSync(pass.user_pw, results[0].user_pw);

            if (!same) {    // 비밀번호 체크
                return response.status(200).json({
                    message: 'pw_ck'
                });
            }
            const encryptedNewPW = bcrypt.hashSync(pass.user_npw, 10); // 새 비밀번호 암호화

            db.query(sql.pass_update, [encryptedNewPW, pass.user_no], function (error, results, fields) {
                if (error) {
                    return response.status(500).json({
                        message: 'DB_error'
                    });
                }

                return response.status(200).json({
                    message: 'pass_update'
                });
            });
        }
    });
});

// 내 리뷰 불러오기
router.get('/getMyReview/:user_no', function (request, response, next) {
    const user_no = request.params.user_no;

    db.query(sql.get_my_review, [user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '회원에러' });
        }
        response.json(results);
    });
})

// 입찰상품 리스트
router.get('/orderlist/:user_no/:sort/:page', function (request, response, next) {
    const user_no = request.params.user_no;
    var sort = request.params.sort;
    if(sort=='none'){
        sort = ' group by g.goods_no'
    } else if(sort=='0'){
        sort = ` and g.goods_state = 0 group by g.goods_no`
    } else if(sort=='1'){
        sort = ` and g.goods_state = 1 group by g.goods_no`
    } else if(sort=='2') {
        sort = ` and g.goods_state = 2 group by g.goods_no`
    } else {
        sort = ` and g.goods_state = 3 group by g.goods_no`
    }
    const page = ` limit ${request.params.page*10}, 10`;

    db.query(sql.mypage_orderList + sort + page, [user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '회원에러' });
        }
        response.json(results);
    });
});

//판매자 상품 불러오기
router.get('/get_user_product/:user_no', function (request, response, next) {
    const user_no = request.params.user_no;

    db.query(sql.get_user_product, [user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '상품에러' });
        }
        response.json(results);
    });
});

//판매자 리뷰 불러오기
router.get('/get_user_review/:user_no', function (request, response, next) {
    const user_no = request.params.user_no;

    db.query(sql.get_user_review, [user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '리뷰에러' });
        }
        response.json(results);
    })
})

// 채팅방 리스트 불러오기
router.get('/getChatRoom/:user_no/:page', function (request, response, next) {
    const user_no = request.params.user_no;
    const page = ` limit ${request.params.page*10}, 10`;

    db.query(sql.get_chat_room + page, [user_no, user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '채팅에러' });
        }
        response.json(results);
    })
})

// 채팅방 최근 대화 불러오기
router.get('/chatroomcomment/:chat_room_no', function (request, response, next) {
    const chat_room_no = request.params.chat_room_no;

    db.query(sql.get_comment, [chat_room_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '채팅에러' });
        }
        response.json(results);
    })
})

// 회원 탈퇴시 회원 테이블의 USER_DELETE 컬럼에 한달 뒤 날짜 입력 후 1개월 뒤에 삭제 스케줄링
router.post('/deleteUser/:user_no', function (request, response, next) {
    const user_no = request.params.user_no;

    db.query(sql.delete_user_month, [user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '회원에러' });
        }
        const job = scheduleJob('0 0 0 1 * *', function () {
            // 먼저 TB_ORDER 테이블에서 해당 유저의 주문 내역 삭제
            db.query(sql.delete_order, [user_no], function (error, results, fields) {
                if (error) {
                    console.error(error);
                    return response.status(500).json({ error: '주문내역에러' });
                }
            })

            // TB_LIKE 테이블에서 해당 유저의 찜 목록 삭제
            db.query(sql.delete_like, [user_no], function (error, results, fields) {
                if (error) {
                    console.error(error);
                    return response.status(500).json({ error: '찜목록에러' });
                }
            })

            // TB_CHAT 테이블에서 해당 유저의 채팅 내역 삭제
            db.query(sql.delete_chat, [user_no], function (error, results, fields) {
                if (error) {
                    console.error(error);
                    return response.status(500).json({ error: '채팅내역에러' });
                }
            })

            // TB_CHATROOM 테이블에서 해당 유저의 채팅방 삭제
            db.query(sql.delete_chatroom, [user_no], function (error, results, fields) {
                if (error) {
                    console.error(error);
                    return response.status(500).json({ error: '채팅방에러' });
                }
            })

            // TB_REVIEW 테이블에서 해당 유저의 리뷰 삭제
            db.query(sql.delete_review, [user_no], function (error, results, fields) {
                if (error) {
                    console.error(error);
                    return response.status(500).json({ error: '리뷰에러' });
                }
            })

            // TB_REVIEW 테이블에서 해당 유저에게 쓴 리뷰 삭제
            db.query(sql.delete_review_2, [user_no], function (error, results, fields) {
                if (error) {
                    console.error(error);
                    return response.status(500).json({ error: '리뷰에러' });
                }
            })

            // TB_REPORT 테이블에서 해당 유저의 신고 내역을 삭제하기 전 해당 신고 내역의 상품 번호를 가져와 해당 번호의 폴더들을 삭제
            db.query(sql.get_report_no_2, [user_no], function (error, results, fields) {
                if (error) {
                    console.error(error);
                    return response.status(500).json({ error: '신고이미지에러' });
                }
                for (let i = 0; i < results.length; i++) {
                    const dir = `${__dirname}` + `/../uploads/reportImg/` + results[i].report_no;
                    if (fs.existsSync(dir)) {
                        fs.readdir(dir, (err, files) => {
                            if (err) throw err;

                            for (const file of files) {
                                fs.unlink(path.join(dir, file), err => {
                                    if (err) throw err;
                                });
                            }
                            fs.rmdir(dir, { recursive: true }, (err) => {
                                if (err) throw err;
                            });
                        });
                    }
                }
            })

            // TB_REPORT 테이블에서 해당 유저의 신고 내역 삭제
            db.query(sql.delete_report_2, [user_no], function (error, results, fields) {
                if (error) {
                    console.error(error);
                    return response.status(500).json({ error: '신고내역에러' });
                }
            })

            // TB_BID 테이블에서 해당 유저의 입찰 내역 삭제
            db.query(sql.delete_bid, [user_no], function (error, results, fields) {
                if (error) {
                    console.error(error);
                    return response.status(500).json({ error: '입찰내역에러' });
                }
            })

            // 상품을 삭제하기 전 해당 상품의 이미지를 상품 번호를 가져와 해당 번호의 폴더들을 삭제
            db.query(sql.get_goods_no_2, [user_no], function (error, results, fields) {
                if (error) {
                    console.error(error);
                    return response.status(500).json({ error: '상품이미지에러' });
                }
                for (let i = 0; i < results.length; i++) {
                    const dir = `${__dirname}` + `/../uploads/uploadGoods/` + results[i].goods_no;
                    if (fs.existsSync(dir)) {
                        fs.readdir(dir, (err, files) => {
                            if (err) throw err;

                            for (const file of files) {
                                fs.unlink(path.join(dir, file), err => {
                                    if (err) throw err;
                                });
                            }
                            fs.rmdir(dir, { recursive: true }, (err) => {
                                if (err) throw err;
                            });
                        });
                    }
                    // 해당 상품의 모든 입찰 내역도 같이 삭제
                    db.query(sql.delete_bid_2, [results[i].goods_no], function (error, results, fields) {
                        if (error) {
                            console.error(error);
                            return response.status(500).json({ error: '입찰내역에러' });
                        }
                    })
                }
            })

            // TB_GOODS 테이블에서 해당 유저의 상품 삭제
            db.query(sql.delete_goods_3, [user_no], function (error, results, fields) {
                if (error) {
                    console.error(error);
                    return response.status(500).json({ error: '상품에러' });
                }
            })

            // 유저를 삭제하기 전 해당 유저의 이미지를 유저 번호를 가져와 해당 번호의 폴더를 삭제
            for (let i = 0; i < results.length; i++) {
                const dir = `${__dirname}` + `/../uploads/userImg/` + user_no;
                if (fs.existsSync(dir)) {
                    fs.readdir(dir, (err, files) => {
                        if (err) throw err;

                        for (const file of files) {
                            fs.unlink(path.join(dir, file), err => {
                                if (err) throw err;
                            });
                        }
                        fs.rmdir(dir, { recursive: true }, (err) => {
                            if (err) throw err;
                        });
                    });
                }
            }

            // TB_USER 테이블에서 해당 유저 삭제
            db.query(sql.delete_user2, [user_no], function (error, results, fields) {
                if (error) {
                    console.error(error);
                    return response.status(500).json({ error: '회원에러' });
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
    return response.status(200).json({ message: 'delete_success' });
});

router.get('/orderCount/:user_no/:sort', function (request, response, next) {
    const user_no = request.params.user_no;
    var sort = request.params.sort;
    if(sort=='none'){
        sort = ' group by b.goods_no';
    } else if(sort=='0') {
        sort = ` and g.GOODS_STATE = 0 group by b.goods_no`
    } else if(sort=='1'){
        sort = ` and g.GOODS_STATE = 1 group by b.goods_no`
    } else if(sort=='2') {
        sort = ` and g.GOODS_STATE = 2 group by b.goods_no`
    } else {
        sort = ` and g.GOODS_STATE = 3 group by b.goods_no`
    }

    db.query(sql.all_bid_count + sort, [user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '주문내역에러' });
        }
        response.json(results);
    })
})

router.get('/getChatRoomCount/:user_no', function(request, response) {
    const user_no = request.params.user_no;

    db.query(sql.get_chatroom_count, [user_no, user_no], function(error, result, fields){
        if(error){
            console.log(error);
            response.status(500).send('Internal Server Error');
        }
        response.status(200).send(result);
    })
})

router.get('/myreviewCount/:user_no', function(request, response) {
    const user_no = request.params.user_no;

    db.query(sql.get_my_review_count, [user_no], function(error, result, fields){
        if(error){
            console.log(error);
            response.status(500).send('Internal Server Error');
        }
        response.status(200).send(result);
    })
})

router.get('/orderlistCount/:user_no/', function(request, response) {
    const user_no = request.params.user_no;

    db.query(sql.mypage_orderList_count, [user_no], function(error, result, fields){
        if(error){
            console.log(error);
            response.status(500).send('Internal Server Error');
        }
        response.status(200).send(result);
    })
})

module.exports = router;