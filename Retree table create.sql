DROP TABLE TB_USER;
CREATE TABLE TB_USER  (
USER_NO INT NOT NULL AUTO_INCREMENT,
USER_ID VARCHAR(50) NOT NULL UNIQUE,
USER_EMAIL VARCHAR(50),
USER_NICK VARCHAR(20) NOT NULL,
USER_PW VARCHAR(100),
USER_IMG VARCHAR(500),
USER_SOCIAL_TP INT NOT NULL DEFAULT 0,
USER_ACCESS_TOKEN VARCHAR(50),  
USER_TP INT NOT NULL DEFAULT 0,
USER_CREATE_DT TIMESTAMP NOT NULL DEFAULT NOW(),
USER_MOBILE VARCHAR(13) UNIQUE,
USER_ZIPCODE VARCHAR(5),
USER_ADR1 VARCHAR(70),
USER_ADR2 VARCHAR(70),
USER_FR INT NOT NULL DEFAULT 50,
USER_BAN INT NOT NULL DEFAULT 0,
USER_DELETE TIMESTAMP,
PRIMARY KEY(USER_NO)
) COMMENT = '회원정보'
ENGINE=InnoDB;

DROP TABLE TB_GOODS;
CREATE TABLE TB_GOODS  (
GOODS_NO INT NOT NULL AUTO_INCREMENT,
GOODS_CATEGORY VARCHAR(20) NOT NULL,
GOODS_CATEGORY_DETAIL INT NOT NULL,
GOODS_NM VARCHAR(50)  NOT NULL,
GOODS_CONTENT VARCHAR(2000) NOT NULL,
GOODS_IMG VARCHAR(5000),
GOODS_SUCC_PRICE INT NOT NULL DEFAULT 0,
GOODS_START_PRICE INT NOT NULL,
GOODS_STATE INT NOT NULL DEFAULT 0,
GOODS_TRADE INT NOT NULL,
GOODS_DELIV_PRICE INT NOT NULL,
GOODS_TIMER TIMESTAMP NOT NULL,
GOODS_UPLOAD_DATE TIMESTAMP NOT NULL DEFAULT NOW(),
DELETE_TIME TIMESTAMP,
USER_NO INT NOT NULL,
PRIMARY KEY(GOODS_NO),
FOREIGN KEY(USER_NO) REFERENCES TB_USER(USER_NO)
) COMMENT='상품 정보'
ENGINE=InnoDB;

DROP TABLE TB_BID;
CREATE TABLE TB_BID  (
BID_NO INT NOT NULL AUTO_INCREMENT,
BID_CREATE_DT TIMESTAMP NOT NULL DEFAULT NOW() ,
BID_AMOUNT INT NOT NULL,
GOODS_NO INT NOT NULL,
USER_NO INT NOT NULL,
PRIMARY KEY(BID_NO),
FOREIGN KEY(USER_NO) REFERENCES TB_USER(USER_NO),
FOREIGN KEY(GOODS_NO) REFERENCES TB_GOODS(GOODS_NO)
) COMMENT = '상품 입찰 내역'
ENGINE=InnoDB;

DROP TABLE TB_CHATROOM;
CREATE TABLE TB_CHATROOM (
CHATROOM_NO INT NOT NULL AUTO_INCREMENT,
CHATROOM_OUT1 INT NOT NULL DEFAULT 0,
CHATROOM_OUT2 INT NOT NULL DEFAULT 0,
CHATROOM_USER1 INT NOT NULL,
CHATROOM_USER2 INT NOT NULL,
PRIMARY KEY(CHATROOM_NO),
FOREIGN KEY(CHATROOM_USER1) REFERENCES TB_USER(USER_NO),
FOREIGN KEY(CHATROOM_USER2) REFERENCES TB_USER(USER_NO)
) COMMENT = '채팅방'
ENGINE=InnoDB;

