import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

// 支持的文件类型（不变）
const SUPPORTED_FILE_TYPES = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'text/x-python': ['.py'],
  'text/x-java': ['.java'],
  'text/x-c++src': ['.cpp'],
};
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB（不变）

export const useFile = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // 格式验证（不变）
  const validateFileType = useCallback((file: File): boolean => {
    const isSupported = Object.keys(SUPPORTED_FILE_TYPES).includes(file.type);
    if (!isSupported) {
      const supportedExts = Object.values(SUPPORTED_FILE_TYPES).flat().join(', ');
      setFileError(`不支持的文件格式，请上传${supportedExts}格式文件`);
      return false;
    }
    setFileError(null);
    return true;
  }, []);

  // 大小验证（不变）
  const validateFileSize = useCallback((file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`文件大小超出限制（最大10MB），当前：${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return false;
    }
    setFileError(null);
    return true;
  }, []);

  // 文件选择处理（不变）
  const handleFileSelect = useCallback((files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    setFileError(null);
    const isTypeValid = validateFileType(file);
    const isSizeValid = validateFileSize(file);
    if (isTypeValid && isSizeValid) {
      setSelectedFile(file);
    }
  }, [validateFileType, validateFileSize]);

  // 拖拽上传配置（不变）
// 拖拽上传配置（修改后）
const { getRootProps, getInputProps, isDragActive } = useDropzone({
  accept: SUPPORTED_FILE_TYPES,
  maxSize: MAX_FILE_SIZE,
  onDrop: handleFileSelect,
  multiple: false,
  onDropRejected: (fileRejections) => {
    fileRejections.forEach((rejection) => {
      const file = rejection.file;
      file.size > MAX_FILE_SIZE ? validateFileSize(file) : validateFileType(file);
    });
  },
});

  // 清除文件（不变）
  const clearSelectedFile = useCallback(() => {
    setSelectedFile(null);
    setFileError(null);
  }, []);

  // 构建上传参数（不变）
  const getUploadParams = useCallback((reviewType: 'academic' | 'business' | 'code'): FormData => {
    if (!selectedFile) throw new Error('未选择文件');
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('review_type', reviewType);
    return formData;
  }, [selectedFile]);

  return {
    selectedFile,
    fileError,
    isDragActive,
    getRootProps,
    getInputProps,
    clearSelectedFile,
    getUploadParams,
  };
};