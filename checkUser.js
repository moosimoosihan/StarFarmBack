const { scheduleJob } = require('node-schedule');
const db = require('./db/db.js');
const sql = require('./sql.js');
const fs = require('fs');
const path = require('path');

module.exports = async () => {
    try {
        // 삭제 시간이 지난 유저들을 가져옴
        db.query(sql.getExpiredUsers, function (error, results, fields) {
            if(error) {
                console.error(error);
                return response.status(500).json({ error: 'DB 에러' });
            }
            
            // 삭제 시간이 지난 유저들을 삭제
            for (let i = 0; i < results.length; i++) {
                const user_no = results[i].user_no;

                console.log(results[i].user_no + '번 유저 삭제')

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
            }
        })
    } catch (error) {
        console.error(error);
    }

    // 삭제 기간이 아직 지나지 않은 유저들을 가져온 후 스케줄러를 통해 다시 실행
    try{
        db.query(sql.getNotExpiredUsers, function (error, results, fields) {
            if (error) {
                console.error(error);
                return response.status(500).json({ error: '회원에러' });
            }
            for(let i = 0; i < results.length; i++) {
                const user_no = results[i].user_no;
                console.log(results[i].user_no+'번 유저의 삭제 시간 : '+results[i].user_delete+' 스케줄러 실행')
                const job = scheduleJob(results[i].user_delete, function () {
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
                    db.query(sql.delete_chatroom, [user_no, user_no], function (error, results, fields) {
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
            }
        })
    } catch (error) {
        console.error(error);
    }
}