# 思维导图管理页面 API 调用失败 - 调试指南

## 问题描述
点击"思维导图管理"页面时,提示"API调用失败,已加载示例数据"

## 调试步骤

### 1. 浏览器控制台检查 (最重要!)

打开浏览器开发者工具:
- Chrome: F12 或 右键 -> 检查
- 访问: http://localhost:3001 (knowledge-reasoning服务)
- 打开"思维导图管理"页面

**检查Console标签**:
- 查找红色错误信息
- 特别注意包含以下关键词的错误:
  - `CORS`
  - `Access-Control-Allow-Origin`
  - `Network Error`
  - `SSL`
  - `certificate`

**检查Network标签**:
- 找到 `mindmap2ftree` 请求
- 查看状态码:
  - 0: 请求被浏览器阻止 (通常是CORS)
  - 404: 接口地址错误
  - 500: 服务器内部错误
  - 502/503: 服务不可用
- 点击该请求,查看:
  - Request Headers (请求头)
  - Response Headers (响应头)
  - Response Body (响应内容)

### 2. Docker容器网络测试

```bash
# 进入knowledge-reasoning容器
docker exec -it smart-grid-knowledge-reasoning sh

# 测试网络连通性
curl -v https://fdsu.bd.kxsz.net:9443/api/v1/mindmap2ftree

# 如果报SSL错误,尝试跳过证书验证
curl -k -v https://fdsu.bd.kxsz.net:9443/api/v1/mindmap2ftree

# 测试POST请求
curl -X POST https://fdsu.bd.kxsz.net:9443/api/v1/mindmap2ftree \
  -H "Content-Type: application/json" \
  -d '{"mindmap":"测试","prompt":"测试"}' \
  -v
```

### 3. 对比本地运行版本

如果原平台(dist-20251011-v3.2)在本地单独运行正常:

```bash
# 启动一个本地HTTP服务器
cd dist-20251011-v3.2
python3 -m http.server 8888

# 访问 http://localhost:8888
# 打开思维导图管理页面
# 对比Network请求的差异
```

### 4. 检查API服务器CORS配置

API服务器 `https://fdsu.bd.kxsz.net:9443` 需要配置以下响应头:

```
Access-Control-Allow-Origin: http://localhost:3001
# 或
Access-Control-Allow-Origin: *

Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

### 5. 临时解决方案 - 使用代理

如果是CORS问题,可以通过nginx反向代理解决:

编辑 `dist-20251011-v3.2/nginx.conf`:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # 添加代理配置
    location /api-proxy/ {
        # 代理到生产API
        proxy_pass https://fdsu.bd.kxsz.net:9443/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_ssl_verify off;  # 如果SSL证书有问题
    }

    # ... 其他配置
}
```

然后修改 `dist-20251011-v3.2/assets/index12.js`:
```javascript
// 从:
v=t=>a.post("https://fdsu.bd.kxsz.net:9443/api/v1/mindmap2ftree",t)

// 改为:
v=t=>a.post("/api-proxy/api/v1/mindmap2ftree",t)
```

## 预期结果

根据调试结果,将看到以下信息之一:

1. **CORS错误** -> 需要配置API服务器CORS或使用nginx代理
2. **网络错误** -> 需要检查Docker网络配置或防火墙
3. **SSL错误** -> 需要配置证书信任或跳过验证
4. **参数错误** -> 需要修改请求参数格式

## 下一步

完成上述检查后,请提供:
1. 浏览器Console的完整错误信息
2. Network标签中请求的状态码和响应
3. Docker容器内curl测试的结果

这样我可以给出更精确的解决方案。
