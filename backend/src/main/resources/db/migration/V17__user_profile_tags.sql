CREATE TABLE IF NOT EXISTS `user_profile_tags` (
  `tag_id`      BIGINT       NOT NULL AUTO_INCREMENT,
  `user_id`     BIGINT       NOT NULL,
  `category`    VARCHAR(32)  NOT NULL,
  `label`       VARCHAR(120) NOT NULL,
  `weight`      INT          NOT NULL DEFAULT 50,
  `source`      VARCHAR(32)  NOT NULL DEFAULT 'SYSTEM_INFERRED',
  `evidence`    VARCHAR(255),
  `editable`    TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`tag_id`),
  UNIQUE KEY `uk_user_profile_tag` (`user_id`, `category`, `label`),
  KEY `idx_user_profile_tags_user_category` (`user_id`, `category`),
  CONSTRAINT `fk_user_profile_tags_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
