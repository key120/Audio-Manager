# Supabase 配置说明

## ✅ 当前配置状态

**前端应用地址：** http://localhost:3000
**Supabase Site URL：** http://localhost:3000

✅ **端口已匹配** - 所有认证功能（登录、注册、密码重置、OAuth）将正常工作，无需额外配置。

---

## 📋 必需配置清单

### 1. 数据库表结构

确保已创建 `audio_files` 表：

```sql
CREATE TABLE audio_files (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  duration float,
  mime_type text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

### 2. 行级安全（RLS）策略

在 `audio_files` 表上启用RLS并创建策略：

```sql
-- 启用RLS
ALTER TABLE audio_files ENABLE ROW LEVEL SECURITY;

-- 允许用户查看自己的文件
CREATE POLICY "Users can view own files"
  ON audio_files
  FOR SELECT
  USING (auth.uid() = user_id);

-- 允许用户插入自己的文件
CREATE POLICY "Users can insert own files"
  ON audio_files
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 允许用户更新自己的文件
CREATE POLICY "Users can update own files"
  ON audio_files
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 允许用户删除自己的文件
CREATE POLICY "Users can delete own files"
  ON audio_files
  FOR DELETE
  USING (auth.uid() = user_id);
```

### 3. 存储桶配置

1. **创建存储桶**
   - 进入 **Storage** → **Buckets**
   - 创建名为 `audio-files` 的存储桶
   - 设置为私有（Private）

2. **配置存储策略**

```sql
-- 允许用户上传文件
CREATE POLICY "Users can upload files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'audio-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 允许用户查看自己的文件
CREATE POLICY "Users can view own files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'audio-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 允许用户更新自己的文件
CREATE POLICY "Users can update own files"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'audio-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 允许用户删除自己的文件
CREATE POLICY "Users can delete own files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'audio-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 4. 文件大小限制

在存储桶设置中：
- 设置最大文件大小为 **50MB**
- 允许的文件类型：MP3, WAV, AAC, FLAC, OGG

---

## 🔐 Google OAuth 配置（可选）

如果需要启用Google登录：

### 步骤1：创建Google OAuth应用
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 **Google+ API** 或 **Google Identity API**
4. 创建OAuth 2.0客户端ID
5. 设置授权重定向URI为：
   ```
   https://utpxkyjfdhvtelkyclzh.supabase.co/auth/v1/callback
   ```

### 步骤2：在Supabase中配置
1. 进入 **Authentication** → **Settings** → **External OAuth Providers**
2. 找到 **Google**
3. 启用Google OAuth
4. 输入Google客户端ID和密钥
5. 保存

---

## ⚙️ 环境变量

当前项目环境变量（已在 `.env` 中配置）：

```
REACT_APP_SUPABASE_URL=https://utpxkyjfdhvtelkyclzh.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**注意：** `service_role` 密钥不应暴露在前端，仅用于服务器端操作。

---

## 🧪 测试认证流程

应用运行在：http://localhost:3000

可以测试以下流程：

### 1. 注册流程
- 访问 http://localhost:3000/register
- 使用邮箱注册新账户
- 检查邮箱验证提示："注册成功！请检查您的邮箱并点击验证链接来激活账户"

### 2. 登录流程
- 访问 http://localhost:3000/login
- 输入验证过的邮箱和密码
- 成功登录到主界面
- 如果邮箱未验证，会提示："请先验证您的邮箱后再登录"

### 3. 密码重置流程
- 访问 http://localhost:3000/reset-password
- 输入邮箱
- 检查密码重置邮件

### 4. 密码更新流程
- 点击邮件中的重置链接
- 访问 http://localhost:3000/update-password
- 设置新密码

---

## 📞 故障排除

如果遇到问题，请检查：

1. **Supabase控制台**
   - 查看 Authentication → Settings，确认Site URL是 http://localhost:3000
   - 查看是否有错误日志

2. **浏览器开发者工具**
   - Network 选项卡：查看API请求是否成功
   - Console 选项卡：查看JavaScript错误

3. **环境变量**
   - 确认 `.env` 文件中的URL和密钥正确
   - 重新启动开发服务器（`npm start`）

---

**当前状态：** ✅ 所有配置已完成，应用可正常使用

**最后更新：** 2025-11-03
