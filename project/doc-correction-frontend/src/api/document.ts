import { api } from './request';
import type { AxiosResponse } from 'axios';
import type { ReviewResultResponse, BackendResponse } from './review';

/**
 * 上传文件并获取批改结果
 * @param file - 待批改的文件对象（.txt/.docx/.pdf）
 * @param templateType - 批改模板类型（如 'academic' 学术模板）
 * @param onProgress - 上传进度回调函数
 * @returns 后端返回的批改结果（Axios响应对象）
 */
export const uploadDocument = async (
  file: File,
  templateType: string,
  onProgress: (progress: number) => void
): Promise<AxiosResponse<BackendResponse<ReviewResultResponse>>> => {
  const formData = new FormData();

  // 关键：参数名必须为 'file'（与后端 request.files['file'] 一致）
  // 第三个参数 file.name 确保后端识别文件名和格式
  formData.append('file', file, file.name);

  return api.post<BackendResponse<ReviewResultResponse>>(
    '/api/v1/review', // 后端接口地址（与后端路由一致）
    formData,
    {
      // 上传进度监听
      onUploadProgress: (progressEvent) => {
        const progress = (progressEvent.loaded / (progressEvent.total || 1)) * 100;
        onProgress(progress);
      },
      // 显式设置 Content-Type，确保文件上传格式正确
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000 // 延长超时时间（文件处理+模型调用可能耗时较长）
    }
  );
};