import React, { useState } from 'react';
import { Container, Box, Paper, Typography, Button, Alert } from '@mui/material';
import { supabase } from '../utils/supabase';

const DevTest = () => {
  const [status, setStatus] = useState('');

  // 创建测试用户
  const createTestUser = async () => {
    setStatus('正在创建测试用户...');
    try {
      const testEmail = 'test@demo.com';
      const testPassword = 'test123456';

      // 注册用户
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      });

      if (error && !error.message.includes('already registered')) {
        throw error;
      }

      setStatus('用户注册成功！现在请检查控制台以获取更多信息。');
    } catch (err) {
      setStatus('错误: ' + err.message);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            开发测试页面
          </Typography>

          <Alert severity="warning" sx={{ mb: 3 }}>
            此页面仅在开发环境中可用
          </Alert>

          {status && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {status}
            </Alert>
          )}

          <Button
            variant="contained"
            fullWidth
            onClick={createTestUser}
            sx={{ mb: 2 }}
          >
            创建测试用户 (test@demo.com)
          </Button>

          <Typography variant="body2" color="text.secondary">
            使用此页面创建测试用户后，您需要手动在Supabase控制台中确认用户的邮箱。
            <br />
            访问 Supabase Dashboard > Authentication > Users 找到用户并点击确认。
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default DevTest;
