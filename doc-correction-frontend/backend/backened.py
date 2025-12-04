import os
import tempfile
from pathlib import Path
from flask import Flask, request, jsonify
import json
from flask_cors import CORS
from typing import Dict, List, Optional
import time

# === 可选依赖：按需导入文档解析库 ===
try:
    from docx import Document
except ImportError:
    Document = None

try:
    import PyPDF2
except ImportError:
    PyPDF2 = None

import chardet

# === 智谱AI（GLM）SDK ===
try:
    from zhipuai import ZhipuAI
    # 注释掉不兼容的异常类导入（旧版SDK无此模块）
    # from zhipuai.core.exceptions import APIRequestError
except ImportError:
    raise ImportError("请安装智谱AI SDK: pip install zhipuai")

# === 初始化 Flask ===
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})
@app.after_request
def after_request(response):
    response.headers['Content-Type'] = 'application/json; charset=utf-8'
    return response
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 限制最大上传 10MB

# 从环境变量读取智谱AI API Key
api_key = os.getenv("ZHIPUAI_API_KEY")
if not api_key:
    # 临时测试：可直接硬编码密钥（生产环境删除）
    # api_key = "你的智谱AI API密钥"
    raise EnvironmentError("请设置环境变量 ZHIPUAI_API_KEY")

# 初始化智谱AI客户端
client = ZhipuAI(api_key=api_key)

# 支持的文件扩展名
ALLOWED_EXTENSIONS = {'.txt', '.pdf', '.docx'}


def allowed_file(filename):
    """检查文件扩展名是否允许"""
    return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS


# === 文本提取函数（保持不变）===
def extract_text_from_txt(file_path):
    with open(file_path, 'rb') as f:
        raw = f.read()
        encoding = chardet.detect(raw)['encoding'] or 'utf-8'
        return raw.decode(encoding, errors='ignore')


def extract_text_from_pdf(file_path):
    if not PyPDF2:
        raise RuntimeError("解析PDF失败：未安装 PyPDF2，请执行 pip install PyPDF2")
    text = ""
    with open(file_path, 'rb') as f:
        reader = PyPDF2.PdfReader(f)
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted
    if not text.strip():
        raise RuntimeError("PDF文件中未提取到有效文本")
    return text


def extract_text_from_docx(file_path):
    if not Document:
        raise RuntimeError("解析Word失败：未安装 python-docx，请执行 pip install python-docx")
    doc = Document(file_path)
    text = "\n".join(para.text for para in doc.paragraphs if para.text.strip())
    if not text.strip():
        raise RuntimeError("Word文件中未提取到有效文本")
    return text


def extract_text(file_path, ext):
    """根据文件后缀调用对应解析器"""
    if ext == '.txt':
        return extract_text_from_txt(file_path)
    elif ext == '.pdf':
        return extract_text_from_pdf(file_path)
    elif ext == '.docx':
        return extract_text_from_docx(file_path)
    else:
        raise ValueError(f"不支持的文件类型: {ext}")


# === 修复：JSON结构校验函数（统一前后端字段名称）===
def validate_review_result(result: Dict) -> bool:
    """校验模型返回的JSON是否符合Schema（与前端ReviewResultResponse一致）"""
    required_fields = ["total_score", "detail_json", "issues", "word_count"]
    # 检查核心字段是否存在
    for field in required_fields:
        if field not in result:
            return False
    # 检查 detail_json 子字段（与前端一致：grammar、logic、readability、innovation、standardization）
    detail_fields = ["grammar", "logic", "readability", "innovation", "standardization"]
    if not isinstance(result["detail_json"], dict):
        return False
    for field in detail_fields:
        if field not in result["detail_json"]:
            return False
    # 检查 issues 结构
    if not isinstance(result["issues"], list):
        return False
    # 检查字段类型
    if not (isinstance(result["total_score"], (int, float)) and isinstance(result["word_count"], int)):
        return False
    return True


