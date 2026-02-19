/**
 * MySQL dump 转 PostgreSQL (Supabase) 格式
 * 用法: node mysql-to-postgres.js [输入文件路径]
 * 默认读取同目录下的 b777v_2026-02-10_104345.sql
 */
const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2] || path.join(__dirname, 'b777v_2026-02-10_104345.sql');
const outputPath = path.join(__dirname, 'supabase', 'migrations', '20260210100000_b777v_schema.sql');

if (!fs.existsSync(inputPath)) {
  console.error('输入文件不存在:', inputPath);
  process.exit(1);
}

let sql = fs.readFileSync(inputPath, 'utf8');

// 移除 MySQL 特定注释
sql = sql.replace(/\/\*![\d ]+[^*]*\*\//g, '');
sql = sql.replace(/\/\*!40101 character_set_client = @saved_cs_client \*\//g, '');
sql = sql.replace(/\/\*!40101 character_set_client = @@character_set_client \*\//g, '');

// 移除注释行
sql = sql.replace(/^--\s*Table structure.*\n/gm, '');
sql = sql.replace(/^--\s*Dumping.*\n/gm, '');
sql = sql.replace(/^--\s*$[\n]*/gm, '');

// 反引号 -> 双引号
sql = sql.replace(/`([^`]+)`/g, '"$1"');

// 类型转换（按顺序，tinyint 必须在 int 之前）
const replacements = [
  [/bigint\(\d+\) unsigned NOT NULL AUTO_INCREMENT/g, 'BIGSERIAL'],
  [/int\(\d+\) unsigned NOT NULL AUTO_INCREMENT/g, 'SERIAL'],
  [/int\(\d+\) NOT NULL AUTO_INCREMENT/g, 'SERIAL'],
  [/bigint\(\d+\) unsigned NOT NULL/g, 'BIGINT'],
  [/bigint\(\d+\) unsigned/g, 'BIGINT'],
  [/tinyint\(\d+\) unsigned NOT NULL/g, 'SMALLINT'],
  [/tinyint\(\d+\) NOT NULL/g, 'SMALLINT'],
  [/tinyint\(\d+\)/g, 'SMALLINT'],
  [/smallint\(\d+\) unsigned/g, 'SMALLINT'],
  [/smallint\(\d+\)/g, 'SMALLINT'],
  [/int\(\d+\) unsigned NOT NULL/g, 'INTEGER'],
  [/int\(\d+\) unsigned/g, 'INTEGER'],
  [/int\(\d+\) NOT NULL/g, 'INTEGER'],
  [/int\(\d+\)/g, 'INTEGER'],
  [/decimal\(([^)]+)\) unsigned/g, 'NUMERIC($1)'],
  [/varchar\((\d+)\) COLLATE utf8mb4_unicode_ci/g, 'VARCHAR($1)'],
  [/char\((\d+)\) COLLATE utf8mb4_unicode_ci/g, 'CHAR($1)'],
  [/text COLLATE utf8mb4_unicode_ci/g, 'TEXT'],
  [/longtext COLLATE utf8mb4_unicode_ci/g, 'TEXT'],
  [/mediumtext COLLATE utf8mb4_unicode_ci/g, 'TEXT'],
  [/datetime/g, 'TIMESTAMP'],
  [/timestamp NULL/g, 'TIMESTAMP NULL'],
  [/timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP/g, 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP'],
  [/COMMENT '[^']*'/g, ''],
];

for (const [re, repl] of replacements) {
  sql = sql.replace(re, repl);
}

// enum 转换 - file_type
sql = sql.replace(/enum\('pic','file','video'\) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pic' COMMENT '[^']*'/g,
  "VARCHAR(20) NOT NULL DEFAULT 'pic' CHECK (\"file_type\" IN ('pic','file','video'))");

// enum 转换 - money_type
sql = sql.replace(/enum\('money','fs_money','total_money','ml_money','score','total_credit','used_credit'\) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'money' COMMENT '[^']*'/g,
  "VARCHAR(50) NOT NULL DEFAULT 'money' CHECK (\"money_type\" IN ('money','fs_money','total_money','ml_money','score','total_credit','used_credit'))");

// 移除 KEY 索引（PostgreSQL 用 CREATE INDEX 单独创建）
sql = sql.replace(/,?\s*KEY "[^"]+" \("[^"]+"\)/g, '');
sql = sql.replace(/,?\s*KEY "[^"]+" \("[^"]+"\(\d+\)\)/g, '');
sql = sql.replace(/,?\s*KEY "attachments_model_id_model_type_index" \("model_id","model_type"\(\d+\)\)/g, '');
sql = sql.replace(/,?\s*KEY "attachments_file_type_index" \("file_type"\)/g, '');
sql = sql.replace(/,?\s*KEY "attachments_category_index" \("category"\(\d+\)\)/g, '');
sql = sql.replace(/,?\s*KEY "role_has_permissions_role_id_foreign" \("role_id"\)/g, '');
sql = sql.replace(/,?\s*KEY "model_has_roles_role_id_foreign" \("role_id"\),\s*CONSTRAINT "model_has_roles_role_id_foreign" FOREIGN KEY \("role_id"\) REFERENCES "roles" \("id"\) ON DELETE CASCADE/g, '');

// UNIQUE KEY -> UNIQUE
sql = sql.replace(/UNIQUE KEY "members_name_unique" \("name"\)/g, 'UNIQUE ("name")');
sql = sql.replace(/UNIQUE KEY "members_invite_code_unique" \("invite_code"\)/g, 'UNIQUE ("invite_code")');
sql = sql.replace(/UNIQUE KEY "members_invite_code_index" \("invite_code"\)/g, '');
sql = sql.replace(/UNIQUE KEY "game_lists_api_name_game_code_game_type_unique" \("api_name","game_code","game_type"\)/g, 'UNIQUE ("api_name","game_code","game_type")');
sql = sql.replace(/UNIQUE KEY "yj_levels_level_unique" \("level"\)/g, 'UNIQUE ("level")');

// 移除 ENGINE, CHARSET, ROW_FORMAT 等
sql = sql.replace(/\s*\) ENGINE=InnoDB[^;]*;/g, ');');
sql = sql.replace(/\s*\) ENGINE=MyISAM[^;]*;/g, ');');

// DROP TABLE 添加 CASCADE
sql = sql.replace(/DROP TABLE IF EXISTS "([^"]+)";/g, 'DROP TABLE IF EXISTS "$1" CASCADE;');

// 清理多余逗号
sql = sql.replace(/,\s*,\s*/g, ', ');
sql = sql.replace(/,\s*\)/g, ')');

// 修正 smallint 被错误转换为 smallINTEGER 的情况
sql = sql.replace(/smallINTEGER/gi, 'SMALLINT');

// 修正 smallint 被错误转换为 smallINTEGER
sql = sql.replace(/smallINTEGER/gi, 'SMALLINT');

// 移除残留的单独分号行（来自 MySQL 注释移除）
sql = sql.replace(/^;[\r\n]+/gm, '');

// 清理多余空行
sql = sql.replace(/\n{3,}/g, '\n\n');

const header = `-- PostgreSQL / Supabase 表结构
-- 由 MySQL dump (b777v) 转换
-- 仅包含表结构，无数据
-- 导入: Supabase SQL Editor 或 psql -f 本文件

`;

fs.writeFileSync(outputPath, header + sql.trim());
console.log('已生成:', outputPath);
