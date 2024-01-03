var express = require('express');
const router = express.Router();
const db = require('../db/db.js');
var sql = require('../sql.js');
const fs = require('fs');
const path = require("path");
const multer = require('multer');
const bcrypt = require('bcrypt');

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

// 판매 상품 리스트
router.get('/salelist/:user_no', function (request, response, next) {
    const user_no = request.params.user_no;

    db.query(sql.mypage_saleList, [user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '회원에러' });
        }
        response.json(results);
    });
});

// 관심 상품 리스트
router.get('/likelist/:user_no', function (request, response, next) {
    const user_no = request.params.user_no;

    db.query(sql.mypage_likeList, [user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '회원에러' });
        }
        response.json(results);
    });
});

// 마이 리뷰
router.get('/myreview/:user_no', function (request, response, next) {
    const user_no = request.params.user_no;

    db.query(sql.mypage_review, [user_no], function (error, results, fields) {
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

    db.query(sql.mypage_update, [user.user_id, user.user_nick, user.user_email, user.user_mobile, user.user_zipcode, user.user_adr1, user.user_adr2, user.user_no], function (error, result, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: 'mypage_update_error' });
        }
        return response.status(200).json({ message: 'mypage_update' });
    });
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

// 찜 리스트
router.post('/likeList/:user_no', function (request, response, next) {
    const user_no = request.params.user_no;

    db.query(sql.like_list, [user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '에러' });
        }
        return response.status(200).json(results);
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
router.get('/orderlist/:user_no', function (request, response, next) {
    const user_no = request.params.user_no;

    db.query(sql.mypage_orderList, [user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '회원에러' });
        }
        response.json(results);
    });
});

module.exports = router;