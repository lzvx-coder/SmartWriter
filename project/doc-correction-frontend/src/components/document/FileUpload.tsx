import { useFile } from '@/hooks/useFile';
import { uploadDocument } from '../../api/document'; // 改为相对路径
import { useNavigate } from 'react-router-dom';

const FileUpload = () => {
  const { 
    selectedFile, 
    fileError, 
    isDragActive, 
    getRootProps, 
    getInputProps, 
    clearSelectedFile, 
    getUploadParams 
  } = useFile();
  const navigate = useNavigate();

  const handleUpload = async () => {
    if (!selectedFile) return;
    const formData = getUploadParams('academic'); // 这里可根据需求选择批改类型
    try {
      const res = await uploadDocument(formData);
      navigate(`/document/${res.id}`);
    } catch (err) {
      console.error('上传失败', err);
    }
  };

  return (
    <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
      <input {...getInputProps()} />
      {selectedFile ? (
        <div>
          <p>已选择：{selectedFile.name}</p>
          <button onClick={clearSelectedFile}>重新选择</button>
          <button onClick={handleUpload} disabled={!!fileError}>上传</button>
          {fileError && <div className="error">{fileError}</div>}
        </div>
      ) : (
        <div>
          <div className="icon">📂</div>
          <p>拖拽文件到此处或点击选择文件</p>
          <p>支持格式：.docx、.pdf、.txt、.py、.java、.cpp</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;