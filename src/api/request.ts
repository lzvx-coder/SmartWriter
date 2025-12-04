import axios, { AxiosError } from 'axios';
import type { AxiosResponse, AxiosRequestConfig } from 'axios';

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000', // 明确后端基础地址（避免跨域问题）
  timeout: 60000, // 延长超时时间（文件处理+模型调用需更长时间）
  // 移除默认 Content-Type：文件上传时需手动设置为 multipart/form-data
  headers: {
    // 仅在非文件上传时生效，文件上传会覆盖此配置
    'Content-Type': 'application/json',
  },
});

// 关键修改：响应拦截器返回完整响应对象，不自动解构 data
request.interceptors.response.use(
  (response: AxiosResponse) => response, // 直接返回完整响应（含 data、status 等）
  (error: AxiosError) => {
    let errorMsg = '请求失败，请重试';
    if (error.response) {
      // 错误信息优先取后端返回的 error 字段
      errorMsg = (error.response.data as { error?: string })?.error || 
                (error.response.data as { message?: string })?.message || errorMsg;
      const status = error.response.status;
      switch (status) {
        case 413:
          errorMsg = '文件过大，最大支持 10MB';
          break;
        case 415:
          errorMsg = '文件格式不支持，仅支持 .txt/.pdf/.docx';
          break;
        case 404:
          errorMsg = '资源不存在，请检查请求地址';
          break;
        case 503:
          errorMsg = '服务暂时不可用，请稍后重试';
          break;
      }
    } else if (error.request) {
      errorMsg = '网络异常，请检查网络连接';
    }
    console.error('API Error: ', errorMsg);
    return Promise.reject(new Error(errorMsg));
  }
);

export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) => 
    request.get<T>(url, config),
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    request.post<T>(url, data, config),
};

export default request;