const express = require('express');
const router = express.Router();
const db = require('../db/db.js');
const sql = require('../sql.js');

router.get('/getChatRoom/:user1/:user2', function(request, response) {
    const user1 = request.params.user1;
    const user2 = request.params.user2;

    db.query(sql.chat_room_check, [user1, user2], function(error, result, fields){
        if(result.length < 1){
            // 채팅방이 없을 경우 채팅방 생성
            db.query(sql.create_chat_room, [user1, user2], function(error, result, fields){
                if(error){
                    console.log(error);
                    response.status(500).send('Internal Server Error');
                }
                db.query(sql.chat_room_check, [user1, user2], function(error, result, fields){
                    if(error){
                        console.log(error);
                        response.status(500).send('Internal Server Error');
                    } else {
                        response.status(200).send(result);
                    }
                })
            })
        } else {
            response.status(200).send(result);
        }
    })
})

router.get('/getChat/:chat_room_no', function(request, response) {
    const chat_room_no = request.params.chat_room_no;

    db.query(sql.get_chat, [chat_room_no], function(error, result, fields){
        if(error){
            console.log(error);
            response.status(500).send('Internal Server Error');
        }
        response.status(200).send(result);
    })
})

router.post('/send', function(request, response) {
    const chat_room_no = request.body.chatroom_no;
    const user_no = request.body.user_no;
    const content = request.body.chat_content;

    // 만약 상대방이 채팅방을 나갔을 경우 채팅을 보냈다면 다시 채팅방에 들어오게 만들기
    db.query(sql.get_room, [chat_room_no], function(error, results, fields){
        if(results[0].CHATROOM_USER1!=user_no && results[0].CHATROOM_OUT1==1) {
            db.query(sql.chat_room_in1, [chat_room_no], function(error, result, fields){
                if(error){
                    console.log(error);
                    response.status(500).send('Internal Server Error');
                }
            })
        } else if(results[0].CHATROOM_USER2!=user_no && results[0].CHATROOM_OUT2==1) {
            db.query(sql.chat_room_in2, [chat_room_no], function(error, result, fields){
                if(error){
                    console.log(error);
                    response.status(500).send('Internal Server Error');
                }
            })
        }
        // 알람을 보낼 상대 유저 번호 가져오기
        var other_user_no = results[0].CHATROOM_USER1 != user_no ? results[0].CHATROOM_USER1 : results[0].CHATROOM_USER2;
        // 알람 보내기
        db.query(sql.add_alram, [0, other_user_no], function(error, results, fields){
            if(error){
                console.log(error);
                response.status(500).send('Internal Server Error');
            }
        })
    })

    db.query(sql.send_chat, [chat_room_no, user_no, content], function(error, result, fields){
        if(error){
            console.log(error);
            response.status(500).send('Internal Server Error');
        }
        response.status(200).json({message:'success'})
    })
})

// 채팅방 나가기
router.post('/outChatRoom', function(request, response) {
    const chat_room_no = request.body.room_no;
    const user_no = request.body.user_no;
    

    db.query(sql.get_room, [chat_room_no], function(error, results, fields){
        if(results[0].CHATROOM_USER1===user_no && results[0].CHATROOM_OUT1===0) {
            if(results[0].CHATROOM_OUT2===1) {
                // 둘 다 나갔을 경우 채팅내역 삭제 및 채팅방 삭제
                db.query(sql.delete_chatroom_chat, [chat_room_no], function(error, result, fields){
                    if(error){
                        console.log(error);
                        response.status(500).send('Internal Server Error');
                    }
                    db.query(sql.delete_chat_room, [chat_room_no], function(error, result, fields){
                        if(error){
                            console.log(error);
                            response.status(500).send('Internal Server Error');
                        }
                    })
                })
                return response.status(200).json({message:'success'})
            }
            db.query(sql.chat_room_out1, [chat_room_no], function(error, result, fields){
                if(error){
                    console.log(error);
                    response.status(500).send('Internal Server Error');
                }
            })
        } else if(results[0].CHATROOM_USER2===user_no && results[0].CHATROOM_OUT2===0) {
            if(results[0].CHATROOM_OUT1===1) {
                // 둘 다 나갔을 경우 채팅내역 삭제 및 채팅방 삭제
                db.query(sql.delete_chat, [chat_room_no], function(error, result, fields){
                    if(error){
                        console.log(error);
                        response.status(500).send('Internal Server Error');
                    }
                    db.query(sql.delete_chat_room, [chat_room_no], function(error, result, fields){
                        if(error){
                            console.log(error);
                            response.status(500).send('Internal Server Error');
                        }
                    })
                })
                return response.status(200).json({message:'success'})
            }
            db.query(sql.chat_room_out2, [chat_room_no], function(error, result, fields){
                if(error){
                    console.log(error);
                    response.status(500).send('Internal Server Error');
                }
            })
        }
        response.status(200).json({message:'success'})
    })
})

// 알람 지우기
router.post('/chat_delete_alram/:user_no', function(request, response) {
    const user_no = request.params.user_no;

    db.query(sql.chat_delete_alram, [user_no], function(error, result, fields){
        if(error){
            console.log(error);
            response.status(500).send('Internal Server Error');
        }
        response.status(200).json({message:'success'})
    })
})

module.exports = router;