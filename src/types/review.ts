// src/types/review.ts
// 分项评分（不变）
export interface ScoreDetail {
  grammar: number;
  logic: number;
  innovation: number;
  readability: number;
  standardization: number;
}

// 批改问题（不变）
export interface ReviewIssue {
  id: number;
  review_id: number;
  loc_start: number;
  loc_end: number;
  issue_type: string;
  message: string;
  suggestion: string;
}

// 批改结果（移除 user_id 字段）
export interface ReviewResult {
  id: number;
  document_id: number;
  total_score: number;
  detail: ScoreDetail;
  issues: ReviewIssue[];
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}