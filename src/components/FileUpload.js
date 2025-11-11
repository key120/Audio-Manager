import React, { useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { supabase, AUDIO_BUCKET } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';

// 允许的音频格式
const ALLOWED_TYPES = [
  'audio/mp3',
  'audio/mpeg',
  'audio/wav',
  'audio/aac',
  'audio/flac',
  'audio/ogg',
];

// 文件大小限制：50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

const FileUpload = ({ onUploadSuccess }) => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState({ type: '', message: '' });
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // 验证文件
  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `不支持的文件格式: ${file.type}。支持的格式：MP3, WAV, AAC, FLAC, OGG`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `文件过大: ${(file.size / 1024 / 1024).toFixed(2)}MB。最大允许50MB`;
    }
    return null;
  };

  // 获取文件时长
  const getAudioDuration = (file) => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        resolve(audio.duration || 0);
      };
      audio.onerror = () => resolve(0);
      audio.src = URL.createObjectURL(file);
    });
  };

  // 上传文件
  const uploadFile = async (file) => {
    try {
      const error = validateFile(file);
      if (error) {
        setUploadStatus({ type: 'error', message: error });
        return;
      }

      setUploading(true);
      setUploadProgress(0);
      setUploadStatus({ type: '', message: '' });

      // 生成唯一文件名
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // 获取音频时长
      const duration = await getAudioDuration(file);

      // 上传到Supabase存储
      const { error: uploadError } = await supabase.storage
        .from(AUDIO_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setUploadProgress(50);

      // 保存文件元数据到数据库
      const { data: dbData, error: dbError } = await supabase
        .from('audio_files')
        .insert([
          {
            user_id: user.id,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            duration: duration,
            mime_type: file.type,
          },
        ])
        .select()
        .single();

      if (dbError) {
        // 如果数据库插入失败，删除已上传的文件
        await supabase.storage.from(AUDIO_BUCKET).remove([filePath]);
        throw dbError;
      }

      setUploadProgress(100);

      // 更新上传文件列表
      setUploadedFiles((prev) => [
        ...prev,
        {
          ...dbData,
          file,
          status: 'success',
        },
      ]);

      setUploadStatus({
        type: 'success',
        message: `${file.name} 上传成功！`,
      });

      // 通知父组件
      if (onUploadSuccess) {
        onUploadSuccess();
      }

      // 3秒后清除状态
      setTimeout(() => {
        setUploadStatus({ type: '', message: '' });
        setUploadProgress(0);
      }, 3000);
    } catch (error) {
      console.error('上传错误:', error);
      setUploadStatus({
        type: 'error',
        message: `上传失败: ${error.message}`,
      });
    } finally {
      setUploading(false);
    }
  };

  // 处理拖拽
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => uploadFile(file));
  };

  // 处理文件选择
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => uploadFile(file));
    // 清空输入，允许重复选择同一文件
    e.target.value = '';
  };

  // 触发文件选择
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box>
      {/* 上传区域 */}
      <Paper
        sx={{
          p: 4,
          mb: 3,
          border: isDragging ? '2px dashed #1976d2' : '2px dashed #ccc',
          bgcolor: isDragging ? 'action.hover' : 'background.paper',
          transition: 'all 0.2s',
          cursor: 'pointer',
        }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <CloudUploadIcon sx={{ fontSize: 64, color: 'primary.main' }} />
          <Typography variant="h6">
            {isDragging ? '松开鼠标上传文件' : '拖拽文件到此处或点击上传'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            支持格式：MP3, WAV, AAC, FLAC, OGG | 最大大小：50MB
          </Typography>
          <Button variant="contained" component="span" startIcon={<CloudUploadIcon />}>
            选择文件
          </Button>
        </Box>
      </Paper>

      {/* 上传进度 */}
      {uploading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            上传中... {uploadProgress}%
          </Typography>
        </Box>
      )}

      {/* 上传状态 */}
      {uploadStatus.type && (
        <Alert severity={uploadStatus.type} sx={{ mb: 2 }}>
          {uploadStatus.message}
        </Alert>
      )}

      {/* 上传文件列表 */}
      {uploadedFiles.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            最近上传
          </Typography>
          <List>
            {uploadedFiles.map((file, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  {file.status === 'success' ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <ErrorIcon color="error" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={file.file_name}
                  secondary={`${(file.file_size / 1024 / 1024).toFixed(2)} MB`}
                />
                <Chip
                  label={file.mime_type.split('/')[1].toUpperCase()}
                  size="small"
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default FileUpload;
