const express = require('express');
const router = express.Router();
const db = require('../db/db.js');
const sql = require('../sql.js');
const bcrypt = require('bcrypt');  
const fs = require('fs');

const multer = require('multer');
const path = require('path');

// 카카오 회원가입
router.post('/kakaoJoinProcess', function (request, response) {
    const kakao = request.body;

    // 데이터 없을 시 가입
    db.query(sql.kakao_check, [kakao.user_id], function (error, results, fields) {
        if (results.length <= 0) {
            db.query(sql.kakaoJoin, [kakao.user_id, kakao.user_nick, kakao.user_id, kakao.user_access_token], function (error, result) {
                if (error) {
                    console.error(error);
                    return response.status(500).json({ error: 'error' });
                } else {
                    return response.status(200).json({
                        message: '저장완료'
                    })
                }
            })
        }
        // 데이터 있으면 로그인 화면으로 이동
        else {
            return response.status(200).json({
                message: 'already_exist_id'
            })
        }
    })
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

// 카카오 로그인
router.post('/kakaoLoginProcess', function (request, response) {
    const kakao = request.body;

    // 데이터 없을 시 회원가입도 진행
    db.query(sql.kakao_check, [kakao.user_id], function (error, results, fields) {
        if (results.length <= 0) {
            db.query(sql.kakaoJoin, [kakao.user_id, kakao.user_nick, kakao.user_id,  kakao.user_access_token], function (error, result) {
                if (error) {
                    console.error(error);
                    return response.status(500).json({ error: 'error' });
                }
            })
        }
        // 로그인 
        db.query(sql.get_user_no, [kakao.user_id], function (error, results, fields) {
            if (error) {
                console.log(error)
            }
            return response.status(200).json({
                message: results[0].user_no
            })
        })
    })
})

// 네이버 로그인
router.post('/naverlogin', function (request, response) {
    const naverlogin = request.body.naverlogin;

    //0717 23:26추가 네이버 중복 로그인 방지
    db.query(sql.naver_id_check, [naverlogin.id], function (error, results, fields) {
        if (error) {
            console.log(error);
            return response.status(500).json({
                message: 'DB_error'
            });
        }
        if (results.length > 0) {
            // 가입된 계정 존재 
            db.query(sql.get_user_no, [naverlogin.id], function (error, results, fields) {
                if (error) {
                    console.log(error)
                }
                return response.status(200).json({
                    message: results[0].user_no
                })
            })
        } else {
            // DB에 계정 정보 입력 
            db.query(sql.naverlogin, [naverlogin.email, naverlogin.id, naverlogin.nickname, null], function (error, result) {
                if (error) {
                    console.error(error);
                    return response.status(500).json({ error: 'error' });
                } else {
                    return response.status(200).json({
                        message: '저장완료'
                    })
                }
            })
        }
    })
})

// 아이디 체크
router.post('/id_check', function (request, response) {
    console.log(request.body);
    db.query(sql.id_check, [request.body.user_id], function (error, results, fields) {
        if(error) {
            return response.status(500).json({
                message: 'DB_error'
            })
        }
        if (results.length <= 0) {
            return response.status(200).json({
                message: 'available_id'
            })
        }
        else {
            return response.status(200).json({
                message: 'already_exist_id'
            })
        }
    })
})
// 전화번호 체크
router.post('/mobile_check', function (request, response) {
    console.log(request.body);
    db.query(sql.mobile_check, [request.body.user_mobile], function (error, results, fields) {
        if(error) {
            return response.status(500).json({
                message: 'DB_error'
            })
        }
        if (results.length <= 0) {
            return response.status(200).json({
                message: 'available_phone'
            })
        }
        else {
            return response.status(200).json({
                message: 'already_exist_phone'
            })
        }
    })
})

// 전화번호 체크2
router.post('/mobile_check2', function (request, response) {
    console.log(request.body);
    db.query(sql.mobile_check2, [request.body.user_mobile, request.body.user_no], function (error, results, fields) {
        if(error) {
            return response.status(500).json({
                message: 'DB_error'
            })
        }
        console.log(results.length);
        if (results.length <= 0) {
            return response.status(200).json({
                message: 'available_phone'
            })
        }
        else {
            return response.status(200).json({
                message: 'already_exist_phone'
            })
        }
    })
})

// 회원가입
router.post('/join_process', function (request, response) {

    const user = request.body;
    const encryptedPW = bcrypt.hashSync(user.user_pw, 10); // 비밀번호 암호화

    db.query(sql.id_check, [user.user_id], function (error, results, fields) {
        if (results.length <= 0) {
            db.query(sql.mobile_check, [user.user_mobile], function (error, results, fields) {
                if(results.length <= 0) {
                    db.query(sql.join, [user.user_id, user.user_email, user.user_nick, encryptedPW, user.user_mobile, user.user_zipcode, user.user_adr1, user.user_adr2], function (error, data) {
                        if (error) {
                            return response.status(500).json({
                                message: 'DB_error'
                            })
                        }
                        if(user.user_img == '') {
                            return response.status(200).json({
                                message: 'join_complete'
                            })
                        } else {
                            try {
                                // 유저 번호 불러오기
                                db.query(sql.get_user_no, [user.user_id], function (error, results, fields) {
                                    const filename = results[0].user_no

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
                                                message: 'join_complete'
                                            })
                                        }
                                    })
                                })   
                            }
                            catch (err) {
                                // 이미지 등록 실패
                                // -> DB에서 미리 등록한 상품도 다시 제거하기
                                db.query(sql.delete_goods, [goods.goods_nm], function (error, results, fields) {
                                    console.log(err);
                                    return response.status(200).json({
                                        message: 'image_add_fail'
                                    })
                                })
                            }
                        }
                    })
                }
                else {
                    return response.status(200).json({
                        message: 'already_exist_phone'
                    })
                }
            })
        }
        else {
            return response.status(200).json({
                message: 'already_exist_id'
            })
        }
    })
})

