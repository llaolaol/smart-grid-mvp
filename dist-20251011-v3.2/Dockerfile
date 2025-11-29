# 1. 使用官方 Nginx 镜像（Alpine 版，20 MB 左右）
FROM nginx:alpine

# 2. 复制自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 3. 把当前目录所有文件拷到 Nginx 默认静态目录
COPY . /usr/share/nginx/html

# 4. 暴露 80 端口并前台启动
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]