DROP TABLE TB_CHAT;
CREATE TABLE TB_CHAT (
CHAT_NO INT NOT NULL AUTO_INCREMENT,
CHAT_CONTENT VARCHAR(1000) NOT NULL,
CHAT_DATE TIMESTAMP NOT NULL DEFAULT NOW(),
CHAT_USER INT NOT NULL,
CHATROOM_NO INT NOT NULL,
PRIMARY KEY(CHAT_NO),
FOREIGN KEY(CHAT_USER) REFERENCES TB_USER(USER_NO),
FOREIGN KEY(CHATROOM_NO) REFERENCES TB_CHATROOM(CHATROOM_NO)
) COMMENT = '채팅'
ENGINE=InnoDB;

DROP TABLE TB_LIKE;
CREATE TABLE TB_LIKE  (
LIKE_NO INT NOT NULL AUTO_INCREMENT,
USER_NO INT NOT NULL,
GOODS_NO INT NOT NULL,
PRIMARY KEY(LIKE_NO),
FOREIGN KEY(USER_NO) REFERENCES TB_USER(USER_NO),
FOREIGN KEY(GOODS_NO) REFERENCES TB_GOODS(GOODS_NO)
) COMMENT = '관심 상품'
ENGINE=InnoDB;

DROP TABLE TB_REVIEW;
CREATE TABLE TB_REVIEW  (
REVIEW_NO INT NOT NULL AUTO_INCREMENT,
REVIEW_CON VARCHAR(1000) NOT NULL,
REVIEW_CREATE_DT TIMESTAMP NOT NULL DEFAULT NOW(),   
REVIEW_SCORE INT NOT NULL,
USER_NO INT  NOT NULL,
SELL_USER_NO INT NOT NULL,
GOODS_NO INT NOT NULL,
PRIMARY KEY(REVIEW_NO),
FOREIGN KEY(USER_NO) REFERENCES TB_USER(USER_NO),
FOREIGN KEY(SELL_USER_NO) REFERENCES TB_USER(USER_NO),
FOREIGN KEY(GOODS_NO) REFERENCES TB_GOODS(GOODS_NO)
) COMMENT = '판매자 리뷰'
ENGINE=InnoDB;

DROP TABLE TB_REPORT;
CREATE TABLE TB_REPORT  (
REPORT_NO INT NOT NULL AUTO_INCREMENT,
REPORT_TITLE VARCHAR(50) NOT NULL,
REPORT_CATEGORY VARCHAR(50) NOT NULL,
REPORT_CONTENT VARCHAR(1000),
REPORT_IMG VARCHAR(500),
REPORT_DATE TIMESTAMP NOT NULL DEFAULT NOW(),
REPORT_USER_NO INT NOT NULL,
USER_NO INT NOT NULL,
PRIMARY KEY(REPORT_NO),
FOREIGN KEY(USER_NO) REFERENCES TB_USER(USER_NO),
FOREIGN KEY(REPORT_USER_NO) REFERENCES TB_USER(USER_NO)
) COMMENT = '신고 목록'
ENGINE=InnoDB;

DROP TABLE TB_ORDER;
CREATE TABLE TB_ORDER  (
ORDER_NO INT NOT NULL AUTO_INCREMENT,
ORDER_RECEIVE_NM VARCHAR(50) NOT NULL,
ORDER_MOBILE VARCHAR(1000) NOT NULL,
ORDER_ADDR1 VARCHAR(500) NOT NULL,
ORDER_ADDR2 VARCHAR(500) NOT NULL,
ORDER_ZIPCODE VARCHAR(5) NOT NULL,
ORDER_DATE TIMESTAMP NOT NULL DEFAULT NOW(),
ORDER_CONTENT VARCHAR(1000),
GOODS_NO INT NOT NULL,
USER_NO INT NOT NULL,
PRIMARY KEY(ORDER_NO),
FOREIGN KEY(GOODS_NO) REFERENCES TB_GOODS(GOODS_NO),
FOREIGN KEY(USER_NO) REFERENCES TB_USER(USER_NO)
) COMMENT = '결제 목록'
ENGINE=InnoDB;

CREATE TABLE TB_ALRAM (
    ALRAM_COUNT INT NOT NULL DEFAULT 0,
    USER_NO INT NOT NULL DEFAULT 0,
    PRIMARY KEY(ALRAM_COUNT),
    FOREIGN KEY (USER_NO) REFERENCES TB_USER(USER_NO)
) COMMENT = '알람'
    ENGINE = InnoDB;