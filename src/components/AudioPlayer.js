import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Slider,
  Typography,
} from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import { supabase, AUDIO_BUCKET } from '../utils/supabase';

const AudioPlayer = ({ audioFile, onClose }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [audioUrl, setAudioUrl] = useState(null);

  // 加载音频文件
  useEffect(() => {
    if (!audioFile) return;

    const loadAudio = async () => {
      try {
        const { data, error } = await supabase.storage
          .from(AUDIO_BUCKET)
          .createSignedUrl(audioFile.file_path, 3600);

        if (error) {
          console.error('获取音频URL失败:', error);
          return;
        }

        setAudioUrl(data.signedUrl);
      } catch (error) {
        console.error('加载音频失败:', error);
      }
    };

    loadAudio();

    // 清理URL
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioFile]);

  // 设置音频事件监听
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const setAudioTime = () => setCurrentTime(audio.currentTime);

    // 音频加载完成
    audio.addEventListener('loadeddata', setAudioData);
    // 音频时间更新
    audio.addEventListener('timeupdate', setAudioTime);
    // 音频播放结束
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, [audioUrl]);

  // 播放/暂停
  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // 跳转到指定时间
  const handleSeek = (e, value) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = value;
      setCurrentTime(value);
    }
  };

  // 调整音量
  const handleVolumeChange = (e, value) => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = value;
      setVolume(value);
    }
  };

  // 格式化时间
  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!audioFile) return null;

  return (
    <Paper
      sx={{
        p: 2,
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        boxShadow: 3,
      }}
    >
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* 音频信息 */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" noWrap>
            {audioFile.file_name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatTime(currentTime)} / {formatTime(duration)}
          </Typography>
        </Box>

        {/* 播放控制 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" disabled>
            <SkipPreviousIcon />
          </IconButton>
          <IconButton onClick={togglePlayPause} color="primary" size="large">
            {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>
          <IconButton size="small" disabled>
            <SkipNextIcon />
          </IconButton>
        </Box>

        {/* 进度条 */}
        <Box sx={{ flex: 2, mx: 2 }}>
          <Slider
            value={currentTime}
            max={duration}
            onChange={handleSeek}
            valueLabelDisplay="auto"
            valueLabelFormat={formatTime}
            size="small"
          />
        </Box>

        {/* 音量控制 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: 150 }}>
          <VolumeUpIcon fontSize="small" />
          <Slider
            value={volume}
            onChange={handleVolumeChange}
            min={0}
            max={1}
            step={0.01}
            size="small"
          />
        </Box>
      </Box>
    </Paper>
  );
};

export default AudioPlayer;
