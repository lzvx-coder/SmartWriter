export type DocumentStatus = 'pending' | 'processed' | 'failed';

export interface DocumentMetadata {
  language: string;
  word_count: number;
  file_size: number;
}

export interface Document {
  id: number;
  filename: string;
  status: DocumentStatus;
  metadata: DocumentMetadata;
  review_task_id: number;
  error_msg?: string;
}

export interface UploadParams {
  file: File;
  review_type: 'academic' | 'business' | 'code';
}