CREATE TABLE IF NOT EXISTS `resume_profile_keywords` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT,
  `resume_id`   BIGINT       NOT NULL,
  `user_id`     BIGINT       NOT NULL,
  `category`    VARCHAR(32)  NOT NULL,
  `label`       VARCHAR(120) NOT NULL,
  `weight`      INT          NOT NULL DEFAULT 50,
  `source`      VARCHAR(32)  NOT NULL DEFAULT 'RESUME',
  `evidence`    VARCHAR(255),
  `status`      VARCHAR(24)  NOT NULL DEFAULT 'READY',
  `error_msg`   VARCHAR(255),
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_resume_profile_keyword` (`resume_id`, `category`, `label`),
  KEY `idx_resume_profile_keywords_resume` (`resume_id`, `status`),
  KEY `idx_resume_profile_keywords_user` (`user_id`, `category`, `weight`),
  CONSTRAINT `fk_resume_profile_keywords_resume`
    FOREIGN KEY (`resume_id`) REFERENCES `resumes` (`resume_id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_resume_profile_keywords_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
