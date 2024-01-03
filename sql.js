module.exports = {

  // auth
  join: `INSERT INTO tb_user (user_id, user_email, user_nick, user_pw, user_mobile, user_zipcode, user_adr1, user_adr2) VALUES(?,?,?,?,?,?,?,?)`,

  id_check: `SELECT * FROM tb_user WHERE user_id = ?`,
  mobile_check: `SELECT * FROM tb_user WHERE user_mobile = ?`,
  mobile_check2: `SELECT * FROM tb_user WHERE user_mobile = ? and user_no != ?`,
  get_user_no: `SELECT user_no FROM tb_user WHERE user_id = ?`,
  login: `SELECT user_pw FROM tb_user WHERE user_id = ?`,
  add_user_img: `UPDATE tb_user SET user_img = ? WHERE user_no = ?`,
  //카카오 로그인
  kakaoJoin: `INSERT INTO tb_user (user_id, user_nick, user_email, user_social_tp, user_access_token) VALUES(?,?,?,1,?)`,
  kakao_check: `SELECT * FROM tb_user WHERE user_id = ?`,
  //네이버 로그인
  naverlogin: `INSERT INTO tb_user (user_email, user_id, user_nick, user_social_tp, user_access_token) VALUES (?, ?, ?, 2, ?)`,
  naver_id_check: `SELECT * FROM tb_user WHERE user_id = ?`,

  // admin 기능 
  admin_check: `SELECT user_tp FROM tb_user WHERE user_no = ?`,
  report_userlist: `SELECT u.user_no, u.user_id, u.user_nick, u.user_email, u.user_ban, u.user_create_dt, count(r.report_user_no)
                    FROM tb_user u, tb_report r
                    WHERE user_tp = 0 and r.report_user_no = u.user_no
                    GROUP BY u.user_no`,
  ban_update_user: `UPDATE tb_user SET user_ban = ? where user_no = ?`,

  
  admin_orderlist: `SELECT g.goods_no, g.goods_nm, MAX(b.bid_amount), g.goods_state, g.goods_category, g.user_no, b.user_no, b.goods_no
                    FROM tb_goods g, tb_bid b
                    WHERE g.goods_no = b.goods_no
                    GROUP BY g.goods_no`,
  /* order_status_update: `UPDATE tb_order
                            SET ORDER_STATUS = ?
                            WHERE ORDER_TRADE_NO IN (?)`, */

  // goods
  goods_add: `INSERT INTO tb_goods (goods_category, goods_category_detail, goods_nm, goods_content, goods_start_price, goods_trade, goods_deliv_price, goods_timer, user_no) VALUES (?,?,?,?,?,?,?,?,?)`,
  add_image: `UPDATE tb_goods SET goods_img = ? WHERE goods_no = ?`,
  goods_check: `SELECT * FROM tb_goods WHERE goods_nm = ?`,
  get_goods_no: `SELECT goods_no FROM tb_goods WHERE goods_nm = ?`,
  delete_goods: `UPDATE tb_goods SET delete_time = now() WHERE goods_no = ?`,
  delete_goods_2: `DELETE FROM tb_goods WHERE goods_nm = ?`,
  get_img_nm: `SELECT goods_img, goods_content FROM tb_goods WHERE goods_no = ?`,
  goods_list: `SELECT goods_no, goods_category, goods_nm, goods_img, goods_start_price, goods_state, goods_timer
                  FROM tb_goods
                  WHERE delete_time IS NULL
                  ORDER BY goods_upload_date desc`,
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
  goods_searchlist: `SELECT goods_no, goods_nm, goods_img, goods_start_price, goods_state
                       FROM tb_goods
                       WHERE goods_nm LIKE ?`,
  get_goods_info: `SELECT goods_no, goods_category, goods_nm, goods_img, goods_content, goods_state, goods_start_price, goods_timer, goods_trade, goods_deliv_price
                       FROM tb_goods
                       WHERE goods_no = ?`,
  get_goods_info_user: `SELECT g.goods_no, g.user_no, user_img, u.user_nick, u.user_fr, u.user_adr1
                       FROM tb_user u, tb_goods g
                       WHERE u.user_no = g.user_no`,
  main_popul_goods: `select g.goods_no, g.goods_nm, count(l.goods_no)
                    from tb_goods g, tb_like l
                    where l.goods_no = g.goods_no
                    group by g.goods_no
                    order by count(l.goods_no) desc`,

 //경매 입찰
 goods_auction: `SELECT g.goods_no, b.bid_no, b.bid_amount, b.user_no, u.user_nick
                 FROM tb_goods g, tb_bid b, tb_user u
                 WHERE g.goods_no = ? and g.goods_no = b.goods_no and b.user_no = u.user_no
                 ORDER BY bid_create_dt asc`,
 goods_bidding: `INSERT INTO tb_bid (bid_amount, goods_no, user_no) value (?,?,?)`,
 goods_succ_bid: `SELECT b.user_no, b.goods_no, max(b.bid_amount) as succ_bid
                 FROM tb_bid b, tb_goods g
                 WHERE b.goods_no = ?
                 limit 1`,
  goods_succ_price: `UPDATE tb_goods SET goods_succ_price = ? WHERE goods_no = ?`,
//-------------------------------------------------------------------------------------------
/*  order_payment: `INSERT INTO tb_order
                     (order_receive_nm, order_mobile, order_addr1, order_addr2, order_content, user_no)
                     VALUES (?,?,?,?,?,?)`,
  orderlist: `SELECT od.*, o.ORDER_STATUS, o.ORDER_CREATE_DT, o.ORDER_TP
                  FROM tb_order_detail od
                  JOIN tb_order o ON od.ORDER_TRADE_NO = o.ORDER_TRADE_NO
                  WHERE o.user_no =?`,
  orderlist_detail: `SELECT * FROM tb_order WHERE ORDER_TRADE_NO = ?`,
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
  get_user_info: `SELECT user_no, user_id, user_nick, user_email, user_img, user_mobile, user_zipcode, user_adr1, user_adr2, user_fr, user_social_tp
                  FROM tb_user
                  WHERE user_no = ?`,
  mypage_update: `UPDATE tb_user 
                  SET user_nick = ?, user_email = ?, user_mobile =?, user_zipcode =?, user_adr1 =?, user_adr2 =?
                  WHERE user_no = ?`,
  mypage_orderList: `select g.goods_no, g.goods_nm, g.goods_start_price, g.goods_img, max(b.bid_amount) as bid_amount, b.goods_no, b.user_no, g.goods_state, g.goods_timer
                    from tb_goods g, tb_bid b
                    where g.goods_no = b.goods_no and b.user_no = ?
                    group by g.goods_no`,
  mypage_saleList: `select * from tb_goods where delete_time is null and user_no = ?`,
  mypage_likeList: `select l.*, g.goods_nm, g.goods_img, g.goods_start_price, g.user_no, u.user_nick
                    from tb_like l, tb_goods g, tb_user u
                    where l.user_no = ? and l.goods_no = g.goods_no`,
  mypage_review: `select g.user_no, g.goods_img, u.user_nick, r.review_con, r.review_score, r.review_create_dt, g.goods_no, g.goods_nm
                  from tb_review r, tb_goods g, tb_user u
                  where r.user_no = ? and r.goods_no = g.goods_no and r.sell_user_no = u.user_no`,


  //pass
  get_password: 'SELECT user_pw FROM tb_user WHERE user_no = ?',
  pass_update: 'UPDATE tb_user SET user_pw = ? WHERE user_no = ?',
  pass_update_tem: `UPDATE tb_user SET user_pw = ? WHERE user_id = ?`,

  // 아이디 비번 찾기
  id_find: `SELECT user_id FROM tb_user WHERE user_email = ?`,
  user_check: `SELECT user_no FROM tb_user WHERE user_email = ? AND user_id = ?`,


  // 좋아요(찜) 기능
  like_insert: `INSERT INTO tb_like (user_no, goods_no) VALUES (?,?)`,
  like_delete: `DELETE FROM tb_like WHERE user_no = ? AND goods_no = ?`,
  like_check: `SELECT * FROM tb_like WHERE user_no = ? AND goods_no = ?`,
  like_count: `SELECT COUNT(*) FROM tb_like WHERE goods_no = ?`,
  like_list: `SELECT l.*, g.goods_nm, g.goods_img, g.goods_start_price, g.user_no
              FROM tb_like l, tb_goods g
              WHERE l.user_no = ? and l.goods_no = g.goods_no`,


  //qna게시판
  /* content: `SELECT * FROM tb_qna JOIN tb_user 
                WHERE tb_qna.user_no=tb_user.user_no AND qna_no = ?;`,
  write: `INSERT INTO tb_qna (user_no, qna_title, qna_content, is_secret) VALUES (?, ?, ?, ?)`,
  qna: `SELECT * FROM tb_qna JOIN tb_user 
                WHERE tb_qna.user_no=tb_user.user_no 
                ORDER BY QNA_NO DESC LIMIT ? OFFSET ?;`,//1  
  qnaAdmin: `SELECT * FROM tb_qna JOIN tb_user
          WHERE tb_qna.user_no=tb_user.user_no`, //1
  deleteContent: `DELETE FROM tb_qna WHERE qna_no = ?`,
  qnaEdit: `UPDATE tb_qna  SET qna_content = ?, qna_title = ? WHERE qna_no = ?;`,
  qnaCheck: `SELECT user_tp FROM tb_user WHERE user_no =?;`,
  qnaWrite: `UPDATE tb_qna  SET qna_answer = ?  WHERE qna_no = ?;`,
  qnacnt: `SELECT COUNT(*) FROM tb_qna;`,
  //문의내역확인
  myqna: `SELECT * FROM tb_qna JOIN tb_user 
        WHERE tb_qna.user_no=tb_user.user_no AND tb_qna.user_no = ?;`, */

  // 리뷰
  review_write: `INSERT INTO tb_review (review_con, user_no, goods_no, sell_user_no, review_score) VALUES (?, ?, ?, ?, ?)`,
  get_review_info: `select g.goods_img, g.goods_no, g.goods_nm, u.user_img, u.user_nick, u.user_no
                        from tb_goods g, tb_user u
                        where g.goods_no = ? and g.user_no = u.user_no`,
  get_my_review: `SELECT * 
                    FROM tb_review 
                    WHERE user_no = ? `,
  get_celler_review: `SELECT *
                      FROM tb_review
                      WHERE sell_user_no = ?`




}