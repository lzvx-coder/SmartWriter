# 文档校对系统 (Doc Correction System)

## 项目简介

这是一个基于 Flask 后端和 Vite + React 前端的文档校对系统，使用智谱AI进行文档内容审核和校对。

## 技术栈

### 后端
- **框架**: Flask 3.1.2
- **AI服务**: 智谱AI (ZhipuAI SDK)
- **文档处理**: PyPDF2, python-docx, chardet
- **跨域支持**: Flask-CORS
- **配置管理**: python-dotenv

### 前端
- **框架**: Vite + React
- **开发服务器**: Vite 7.1.12

## 目录结构

```
F:\ChengXun\project\
├── .venv/                          # Python 虚拟环境
├── project/
│   ├── backend/
│   │   ├── backened.py            # Flask 后端主文件
│   │   └── .env                   # 环境变量配置文件
│   └── doc-correction-frontend/   # 前端项目目录
```

## 环境要求

- Python 3.12+
- Node.js (用于前端开发)
- pip (Python 包管理器)
- npm (Node 包管理器)

## 安装步骤

### 1. 激活虚拟环境

```powershell
# Windows PowerShell
F:/ChengXun/project/.venv/Scripts/Activate.ps1                     （ & F:/ChengXun/project/.venv/Scripts/Activate.ps1）
```
退出只需要输入：

deactivate


即可恢复成普通 PowerShell 环境

### 2. 后端设置

#### 2.1 安装 Python 依赖

```bash
cd F:\ChengXun\project\project\backend

# 安装所有必需的包
pip install flask flask-cors zhipuai chardet PyPDF2 python-docx python-dotenv sniffio
```

#### 2.2 配置环境变量

创建 `.env` 文件：

```powershell
New-Item -Path .env -ItemType File
```

在 `.env` 文件中添加：

```env
ZHIPUAI_API_KEY=your_api_key_here
```

**注意**: 请将 `your_api_key_here` 替换为您的实际智谱AI API密钥。

### 3. 前端设置

```bash
cd F:\ChengXun\project\project\doc-correction-frontend

# 安装前端依赖 (如果尚未安装)
npm install
```

## 运行项目

### 启动后端服务

```bash
# 确保在虚拟环境中
cd F:\ChengXun\project\project\backend
python -u backened.py
```

后端服务将在以下地址运行：
- 本地地址: `http://127.0.0.1:5000`
- 网络地址: `http://10.21.195.80:5000`

### 启动前端服务

```bash
cd F:\ChengXun\project\project\doc-correction-frontend
npm run dev
```

前端服务将在以下地址运行：
- 本地地址: `http://localhost:3000/`

## API 使用示例

### 文档审核接口

```bash
curl -F 'file=@test.txt' http://localhost:5000/api/v1/review
```

## 常见问题排查

### 问题 1: `ModuleNotFoundError: No module named 'dotenv'`
**解决方案**: 安装 python-dotenv
```bash
pip install python-dotenv
```

### 问题 2: `ModuleNotFoundError: No module named 'flask'`
**解决方案**: 安装完整的依赖包
```bash
pip install flask flask-cors zhipuai chardet PyPDF2 python-docx python-dotenv
```

### 问题 3: `ModuleNotFoundError: No module named 'sniffio'`
**解决方案**: 安装 sniffio
```bash
pip install sniffio
```

### 问题 4: `OSError: 请设置环境变量 ZHIPUAI_API_KEY`
**解决方案**: 
1. 在 `backend` 目录创建 `.env` 文件
2. 添加 `ZHIPUAI_API_KEY=your_api_key_here`
3. 重启后端服务

### 问题 5: 语法错误 `SyntaxError: invalid syntax`
**原因**: 代码中可能存在格式问题，如 `import` 语句连写
**解决方案**: 检查并修正 `backened.py` 第2行的导入语句

## 开发注意事项

### 后端
- Flask 运行在开发模式 (`debug=True`)，不要在生产环境使用
- 生产环境建议使用 WSGI 服务器如 Gunicorn 或 uWSGI
- 确保 `.env` 文件不要提交到版本控制系统

### 前端
- Vite 开发服务器会自动重新优化依赖
- 如需局域网访问，使用 `npm run dev -- --host`

## 调试信息

后端调试 PIN: `144-887-974`

在开发模式下，可以使用此 PIN 访问 Werkzeug 调试器。

## 安全提示

⚠️ **重要**: 
- 不要将 API 密钥提交到代码仓库
- 使用 `.gitignore` 忽略 `.env` 文件
- 生产环境请使用环境变量而非 `.env` 文件

