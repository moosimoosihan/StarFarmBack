module.exports = {

  // auth
  join: `INSERT INTO tb_user (user_id, user_email, user_nick, user_pw, user_mobile, user_zipcode, user_adr1, user_adr2) VALUES(?,?,?,?,?,?,?,?)`,

  id_check: `SELECT * FROM tb_user WHERE user_id = ?`,
  mobile_check: `SELECT * FROM tb_user WHERE user_mobile = ?`,
  mobile_check2: `SELECT * FROM tb_user WHERE user_mobile = ? and user_no != ?`,
  get_user_no: `SELECT user_no FROM tb_user WHERE user_id = ?`,
  login: `SELECT user_pw FROM tb_user WHERE user_id = ?`,
  add_user_img: `UPDATE tb_user SET user_img = ? WHERE user_no = ?`,
  ban_check: `SELECT user_ban FROM tb_user WHERE user_id = ?`,
  //카카오 로그인
  kakaoJoin: `INSERT INTO tb_user (user_id, user_nick, user_email, user_social_tp) VALUES(?,?,?,1)`,
  kakao_check: `SELECT * FROM tb_user WHERE user_id = ?`,
  //네이버 로그인
  naverlogin: `INSERT INTO tb_user (user_email, user_id, user_nick, user_social_tp, user_access_token) VALUES (?, ?, ?, 2, ?)`,
  naver_id_check: `SELECT * FROM tb_user WHERE user_id = ?`,

  // admin 기능 
  admin_check: `SELECT user_tp FROM tb_user WHERE user_no = ?`,
  report_userlist: `SELECT count(*) as count FROM tb_report`,
  ban_update_user: `UPDATE tb_user SET user_ban = ? where user_no = ?`,
  report_list: `SELECT REPORT_TITLE, REPORT_DATE, REPORT_NO, REPORT_IMG, REPORT_CATEGORY, REPORT_CONTENT, USER_NO, REPORT_USER_NO FROM tb_report`,
  report_info: `SELECT * FROM tb_report WHERE report_no = ?`,
  
  admin_orderlist: `SELECT g.goods_no, g.goods_nm, MAX(b.bid_amount), g.goods_state, g.goods_category, g.user_no, b.user_no, b.goods_no
                    FROM tb_goods g, tb_bid b
                    WHERE g.goods_no = b.goods_no
                    GROUP BY g.goods_no`,
  /* order_status_update: `UPDATE tb_order
                            SET ORDER_STATUS = ?
                            WHERE ORDER_TRADE_NO IN (?)`, */
  delete_user: `DELETE FROM tb_user WHERE user_id = ?`,
  userlist: `SELECT USER_NO, USER_ID, USER_NICK, USER_EMAIL, USER_BAN, USER_CREATE_DT FROM tb_user WHERE user_tp = 0`,
  allUsersPage : `SELECT count(*) as count FROM tb_user WHERE user_tp = 0`,
  totalUsercount : `SELECT count(*) as count FROM tb_user WHERE user_tp = 0`,
  totalGoodsCount : `SELECT count(*) as count FROM tb_goods WHERE delete_time is null`,
//select count(goods_no) as sell_count from tb_goods where GOODS_CATEGORY = ? and GOODS_CATEGORY_DETAIL = ? and GOODS_STATE = 2 and DELETE_TIME is null;

//select avg(GOODS_SUCC_PRICE) as avg_price from tb_goods where GOODS_CATEGORY = ? and GOODS_CATEGORY_DETAIL = ? and GOODS_STATE = 2 and DELETE_TIME is null;
  // goods
  goods_add: `INSERT INTO tb_goods (goods_category, goods_category_detail, goods_nm, goods_content, goods_start_price, goods_trade, goods_deliv_price, goods_timer, user_no) VALUES (?,?,?,?,?,?,?,?,?)`,
  add_image: `UPDATE tb_goods SET goods_img = ? WHERE goods_no = ?`,
  goods_check: `SELECT * FROM tb_goods WHERE goods_nm = ?`,
  get_goods_no: `SELECT goods_no FROM tb_goods WHERE goods_nm = ?`,
  delete_goods: `UPDATE tb_goods SET delete_time = now() WHERE goods_no = ?`,
  delete_goods_2: `DELETE FROM tb_goods WHERE goods_nm = ?`,
  get_img_nm: `SELECT goods_img, goods_content FROM tb_goods WHERE goods_no = ?`,
  all_goods: `SELECT count(*) as count FROM tb_goods`,
  all_goods_page: `SELECT * FROM tb_goods`,
  goods_list: `SELECT goods_no, goods_category, goods_nm, goods_img, goods_start_price, goods_state, goods_timer, goods_content
                  FROM tb_goods
                  WHERE delete_time IS NULL and goods_state = 0
                  ORDER BY goods_upload_date desc
                  limit 10`,
  update_goods: `UPDATE tb_goods
                SET goods_nm = ?, goods_category = ?, goods_category_detail = ?, goods_start_price = ?, goods_timer = ?, goods_content = ?
                WHERE goods_no = ?`,
  goods_catelist: `SELECT goods_category, goods_no, goods_nm, goods_img, goods_start_price, goods_state
                       FROM tb_goods
                       WHERE goods_category = ?
                       ORDER BY goods_upload_date desc`,
  goods_cate_detail_list: `SELECT goods_category, goods_category_detail, goods_no, goods_nm, goods_img, goods_start_price, goods_state
                          FROM tb_goods
                          WHERE goods_category = ? and goods_categody_detail = ?
                          ORDER BY goods_upload_date desc`,
  goods_searchlist: `SELECT goods_no, goods_nm, goods_img, goods_start_price, goods_state, user_no, goods_timer, goods_content
                       FROM tb_goods
                       WHERE goods_nm LIKE ? and delete_time is null and goods_state = 0`,
  get_goods_info: `SELECT goods_no, goods_category, goods_category_detail, goods_nm, goods_img, goods_content, goods_state, goods_start_price, goods_timer, goods_trade, goods_deliv_price, user_no, goods_succ_price
                       FROM tb_goods
                       WHERE goods_no = ?`,
  // 상품 상세페이지 유저 정보 가져오기 tb_goods tb_user 조인
  get_goods_info_user: `SELECT u.user_nick, u.user_img, u.user_no, u.user_fr, u.user_adr1
                        FROM tb_goods g, tb_user u
                        WHERE g.goods_no = ? and g.user_no = u.user_no`,
    //메인페이지 찜카운트 전송
   main_popul_goods: `select g.goods_no, g.goods_nm, count(l.goods_no), g.goods_img, g.goods_start_price, g.goods_timer
                      from tb_goods g, tb_like l
                      where l.goods_no = g.goods_no and delete_time is null and goods_state = 0
                      group by g.goods_no
                      order by count(l.goods_no) desc
                      limit 3`,
  main_popul_empty_goods: `SELECT goods_no, goods_category, goods_nm, goods_img, goods_start_price, goods_state, goods_timer
                            FROM tb_goods
                            WHERE delete_time IS NULL and goods_state = 0
                            ORDER BY goods_upload_date desc
                            limit 3`,
  get_goods_user_no : `SELECT user_no FROM tb_goods WHERE goods_no = ?`,
  goods_comp : `UPDATE tb_goods SET goods_state = 2 WHERE goods_no = ?`,
  restore_goods : `UPDATE tb_goods SET delete_time = null WHERE goods_no = ?`,
  search_goods_count : `SELECT COUNT(*) as max_page FROM tb_goods WHERE goods_nm LIKE ? and delete_time is null and goods_state = 0`,
  search_category : `select goods_no, goods_nm, goods_img, goods_start_price, goods_state, user_no, goods_timer, goods_content
                    from tb_goods
                    where goods_category = ? and DELETE_TIME is null and GOODS_STATE = 0`,
  search_category_detail : `select goods_no, goods_nm, goods_img, goods_start_price, goods_state, user_no, goods_timer, goods_content
                            from tb_goods
                            where goods_category = ? and GOODS_CATEGORY_DETAIL = ? and DELETE_TIME is null and GOODS_STATE = 0`,
  search_category_count: `SELECT COUNT(*) as max_page FROM tb_goods WHERE goods_category = ? and delete_time is null and goods_state = 0`,
  search_category_detail_count: `SELECT COUNT(*) as max_page FROM tb_goods WHERE goods_category = ? and goods_category_detail = ? and delete_time is null and goods_state = 0`,

 //경매 입찰
 goods_auction: `SELECT g.goods_no, b.bid_no, b.bid_amount, b.user_no, u.user_nick
                 FROM tb_goods g, tb_bid b, tb_user u
                 WHERE g.goods_no = ? and g.goods_no = b.goods_no and b.user_no = u.user_no
                 ORDER BY bid_create_dt asc`,
 goods_bidding: `INSERT INTO tb_bid (bid_amount, goods_no, user_no) value (?,?,?)`,
 goods_succ_bid: `SELECT b.user_no, b.goods_no, max(b.bid_amount) as succ_bid, g.goods_state
                 FROM tb_bid b, tb_goods g
                 WHERE b.goods_no = ?
                 limit 1`,
  goods_succ_price: `UPDATE tb_goods SET goods_succ_price = ? WHERE goods_no = ?`,
  goods_succ_bid_update: `UPDATE tb_goods SET goods_succ_price = ?, goods_state = ? WHERE goods_no = ?`,
  // 경매 종료 시간이 지난 상품과 입찰 정보를 가져옴 tb_goods
  getExpiredGoods: `SELECT goods_no, goods_timer
                    FROM tb_goods
                    WHERE goods_timer < now() and goods_state = 0`,
  // 경매가 아직 진행중인 상품들을 가져옴 tb_goods
  getGoodsList : `SELECT goods_no, goods_timer
                  FROM tb_goods
                  WHERE goods_state = 0 and delete_time is null and goods_timer > now()`,
//-------------------------------------------------------------------------------------------
  order_payment: `INSERT INTO tb_order
                     (order_receive_nm, order_mobile, order_addr1, order_addr2, order_zipcode, order_content, goods_no, user_no)
                     VALUES (?,?,?,?,?,?,?,?)`,
  order_payment_no : `SELECT order_no FROM tb_order WHERE user_no = ? ORDER BY order_no DESC LIMIT 1`,
  order_info : `SELECT * FROM tb_order WHERE order_no = ?`,
  get_order_list: `SELECT * FROM tb_order WHERE user_no = ?`,
  order_count : `SELECT COUNT(*) as count FROM tb_order WHERE goods_no = ? and user_no = ?`,
  /* orderlist_detail: `SELECT * FROM tb_order WHERE ORDER_TRADE_NO = ?`,
  confirm_point: `UPDATE TB_USER
                    SET user_point = user_point + (SELECT (ORDER_TOTAL * 0.03) FROM TB_ORDER WHERE ORDER_TRADE_NO = ?)
                    WHERE user_no = ?`,
  cancel_point: `UPDATE TB_USER SET user_point = user_point + ? where user_no = ?`,
  cancel_goods: `UPDATE tb_goods SET goods_cnt = goods_cnt + ? where goods_no = ?`,
  check_review: `UPDATE tb_order_detail
                  SET REVIEW_CHECK = 1
                  WHERE ORDER_TRADE_NO = ?`, */

  // 마이페이지
  user_get_review: `SELECT * FROM tb_review`,
  get_user_info: `SELECT user_no, user_id, user_nick, user_email, user_img, user_mobile, user_zipcode, user_adr1, user_adr2, user_fr, user_social_tp, user_tp, user_ban
                  FROM tb_user
                  WHERE user_no = ?`,
  get_user_info_page: `SELECT user_no, user_id, user_nick, user_email, user_img, user_mobile, user_zipcode, user_adr1, user_adr2, user_fr, user_social_tp, user_tp, user_ban
                    FROM tb_user
                    WHERE user_no = ? limit 10`,
  mypage_update: `UPDATE tb_user 
                  SET user_nick = ?, user_email = ?, user_mobile =?, user_zipcode =?, user_adr1 =?, user_adr2 =?
                  WHERE user_no = ?`,
  mypage_orderList: `select g.goods_no, g.goods_nm, g.goods_start_price, g.goods_img, max(b.bid_amount) as bid_amount, b.goods_no, b.user_no, g.goods_state, g.goods_timer, g.goods_trade
                    from tb_goods g, tb_bid b
                    where g.goods_no = b.goods_no and b.user_no = ?`,
  mypage_saleList: `select * from tb_goods where delete_time is null and user_no = ?`,
  mypage_likeList: `select l.*, g.goods_nm, g.goods_img, g.goods_start_price, g.user_no, g.goods_state
                    from tb_like l, tb_goods g
                    where l.user_no = ? and l.goods_no = g.goods_no`,
  mypage_likeList_count: `select count(*) as count from tb_like where user_no = ?`,
  mypage_review: `select g.user_no, g.goods_img, u.user_nick, r.review_con, r.review_score, r.review_create_dt, g.goods_no, g.goods_nm
                  from tb_review r, tb_goods g, tb_user u
                  where r.user_no = ? and r.goods_no = g.goods_no and r.sell_user_no = u.user_no`,
  get_chat_room: `SELECT * FROM TB_CHATROOM WHERE CHATROOM_USER1 = ? and CHATROOM_OUT1 = 0 or CHATROOM_USER2 = ? and CHATROOM_OUT2 = 0`,
  get_comment: `SELECT c.CHAT_CONTENT FROM TB_CHAT c, TB_CHATROOM r WHERE c.CHATROOM_NO = ? ORDER BY c.CHAT_DATE DESC LIMIT 1`,
  mypage_like_list2: `SELECT l.*, g.goods_nm, g.goods_img, g.goods_start_price, g.user_no, g.goods_timer, g.goods_content
                      FROM tb_like l, tb_goods g
                      WHERE l.user_no = ? and l.goods_no = g.goods_no
                      ORDER BY g.goods_upload_date DESC limit 4`,
  mypage_orderList2: `select g.goods_no, g.goods_nm, g.goods_start_price, g.goods_img, max(b.bid_amount) as bid_amount, b.goods_no, b.user_no, g.goods_state, g.goods_timer, g.goods_content
                    from tb_goods g, tb_bid b
                    where g.goods_no = b.goods_no and b.user_no = ?
                    group by g.goods_no
                    order by g.goods_upload_date desc limit 4`,
  mypage_saleList2: `select * from tb_goods where delete_time is null and user_no = ? order by goods_upload_date desc limit 4`,
  mypage_saleList_count: `select count(*) as count from tb_goods where delete_time is null and user_no = ?`,
  get_my_review_count : `SELECT COUNT(*) as count FROM tb_review WHERE user_no = ?`,
  mypage_orderList_count: `select count(*) as count from tb_goods g, tb_order o where g.goods_no = o.goods_no and o.user_no = ?`,
  // 내가 입찰한 상품들의 수를 가져옴
  all_bid_count : `select count(*) as count
                    from tb_goods g, tb_bid b
                    where g.goods_no = b.goods_no and b.user_no = ?`,

  //유저페이지
  get_user_product: `SELECT goods_no, goods_nm, goods_img, user_no, goods_timer, goods_start_price, goods_content
                    FROM tb_goods
                    WHERE user_no = ?
                    order by goods_no desc limit 6`,
get_user_review: `SELECT r.review_no, r.review_con, r.user_no, r.review_score, r.review_create_dt, g.goods_no, g.goods_img, g.goods_nm, u.user_nick
                  FROM tb_review r, tb_goods g, tb_user u
                  WHERE r.sell_user_no = ? and u.user_no = r.user_no
                  group by review_no
                  order by r.review_no desc limit 5`,

  //pass
  get_password: 'SELECT user_pw FROM tb_user WHERE user_no = ?',
  pass_update: 'UPDATE tb_user SET user_pw = ? WHERE user_no = ?',
  pass_update_tem: `UPDATE tb_user SET user_pw = ? WHERE user_id = ?`,

  // 아이디 비번 찾기
  id_find: `SELECT user_id FROM tb_user WHERE user_email = ?`,
  user_check: `SELECT user_no FROM tb_user WHERE user_email = ? AND user_id = ?`,
  pass_update_tem: `UPDATE tb_user SET user_pw = ? WHERE user_id = ?`,

  // 좋아요(찜) 기능
  like_insert: `INSERT INTO tb_like (user_no, goods_no) VALUES (?,?)`,
  like_delete: `DELETE FROM tb_like WHERE user_no = ? AND goods_no = ?`,
  like_check: `SELECT * FROM tb_like WHERE user_no = ? AND goods_no = ?`,
  like_count: `SELECT COUNT(*) as like_count FROM tb_like WHERE goods_no = ?`,

  // 리뷰
  review_write: `INSERT INTO tb_review (review_con, user_no, goods_no, sell_user_no, review_score) VALUES (?, ?, ?, ?, ?)`,

  // 리뷰를 작성하기 위해 상품 정보 판매자 정보를 가져옴
  get_review_info: `SELECT g.goods_nm, g.goods_img, u.user_nick, u.user_img, u.user_no, g.goods_no
                    FROM tb_goods g, tb_user u
                    WHERE g.goods_no = ? and g.user_no = u.user_no`,
  get_my_review: `SELECT * 
                    FROM tb_review 
                    WHERE user_no = ? `,
  get_seller_review: `SELECT *
                      FROM tb_review
                      WHERE sell_user_no = ?`,
  review_count : `SELECT COUNT(*) as count FROM tb_review WHERE goods_no = ? and user_no = ?`,
  get_review_count : `SELECT COUNT(*) as count FROM tb_review WHERE goods_no = ? and sell_user_no = ?`,
  // 판매자가 구매자에게 리뷰를 쓸 경우 필요한 정보를 가져옴 구매자의 정보는 tb_bid에서 최고 입찰자의 정보를 가져옴
  get_sale_review_info: `SELECT g.goods_nm, g.goods_img, u.user_nick, u.user_img, u.user_no, g.goods_no
                          FROM tb_goods g, tb_user u, tb_bid b
                          WHERE g.goods_no = ? and b.user_no = u.user_no and b.goods_no = g.goods_no
                          ORDER BY b.bid_amount DESC LIMIT 1`,

  // 리뷰 점수 적용 먼저 유저의 user_fr을 가져오기
  get_user_fr: `SELECT user_fr FROM tb_user WHERE user_no = ?`,
  // 리뷰 점수 적용
  review_score_update: `UPDATE tb_user SET user_fr = ? WHERE user_no = ?`,
  

  // 신고
  report : `INSERT INTO tb_report (report_title, report_category, report_content, report_user_no, user_no) VALUES (?,?,?,?,?)`,
  report_img: `UPDATE tb_report SET report_img = ? WHERE report_no = ?`,
  get_report_no : `SELECT report_no FROM tb_report WHERE report_user_no = ? and user_no = ? ORDER BY report_no DESC LIMIT 1`,
  delete_report : `DELETE FROM tb_report WHERE report_user_no = ? and user_no = ? ORDER BY report_no DESC LIMIT 1`,
  get_report_count : `SELECT COUNT(*) as count FROM tb_report WHERE report_user_no = ?`,

  // 채팅
  chat_room_check : `SELECT * FROM TB_CHATROOM WHERE CHATROOM_USER1 = ? and CHATROOM_USER2 = ?`,
  create_chat_room : `INSERT INTO TB_CHATROOM (CHATROOM_USER1, CHATROOM_USER2) VALUES (?,?)`,
  get_chat : `SELECT * FROM TB_CHAT WHERE CHATROOM_NO = ?`,
  get_room : `SELECT * FROM TB_CHATROOM WHERE CHATROOM_NO = ?`,
  send_chat : `INSERT INTO TB_CHAT (chatroom_no, chat_user, chat_content) VALUES (?,?,?)`,
  chat_room_in1 : `UPDATE TB_CHATROOM SET CHATROOM_OUT1 = 0 WHERE CHATROOM_NO = ?`,
  chat_room_in2 : `UPDATE TB_CHATROOM SET CHATROOM_OUT2 = 0 WHERE CHATROOM_NO = ?`,
  chat_room_out1 : `UPDATE TB_CHATROOM SET CHATROOM_OUT1 = 1 WHERE CHATROOM_NO = ?`,
  chat_room_out2 : `UPDATE TB_CHATROOM SET CHATROOM_OUT2 = 1 WHERE CHATROOM_NO = ?`,
  delete_chatroom_chat : `DELETE FROM TB_CHAT WHERE CHATROOM_NO = ?`,
  delete_chat_room : `DELETE FROM TB_CHATROOM WHERE CHATROOM_NO = ?`,
  get_chatroom_count: `SELECT COUNT(*) as count FROM TB_CHATROOM WHERE CHATROOM_USER1 = ? and CHATROOM_OUT1 = 0 or CHATROOM_USER2 = ? and CHATROOM_OUT2 = 0`,

  // 유저 삭제시 필요한 삭제 쿼리 유저 테이블의 delete_time을 한달 뒤로 설정
  delete_user_month: `UPDATE tb_user SET user_delete = DATE_ADD(NOW(), INTERVAL 1 MONTH) WHERE user_no = ?`,
  // tb_order 테이블 삭제
  delete_order: `DELETE FROM tb_order WHERE user_no = ?`,
  // tb_like 테이블 삭제
  delete_like: `DELETE FROM tb_like WHERE user_no = ?`,
  // tb_chat 테이블 삭제
  delete_chat: `DELETE FROM tb_chat WHERE chat_user = ?`,
  // tb_chatroom 테이블 삭제
  delete_chatroom: `DELETE FROM tb_chatroom WHERE CHATROOM_USER1 = ? or CHATROOM_USER2 = ?`,
  // tb_review 테이블 삭제
  delete_review: `DELETE FROM tb_review WHERE user_no = ?`,
  // tb_report 테이블 삭제
  delete_report_2: `DELETE FROM tb_report WHERE user_no = ?`,
  // tb_bid 테이블 삭제
  delete_bid: `DELETE FROM tb_bid WHERE user_no = ?`,
  // tb_goods 테이블 삭제
  delete_goods_3: `DELETE FROM tb_goods WHERE user_no = ?`,
  // tb_user 테이블 삭제
  delete_user2: `DELETE FROM tb_user WHERE user_no = ?`,

  // 상품 이미지를 삭제하기 위하여 상품 번호를 가져옴
  get_goods_no_2: `SELECT goods_no FROM tb_goods WHERE user_no = ?`,

  // 신고 이미지를 삭제하기 위하여 신고 번호를 가져옴
  get_report_no_2 : `SELECT report_no FROM tb_report WHERE user_no = ?`,

  // 삭제 기간이 지난 유저들을 가져옴
  getExpiredUsers : `SELECT user_no FROM tb_user WHERE user_delete <= now()`,

  // 삭제 기간이 존재하고 지나지 않은 유저들을 가져옴
  getNotExpiredUsers : `SELECT user_no, user_delete FROM tb_user WHERE user_delete > now()`,

  // 해당 유저의 삭제 기간을 가져옴
  delete_check : `SELECT user_delete FROM tb_user WHERE user_id = ?`,

  // 해당 유저에게 쓴 리뷰 삭제
  delete_review_2 : `DELETE FROM tb_review WHERE SELL_USER_NO = ?`,

  // 해당 상품의 입찰내역도 모두 삭제
  delete_bid_2 : `DELETE FROM tb_bid WHERE goods_no = ?`,

  goods_count : `SELECT count(*) as count FROM tb_goods`,
  goods_add2 : `INSERT INTO tb_goods (goods_category, goods_category_detail, goods_nm, goods_content, goods_start_price, goods_trade, goods_deliv_price, user_no, goods_img, goods_timer) VALUES (?,?,?,?,?,?,?,?,?,`,

  // 판매자가 해당 상품의 리뷰를 작성 할 수 있는 권한이 있는지 체크
  sale_review_check : `SELECT * FROM tb_goods WHERE goods_no = ? and user_no = ?`,

  // 구매자가 해당 상품의 리뷰를 작성 할 수 있는 권한이 있는지 체크
  // 구매자를 확인하려면 tb_bid 테이블에서 해당 상품의 최고 입찰자를 가져와야함
  review_check : `SELECT tb_bid.goods_no, tb_bid.user_no, MAX(tb_bid.bid_amount) AS max_bid_amount
                  FROM tb_bid JOIN tb_goods ON tb_bid.goods_no = tb_goods.goods_no JOIN tb_user ON tb_bid.user_no = tb_user.user_no
                  WHERE tb_bid.goods_no = ?
                  GROUP BY tb_bid.goods_no, tb_bid.user_no
                  ORDER BY MAX(TB_BID.bid_amount) desc
                  limit 1`,
  // 리뷰를 이미 작성했는지 체크
  sale_review_check2 : `SELECT * FROM tb_review WHERE goods_no = ? and user_no = ?`,
  sale_review_check3 : `SELECT * FROM tb_review WHERE goods_no = ? and sell_user_no = ?`,

  // 알람 추가
  chat_add_alram : `INSERT INTO TB_ALRAM(ALRAM_COUNT, USER_NO, SELECT_NUM) VALUE(0,?,?)`,
  auction_add_alram : `INSERT INTO TB_ALRAM(ALRAM_COUNT, USER_NO, SELECT_NUM) VALUE(1,?,?)`,

  chat_delete_alram : `DELETE FROM TB_ALRAM WHERE ALRAM_COUNT = 0 AND USER_NO = ? AND SELECT_NUM = ?`,
  auction_delete_alram : `DELETE FROM TB_ALRAM WHERE ALRAM_COUNT = 1 AND USER_NO = ? AND SELECT_NUM = ?`,

  chat_check_alram : `SELECT COUNT(*) as count FROM TB_ALRAM WHERE USER_NO = ? AND SELECT_NUM = ? AND ALRAM_COUNT = 0`,
  auction_check_alram : `SELECT COUNT(*) as count FROM TB_ALRAM WHERE USER_NO = ? AND SELECT_NUM = ? AND ALRAM_COUNT = 1`,
  check_alram : `SELECT COUNT(*) as count FROM TB_ALRAM WHERE USER_NO = ?`,
  all_auction_alram: `SELECT COUNT(*) as count FROM TB_ALRAM WHERE USER_NO = ? AND ALRAM_COUNT = 1`,
  all_chat_alram: `SELECT COUNT(*) as count FROM TB_ALRAM WHERE USER_NO = ? AND ALRAM_COUNT = 0`,
}