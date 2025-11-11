import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import FileUpload from '../components/FileUpload';
import AudioPlayer from '../components/AudioPlayer';

const FileList = () => {
  const { user, signOut } = useAuth();
  const [error, setError] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentAudio, setCurrentAudio] = useState(null);
  const [renameDialog, setRenameDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [newFileName, setNewFileName] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);

  // 加载文件列表
  const loadFiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audio_files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (err) {
      console.error('加载文件失败:', err);
      setError('加载文件列表失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    if (user) {
      loadFiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // 搜索过滤
  const filteredFiles = files.filter((file) =>
    file.file_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // 格式化时长
  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // 登出
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      setError(err.message || '登出失败');
    }
  };

  // 上传成功回调
  const handleUploadSuccess = () => {
    loadFiles();
  };

  // 播放音频
  const handlePlay = (file) => {
    setCurrentAudio(file);
  };

  // 打开重命名对话框
  const handleOpenRename = (file) => {
    setSelectedFile(file);
    setNewFileName(file.file_name);
    setRenameDialog(true);
  };

  // 重命名文件
  const handleRename = async () => {
    try {
      if (!newFileName.trim()) {
        setError('文件名不能为空');
        return;
      }

      // 如果文件名有变化，添加扩展名
      let finalFileName = newFileName.trim();
      if (!finalFileName.includes('.')) {
        const extension = selectedFile.file_name.split('.').pop();
        finalFileName = `${finalFileName}.${extension}`;
      }

      const { error } = await supabase
        .from('audio_files')
        .update({ file_name: finalFileName })
        .eq('id', selectedFile.id);

      if (error) throw error;

      setRenameDialog(false);
      setSelectedFile(null);
      setNewFileName('');
      loadFiles();
    } catch (err) {
      console.error('重命名失败:', err);
      setError('重命名失败: ' + err.message);
    }
  };

  // 打开删除确认对话框
  const handleOpenDelete = (file) => {
    setFileToDelete(file);
    setDeleteDialog(true);
  };

  // 删除文件
  const handleDelete = async () => {
    try {
      // 删除存储中的文件
      const { error: storageError } = await supabase.storage
        .from('audio-files')
        .remove([fileToDelete.file_path]);

      if (storageError) throw storageError;

      // 删除数据库记录
      const { error: dbError } = await supabase
        .from('audio_files')
        .delete()
        .eq('id', fileToDelete.id);

      if (dbError) throw dbError;

      setDeleteDialog(false);
      setFileToDelete(null);
      loadFiles();

      // 如果删除的是当前播放的文件，停止播放
      if (currentAudio?.id === fileToDelete.id) {
        setCurrentAudio(null);
      }
    } catch (err) {
      console.error('删除失败:', err);
      setError('删除失败: ' + err.message);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ pb: 10 }}>
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4, mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Typography variant="h4">
              音频管理系统
            </Typography>
            <Button
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={handleSignOut}
            >
              登出
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Typography variant="h6" gutterBottom>
            欢迎，{user?.email}
          </Typography>
        </Paper>

        {/* 文件上传 */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            上传音频文件
          </Typography>
          <FileUpload onUploadSuccess={handleUploadSuccess} />
        </Paper>

        {/* 文件列表 */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">我的音频文件 ({filteredFiles.length})</Typography>
            <TextField
              size="small"
              placeholder="搜索文件名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 300 }}
            />
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredFiles.length === 0 ? (
            <Alert severity="info">
              {searchTerm ? '没有找到匹配的文件' : '还没有上传任何文件'}
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>文件名</TableCell>
                    <TableCell align="right">大小</TableCell>
                    <TableCell align="right">时长</TableCell>
                    <TableCell align="right">格式</TableCell>
                    <TableCell align="right">上传时间</TableCell>
                    <TableCell align="center">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredFiles.map((file) => (
                    <TableRow
                      key={file.id}
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AudioFileIcon color="action" />
                          <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                            {file.file_name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {formatFileSize(file.file_size)}
                      </TableCell>
                      <TableCell align="right">
                        {formatDuration(file.duration)}
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={file.mime_type.split('/')[1].toUpperCase()}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {new Date(file.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="播放">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handlePlay(file)}
                          >
                            <PlayArrowIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="重命名">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenRename(file)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="删除">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleOpenDelete(file)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      {/* 重命名对话框 */}
      <Dialog open={renameDialog} onClose={() => setRenameDialog(false)}>
        <DialogTitle>重命名文件</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="文件名"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialog(false)}>取消</Button>
          <Button onClick={handleRename} variant="contained">
            确定
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除文件 "{fileToDelete?.file_name}" 吗？此操作不可撤销。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>取消</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            删除
          </Button>
        </DialogActions>
      </Dialog>

      {/* 音频播放器 */}
      {currentAudio && (
        <AudioPlayer
          audioFile={currentAudio}
          onClose={() => setCurrentAudio(null)}
        />
      )}
    </Container>
  );
};

export default FileList;
