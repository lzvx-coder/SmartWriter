// src/utils/format.ts
// 格式化文件大小（字节→MB/KB）
export const formatFileSize = (bytes: number): string => {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(2)}KB`;
  }
  return `${bytes}B`;
};

// 格式化分数（保留1位小数）
export const formatScore = (score: number): string => {
  return score.toFixed(1);
};