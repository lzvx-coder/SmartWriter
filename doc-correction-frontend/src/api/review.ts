import { api } from './request';
import type { AxiosResponse } from 'axios';

export interface SubmitReviewResponse {
  task_id: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface ReviewResultResponse {
  total_score: number;
  detail_json: {
    grammar: number;
    logic: number;
    innovation?: number;
    readability: number;
    standardization: number;
  };
  issues: Array<{
    loc_start: number;
    loc_end: number;
    issue_type: string;
    message: string;
    suggestion: string;
  }>;
  word_count: number;
}

// 关键：添加 export 导出 BackendResponse
export interface BackendResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

/**
 * 提交文档批改任务
 */
export const submitReview = async (
  documentId: string,
  templateType: 'academic' | 'business' | 'code'
): Promise<SubmitReviewResponse> => {
  // 关键：明确返回类型是 AxiosResponse<BackendResponse<SubmitReviewResponse>>
  const response: AxiosResponse<BackendResponse<SubmitReviewResponse>> = await api.post(
    '/review/submit',
    {
      document_id: documentId,
      template_type: templateType, // 这里修正原代码的笔误（template_t → template_type）
    }
  );

  // 校验后端返回的原始数据（存在于 response.data 中）
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || '提交批改任务失败：后端返回格式异常');
  }

  return response.data.data;
};

/**
 * 查询批改结果
 */
export const getReviewResult = async (
  taskId: string
): Promise<ReviewResultResponse> => {
  // 关键：明确返回类型是 AxiosResponse<BackendResponse<ReviewResultResponse>>
  const response: AxiosResponse<BackendResponse<ReviewResultResponse>> = await api.get(
    `/review/${taskId}/result`
  );

  // 校验后端返回的原始数据（存在于 response.data 中）
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || '查询批改结果失败：后端返回格式异常');
  }

  // 校验核心字段
  const result = response.data.data;
  const requiredFields = ['total_score', 'detail_json', 'issues', 'word_count'];
  const missingFields = requiredFields.filter(field => !(field in result));
  if (missingFields.length > 0) {
    throw new Error(`批改结果格式错误：缺少核心字段 ${missingFields.join(', ')}`);
  }

  return result;
};