// 로그인 
router.post('/login_process', function (request, response) {
    const loginUser = request.body;

    db.query(sql.id_check, [loginUser.user_id], function (error, results, fields) {
        if (results.length <= 0) {
            return response.status(200).json({
                message: 'undefined_id'
            })
        }
        else {
            db.query(sql.login, [loginUser.user_id], function (error, results, fields) {
                const same = bcrypt.compareSync(loginUser.user_pw, results[0].user_pw);

                if (same) {
                    // ID에 저장된 pw 값과 입력한 pw값이 동일한 경우
                    db.query(sql.get_user_no, [loginUser.user_id], function (error, results, fields) {
                        return response.status(200).json({
                            message: results[0].user_no
                        })
                    })
                }
                else {
                    // 비밀번호 불일치
                    return response.status(200).json({
                        message: 'incorrect_pw'
                    })
                }
            })
        }
    })
})

// 관리자 체크 
router.post('/admin_check', function (request, response) {
    const loginUser = request.body;

    db.query(sql.admin_check, [loginUser.user_no], function (error, results, fields) {
        if (results[0].user_tp == 1) {
            // 로그인한 유저의 TP가 1(관리자)인 경우
            return response.status(200).json({
                message: 'admin'
            })
        }
        else {
            return response.status(200).json({
                message: 'user'
            })
        }
    })
})

// 회원리스트
router.get('/admin/userlist/:keyword', function (request, response, next) {

    const keyword = request.params.keyword;
    let search = '';

    if (keyword != 'none') {
        search = ' AND user_email Like "%' + keyword + '%" ';
    }

    db.query(sql.userlist + search, function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '회원리스트에러' });
        }
        response.json(results);
    });
});

// 회원 삭제
router.delete('/admin/userlist/:user_no', function (request, response, next) {
    const userNo = request.params.user_no;

    db.query(sql.deleteUser, [userNo], function (error, result, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '회원삭제에러' });
        }
        return response.status(200).json({ message: '회원삭제성공' });
    });
});

// 관리자_고양이정보
router.get('/admin/getCatData/:user_no', function (request, response, next) {
    const user_no = request.params.user_no;

    db.query(sql.cat_info, [user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '고양이정보에러' });
        }
        response.json(results);
    });
});

// 아이디 찾기 230711
router.post('/findId', function (request, response, next) {
    const user_email = request.body.user_email;

    db.query(sql.id_find, [user_email], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '회원 에러' });
        }

        if (results.length === 0) {
            // 이메일이 데이터베이스에 존재하지 않는 경우
            return response.status(404).json({ message: 'user_not_found' });
        }

        const user_id = results[0].user_id; // 사용자 아이디를 가져옴
        return response.status(200).json({
            message: 'user_email',
            user_id: user_id
        });
    });
});

// 랜덤 비밀번호 설정 코드 (사용 안함)
function generateTempPassword() {
    const length = 8; // 임시 비밀번호의 길이
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let tempPassword = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        tempPassword += characters[randomIndex];
    }

    return tempPassword;
}

// 비번 찾기 230711
router.post('/find_pass', function (request, response, next) {
    const user_id = request.body.user_id;
    const user_email = request.body.user_email;

    db.query(sql.user_check, [user_email, user_id], async function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '회원 에러' });
        }

        if (results.length == 0) {
            // 이메일이 데이터베이스에 존재하지 않는 경우
            return response.status(404).json({ message: 'user_not_found' });
        }

        const user_pw = generateTempPassword(); // 임시 비밀번호 생성

        const encryptedPW = bcrypt.hashSync(user_pw, 10); // 임시 비밀번호 암호화

        // 업데이트
        db.query(sql.pass_update_tem, [encryptedPW, user_id], function (error, results, fields) {
            if (error) {
                console.error(error);
                return response.status(500).json({ error: '비번 에러' });
            }
            return response.status(200).json({
                message: user_pw
            });
        });

    });
});

module.exports = router;