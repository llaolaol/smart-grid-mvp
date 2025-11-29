# Dashboard 应用 Dockerfile - 变压器运行数据可视化分析系统
FROM nginx:alpine

# 复制自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制所有静态文件到 nginx 目录
COPY . /usr/share/nginx/html

# 暴露端口 80
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]