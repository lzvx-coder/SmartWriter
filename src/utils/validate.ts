// src/utils/validate.ts
// 验证文件格式（与useFile.ts呼应，可复用）
export const validateFileExt = (file: File): boolean => {
  const supportedTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf',
    'text/plain',
    'text/x-python',
    'text/x-java',
    'text/x-c++src',
  ];
  return supportedTypes.includes(file.type);
};