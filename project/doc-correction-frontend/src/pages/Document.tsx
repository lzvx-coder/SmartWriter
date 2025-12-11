import { uploadDocument } from '@/api/document';
import { useState } from 'react';
import type { ReviewResultResponse, BackendResponse } from '@/api/review';
import type { AxiosResponse } from 'axios';

const Document = () => {
  const [parseStatus, setParseStatus] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [fullReviewResult, setFullReviewResult] = useState<ReviewResultResponse | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 重置所有状态（避免上次操作残留）
    setParseStatus('');
    setUploadProgress(0);
    setIsUploading(true);
    setFullReviewResult(null);

    try {
      // 调用上传接口，获取批改结果（类型严格匹配后端返回）
      const res: AxiosResponse<BackendResponse<ReviewResultResponse>> = await uploadDocument(
        file,
        'academic', // 学术模板类型（可根据需求切换为 'business' 等）
        (progress: number) => {
          setUploadProgress(progress);
        }
      );

      // 校验后端返回的外层结构
      if (!res.data.success) {
        throw new Error(res.data.error || '批改失败：后端返回状态异常');
      }
      if (!res.data.data) {
        throw new Error('批改失败：后端未返回有效批改结果');
      }

      // 提取并存储完整批改结果
      const reviewResult = res.data.data;
      setFullReviewResult(reviewResult);

      // 展示成功状态（包含总分和字数）
      setParseStatus(
        `✅ 文件上传并批改成功！总分：${reviewResult.total_score}（共${reviewResult.word_count}字）`
      );
      console.log('批改完整结果：', reviewResult);

      // 清空文件选择框，方便重新上传
      e.target.value = '';
    } catch (err) {
      // 统一错误处理，友好提示用户
      const errorMsg = err instanceof Error 
        ? err.message 
        : '文件上传或批改失败，请检查文件格式和网络连接后重试';
      setParseStatus(`❌ ${errorMsg}`);
      console.error('上传/批改异常详情：', err);
    } finally {
      // 无论成功失败，恢复上传状态和进度
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2>📄 文档智能批改工具</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>
        支持 .txt、.docx、.pdf 格式文件，最大上传大小 10MB | 自动检测语法、逻辑、可读性等维度
      </p>

      {/* 文件上传控件：禁用状态防止重复上传 */}
      <input
        type="file"
        onChange={handleFileUpload}
        disabled={isUploading}
        accept=".txt,.docx,.pdf"
        style={{
          padding: '0.5rem',
          marginBottom: '1rem',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          fontSize: '1rem'
        }}
      />

      {/* 上传进度条：仅在上传中且进度>0时显示 */}
      {isUploading && uploadProgress > 0 && (
        <div style={{
          height: '8px',
          backgroundColor: '#f0f0f0',
          borderRadius: '4px',
          marginBottom: '1rem',
          overflow: 'hidden',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
        }}>
          <div
            style={{
              height: '100%',
              backgroundColor: '#42b983',
              width: `${uploadProgress.toFixed(0)}%`,
              transition: 'width 0.3s ease-in-out'
            }}
          />
        </div>
      )}

      {/* 状态提示文本：区分成功/失败样式 */}
      <div style={{
        marginTop: '1rem',
        padding: '1rem',
        borderRadius: '4px',
        backgroundColor: parseStatus.includes('❌') ? '#fef2f2' : '#f0fdf4',
        color: parseStatus.includes('❌') ? '#dc2626' : '#166534',
        border: parseStatus.includes('❌') ? '1px solid #fecdd3' : '1px solid #bbf7d0',
        minHeight: '60px',
        display: 'flex',
        alignItems: 'center'
      }}>
        {isUploading ? (
          <span>正在上传并批改...({uploadProgress.toFixed(0)}%)</span>
        ) : (
          parseStatus || <span style={{ color: '#999' }}>请选择文件开始上传批改</span>
        )}
      </div>

      {/* 详细维度评分：批改成功后展示 */}
      {fullReviewResult && (
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: '#fff'
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0', color: '#1f2937' }}>📊 多维度评分详情</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280', fontSize: '0.9rem' }}>语法正确性</p>
              <p style={{ margin: '0', fontSize: '1.8rem', color: '#1f2937', fontWeight: '600' }}>
                {fullReviewResult.detail_json.grammar}
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280', fontSize: '0.9rem' }}>逻辑连贯性</p>
              <p style={{ margin: '0', fontSize: '1.8rem', color: '#1f2937', fontWeight: '600' }}>
                {fullReviewResult.detail_json.logic}
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280', fontSize: '0.9rem' }}>可读性</p>
              <p style={{ margin: '0', fontSize: '1.8rem', color: '#1f2937', fontWeight: '600' }}>
                {fullReviewResult.detail_json.readability}
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280', fontSize: '0.9rem' }}>创新性</p>
              <p style={{ margin: '0', fontSize: '1.8rem', color: '#1f2937', fontWeight: '600' }}>
                {fullReviewResult.detail_json.innovation ?? '0'}
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280', fontSize: '0.9rem' }}>规范性</p>
              <p style={{ margin: '0', fontSize: '1.8rem', color: '#1f2937', fontWeight: '600' }}>
                {fullReviewResult.detail_json.standardization}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 问题优化建议：批改成功后展示 */}
      {fullReviewResult?.issues.length && (
        <div style={{
          marginTop: '1.5rem',
          padding: '1.5rem',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: '#fff'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>⚠️ 优化建议</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {fullReviewResult.issues.map((issue, index) => (
              <div 
                key={index} 
                style={{ 
                  marginBottom: '1rem', 
                  paddingBottom: '1rem', 
                  borderBottom: index < fullReviewResult.issues.length - 1 ? '1px solid #f0f0f0' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <span style={{ 
                    backgroundColor: '#fef3c7', 
                    color: '#92400e', 
                    padding: '0.2rem 0.6rem', 
                    borderRadius: '4px', 
                    fontSize: '0.8rem',
                    marginRight: '0.5rem'
                  }}>
                    {issue.issue_type}
                  </span>
                  <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                    位置：{issue.loc_start}-{issue.loc_end}字
                  </span>
                </div>
                <p style={{ margin: '0.3rem 0', color: '#374151' }}>
                  <strong>问题：</strong> {issue.message}
                </p>
                <p style={{ margin: '0.3rem 0', color: '#1f2937' }}>
                  <strong>建议：</strong> {issue.suggestion}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Document;