# === 核心：调用智谱AI（GLM）进行批改（修复异常捕获+统一字段）===
def call_llm_for_review(text):
    """
    调用 智谱AI（GLM-4）对文本进行结构化批改
    含重试机制、JSON清洗、结构校验
    """
    if not text.strip():
        raise ValueError("输入文本为空")

    truncated_text = text[:4000]  # 截断过长文本

    # 强化prompt：统一字段名称（与前端一致），明确要求只返回JSON
    prompt = (
        f"你是一位严谨的学术/技术文档评审专家。\n"
        f"任务：对以下文本进行多维度质量评估，严格按照指定JSON Schema输出结果，不添加任何额外内容！\n"
        f"JSON Schema（必须严格遵守，字段不能缺失、类型正确，与前端完全一致）：\n"
        f"{{\n"
        f'  "total_score": 数字（0-100，支持小数）,\n'
        f'  "detail_json": {{\n'
        f'    "grammar": 数字（0-100，语法正确性）,\n'
        f'    "logic": 数字（0-100，逻辑连贯性）,\n'
        f'    "readability": 数字（0-100，可读性）,\n'
        f'    "innovation": 数字（0-100，创新性，可选字段可填0）,\n'
        f'    "standardization": 数字（0-100，规范性）\n'
        f"  }},\n"
        f'  "issues": 数组（元素为对象，含 loc_start、loc_end、issue_type、message、suggestion 字段）,\n'
        f'  "word_count": 整数（文本总字数）\n'
        f"}}\n"
        f"注意：\n"
        f"1. 只输出JSON字符串，无任何前缀、后缀、解释性文字或Markdown格式（如```json、中文说明等）；\n"
        f"2. 若文本无明显问题，issues数组可为空数组[]；\n"
        f"3. 所有分数必须在0-100之间，word_count为非负整数；\n"
        f"4. detail_json字段名称必须与上述一致，不可用其他同义词替代（如用originality代替innovation）。\n\n"
        f"待批改文本（前4000字符）：\n"
        f"{truncated_text}"
    )

    max_retries = 2  # 重试次数（避免临时网络/限流问题）
    retry_delay = 1  # 重试间隔（秒）

    for attempt in range(max_retries + 1):
        try:
            # 修复：使用更兼容的模型（glm-4-turbo支持更广泛，旧版SDK也支持）
            response = client.chat.completions.create(
                model="glm-4.5",  # 替换为 glm-4-turbo，避免模型名称不兼容
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                max_tokens=1500,  # 足够容纳JSON结果
                stream=False
            )

            result_text = response.choices[0].message.content.strip()
            print(f"模型原始返回（第{attempt+1}次尝试）：{result_text}")  # 调试用，帮助排查问题

            # 清洗JSON：去除可能的多余字符（代码块标记、前后空格、引号）
            result_text = result_text.strip().strip('```').strip('json').strip().strip('"').strip("'")

            # 解析JSON
            result = json.loads(result_text)

            # 校验结构是否符合要求（与前端一致）
            if validate_review_result(result):
                return result
            else:
                if attempt < max_retries:
                    print("JSON结构不符合要求（字段缺失/类型错误），重试中...")
                    time.sleep(retry_delay)
                    continue
                else:
                    raise RuntimeError("模型返回的JSON结构不符合要求（字段缺失/类型错误），请重试")

        # 修复：注释掉未定义的APIRequestError捕获
        # except APIRequestError as e:
        #     error_msg = f"智谱AI API调用失败：{e.message}（错误码：{e.code}）"
        #     if attempt < max_retries and e.code in [429, 503]:
        #         print(f"{error_msg}，{retry_delay}秒后重试...")
        #         time.sleep(retry_delay)
        #         continue
        #     else:
        #         raise RuntimeError(error_msg)
        except json.JSONDecodeError as e:
            # JSON解析失败（模型返回非JSON内容）
            error_msg = f"模型返回内容不是合法JSON：{str(e)}，原始内容：{result_text[:200]}..."
            if attempt < max_retries:
                print(f"{error_msg}，重试中...")
                time.sleep(retry_delay)
                continue
            else:
                raise RuntimeError(error_msg)
        except Exception as e:
            # 捕获所有其他异常（兼容旧版SDK、网络错误等）
            error_msg = f"智谱AI调用失败：{str(e)}"
            if attempt < max_retries:
                print(f"{error_msg}，{retry_delay}秒后重试...")
                time.sleep(retry_delay)
                continue
            else:
                raise RuntimeError(error_msg)

    raise RuntimeError("达到最大重试次数，仍未获取有效批改结果")



# === 主路由：接收文件并返回批改结果（添加详细日志打印）===
@app.route('/api/v1/review', methods=['POST'])
def review_document():
    try:
        if 'file' not in request.files:
            print("❌ 错误：前端未提供 file 参数")  # 新增日志
            return jsonify({"error": "未提供文件"}), 400

        file = request.files['file']
        filename = file.filename
        if not filename:
            print("❌ 错误：文件名为空")  # 新增日志
            return jsonify({"error": "文件名为空"}), 400

        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            print(f"❌ 错误：不支持的文件类型 {ext}")  # 新增日志
            return jsonify({"error": f"不支持的文件类型: {ext}，仅支持 .txt/.pdf/.docx"}), 415

        # 保存临时文件
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            file.save(tmp.name)
            tmp_path = tmp.name
        print(f"✅ 临时文件保存成功：{tmp_path}")  # 新增日志

        try:
            # 提取文本
            text = extract_text(tmp_path, ext)
            print(f"✅ 文本提取成功，长度：{len(text)} 字符")  # 新增日志

            # 调用模型批改
            result = call_llm_for_review(text)
            print(f"✅ 模型批改成功，返回结果：{result}")  # 新增日志

            return jsonify({
                "success": True,
                "data": result
            }), 200

        except RuntimeError as e:
            # 业务异常（重点打印）
            print(f"❌ 业务错误：{str(e)}")  # 新增日志
            return jsonify({"error": str(e)}), 400
        except ValueError as e:
            # 参数错误（重点打印）
            print(f"❌ 参数错误：{str(e)}")  # 新增日志
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            # 其他未知错误（打印完整堆栈）
            print(f"❌ 未知错误：")
            import traceback
            traceback.print_exc()  # 打印完整错误堆栈
            return jsonify({"error": f"服务器内部错误：{str(e)}"}), 500
        finally:
            # 确保临时文件被删除
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
                print(f"✅ 临时文件已删除：{tmp_path}")  # 新增日志

    except Exception as e:
        # 最外层异常捕获（打印完整堆栈）
        print(f"❌ 请求处理失败：")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"请求处理失败：{str(e)}"}), 500


# === 启动服务 ===
if __name__ == '__main__':
    print("✅ 服务启动中... 请确保已设置 ZHIPUAI_API_KEY")
    print("📌 访问示例：curl -F 'file=@test.txt' http://localhost:5000/api/v1/review")
    app.run(host='0.0.0.0', port=5000, debug=True)