#!/bin/bash
# ============================================================================
# setup-ecs.sh — 阿里云 ECS (Alibaba Cloud Linux 3) 博客项目环境一键部署
# ============================================================================
#
# 【用途】
#   在一台全新的 ACL3 ECS 上安装博客项目运行所需的全部基础设施：
#   Docker、Nginx、GitLab Runner、Node.js、防火墙规则等。
#   这个脚本只需要运行一次，后续部署由 GitLab CI/CD 自动完成。
#
# 【使用方法】
#
#   方式一：SSH 到 ECS 后直接运行（推荐）
#     1. 把这个文件上传到 ECS（或者 git clone 项目后进入目录）
#     2. 给脚本执行权限：  chmod +x scripts/setup-ecs.sh
#     3. 以 root 身份运行：sudo ./scripts/setup-ecs.sh
#
#   方式二：从本地通过 SSH 远程执行
#     scp scripts/setup-ecs.sh root@<ECS公网IP>:/root/
#     ssh root@<ECS公网IP> 'bash /root/setup-ecs.sh'
#
# 【前置条件】
#   - 操作系统：Alibaba Cloud Linux 3（基于 RHEL/CentOS 生态，使用 dnf 包管理器）
#   - 以 root 身份执行（脚本会自动检查）
#   - ECS 安全组已放通 22(SSH)、80(HTTP)、443(HTTPS) 端口
#
# 【脚本执行完成后还需要手动做的事】
#   1. 创建 /opt/blog/docker-compose.yml（编排后端服务 + 数据库）
#   2. 创建 /opt/blog/.env（生产环境变量，含数据库密码、JWT 密钥等）
#   3. 配置 /etc/nginx/conf.d/blog.conf（Nginx 反向代理和静态文件托管）
#   4. 注册 GitLab Runner：gitlab-runner register
#   5. 在项目中创建 .gitlab-ci.yml 并推送触发首次流水线
#   6. （可选）用 certbot 配置 HTTPS：certbot --nginx -d your-domain.com
#
# ============================================================================

set -euo pipefail
# ┌─────────────────────────────────────────────────────────────────────┐
# │ set -e   : 任何命令返回非零退出码时立即终止脚本，防止错误被忽略      │
# │ set -u   : 引用未定义变量时报错，防止 typo 导致的隐蔽 bug           │
# │ set -o pipefail : 管道中任何一个命令失败，整个管道返回失败           │
# │ 三者组合是 shell 脚本的最佳实践，等价于"严格模式"                   │
# └─────────────────────────────────────────────────────────────────────┘

# ── 颜色输出辅助函数 ──────────────────────────────────────────────────
# ANSI 转义序列：\033[xxm 设置文字样式，\033[0m 重置
# 1;32 = 加粗绿色，1;34 = 加粗蓝色，1;31 = 加粗红色，1;33 = 加粗黄色
info()  { echo -e "\033[1;34m[INFO]\033[0m  $*"; }
ok()    { echo -e "\033[1;32m[OK]\033[0m    $*"; }
warn()  { echo -e "\033[1;33m[WARN]\033[0m  $*"; }
err()   { echo -e "\033[1;31m[ERROR]\033[0m $*"; }

# ── 前置检查 ──────────────────────────────────────────────────────────
# $EUID 是 bash 内置变量，值为当前用户的 effective user ID，root 为 0
if [[ $EUID -ne 0 ]]; then
  err "请以 root 身份运行此脚本：sudo $0"
  exit 1
fi

info "开始部署博客服务器环境..."
echo ""

# ======================================================================
# 0. 配置 Swap（防止构建时 OOM）
# ======================================================================
# 低配 ECS（1-2GB RAM）在 Vite/Rollup 构建前端时可能内存不足，
# 被 Linux OOM Killer 直接 kill 掉。
# 添加 1GB swap 文件作为内存溢出缓冲区：
#   - fallocate 预分配空间（比 dd 快）
#   - chmod 600 限制只有 root 可读写（安全要求）
#   - mkswap 格式化为 swap 分区
#   - swapon 立即启用
#   - 写入 /etc/fstab 确保重启后自动挂载
# ======================================================================
info "步骤 0/7：配置 Swap"

if swapon --show | grep -q '/swapfile'; then
  warn "Swap 已配置，跳过"
else
  fallocate -l 1G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  ok "已创建 1GB swap 文件"
fi
echo ""

# ======================================================================
# 1. 系统更新 + 基础工具
# ======================================================================
# dnf 是 ACL3/CentOS 8+/Fedora 的包管理器（yum 的下一代）
# -y 表示所有确认提示自动回答 yes
#
# 安装的工具说明：
#   git       - 版本控制，CI/CD 拉代码时需要
#   curl/wget - 命令行下载工具，后续安装 nvm、gitlab-runner 等都需要
#   vim       - 文本编辑器，在服务器上编辑配置文件用
#   tar/unzip - 压缩/解压工具
#   htop      - 交互式进程监控工具（比 top 好用），排查性能问题时需要
#   rsync     - 文件同步工具，CI/CD 部署前端静态文件时使用
#               rsync 比 cp 更高效——它只传输变更的文件，而不是全量复制
#   yum-utils - 提供 yum-config-manager 命令，添加 Docker 的 yum 源时需要
# ======================================================================
info "步骤 1/7：系统更新 + 安装基础工具"

dnf update -y
dnf install -y git curl wget vim tar unzip htop rsync yum-utils

ok "基础工具安装完成"
echo ""

# ======================================================================
# 2. 安装 Docker
# ======================================================================
# Docker 是容器引擎，我们用它来运行后端 Node.js 服务和 PostgreSQL 数据库。
# 使用容器的好处：
#   - 环境隔离：不会污染宿主机，版本冲突不存在
#   - 可复现：Dockerfile 描述了完整环境，任何机器上构建结果一致
#   - 易升级：换个镜像版本就能升级，不用担心残留依赖
#
# 安装步骤说明：
#   1) yum-config-manager --add-repo：添加 Docker 官方 yum 源
#      使用阿里云镜像（mirrors.aliyun.com）替代 Docker 官方源，
#      因为国内访问 download.docker.com 很慢
#   2) dnf install：安装 Docker 核心组件
#      - docker-ce          : Docker 社区版守护进程（核心引擎）
#      - docker-ce-cli      : docker 命令行工具
#      - containerd.io      : 底层容器运行时（Docker 依赖它管理容器生命周期）
#      - docker-buildx-plugin : Docker 镜像构建增强插件（支持多平台构建等）
#      - docker-compose-plugin: Docker Compose V2（用 docker compose 命令编排多容器）
#   3) systemctl enable --now：enable 设置开机自启，--now 同时立即启动
# ======================================================================
info "步骤 2/7：安装 Docker"

if command -v docker &>/dev/null; then
  warn "Docker 已安装，跳过"
else
  yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
  dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable docker --now
  ok "Docker 安装完成"
fi

# ── 配置 Docker 镜像加速器 ────────────────────────────────────────────
# Docker 默认从 Docker Hub（registry-1.docker.io）拉取镜像，国内访问极慢。
# 配置镜像加速器后，docker pull 会优先从国内 CDN 节点拉取，速度提升 10-50 倍。
#
# /etc/docker/daemon.json 是 Docker 守护进程的全局配置文件：
#   registry-mirrors : 镜像加速器地址列表（Docker 会按顺序尝试）
#   log-driver       : 日志驱动，json-file 是默认值
#   log-opts.max-size : 单个容器日志文件最大 50MB，防止日志撑爆磁盘
#   log-opts.max-file : 最多保留 3 个轮转日志文件（即 150MB 上限）
#
# systemctl restart docker：修改配置后需要重启 Docker 守护进程才能生效
# ──────────────────────────────────────────────────────────────────────
info "配置 Docker 镜像加速器和日志限制..."

mkdir -p /etc/docker
cat > /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "https://docker.m.daocloud.io"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "3"
  }
}
EOF
systemctl restart docker

ok "Docker 镜像加速 + 日志限制配置完成"
echo ""

# ======================================================================
# 3. 安装 Nginx
# ======================================================================
# Nginx（发音 engine-x）是高性能 Web 服务器和反向代理服务器。
# 在我们的架构中，Nginx 承担两个角色：
#
#   角色一：静态文件服务器
#     前端 Vite 构建产物（HTML/CSS/JS）是纯静态文件，
#     Nginx 直接托管这些文件，无需 Node.js 运行时。
#     静态文件性能极高（Nginx 用 sendfile 零拷贝技术直接从磁盘发送到网络）。
#
#   角色二：反向代理
#     外部请求通过 Nginx 转发到后端 Node.js 服务（:4000）。
#     好处：
#     - 统一入口：用户只需访问 80/443 端口
#     - SSL 终止：HTTPS 加解密由 Nginx 处理，后端只需处理明文 HTTP
#     - WebSocket 代理：AI 聊天的流式响应需要 WebSocket，Nginx 支持透传
#     - 未来可扩展负载均衡（多个后端实例）
# ======================================================================
info "步骤 3/7：安装 Nginx"

if command -v nginx &>/dev/null; then
  warn "Nginx 已安装，跳过"
else
  dnf install -y nginx
  systemctl enable nginx --now
  ok "Nginx 安装完成"
fi
echo ""

# ======================================================================
# 4. 创建项目目录
# ======================================================================
# /opt/ 是 Linux FHS（文件系统层次标准）中用于放置第三方应用的目录。
# 我们的部署文件（docker-compose.yml、.env、源码）放在 /opt/blog/。
#
# /var/www/ 是 Web 服务器默认的文档根目录（约定俗成）。
# /var/www/blog/ 存放前端构建产物，Nginx 直接从这里提供静态文件服务。
# ======================================================================
info "步骤 4/7：创建项目目录"

mkdir -p /opt/blog
mkdir -p /var/www/blog

ok "目录创建完成：/opt/blog（后端部署） /var/www/blog（前端静态文件）"
echo ""

# ======================================================================
# 5. 安装 GitLab Runner
# ======================================================================
# GitLab Runner 是 GitLab CI/CD 的执行器。
# 工作原理：
#   1. Runner 注册到你的 GitLab 项目后，会持续轮询 GitLab 服务器
#   2. 当有新的代码推送触发流水线时，GitLab 将任务分配给 Runner
#   3. Runner 在本地执行 .gitlab-ci.yml 中定义的脚本（构建、测试、部署）
#   4. 执行结果和日志回传给 GitLab，你可以在 GitLab 网页上查看
#
# Executor 类型选择 "shell"：
#   Runner 支持多种 executor（shell、docker、kubernetes 等）。
#   我们选 shell executor，因为部署操作需要直接控制宿主机的 Docker 和文件系统。
#   如果用 docker executor，runner 会在容器内执行，无法直接管理宿主机的 Docker。
#
# 安装方式：使用清华镜像源的 RPM 仓库（dnf install）
#   直接下载二进制文件的方式走 AWS S3 海外节点，国内速度极慢（~20KB/s）。
#   改用清华大学开源镜像站的 yum 仓库安装，走国内 CDN，速度可达 MB/s 级别。
#
#   RPM 包安装的额外好处（相比手动下载二进制）：
#   - 自动创建 gitlab-runner 系统用户
#   - 自动注册 systemd 服务
#   - 自动处理依赖
#   - 后续升级只需 dnf update gitlab-runner
# ======================================================================
info "步骤 5/7：安装 GitLab Runner"

if command -v gitlab-runner &>/dev/null; then
  warn "GitLab Runner 已安装，跳过"
else
  # 添加清华镜像源的 GitLab Runner yum 仓库
  # 清华镜像的目录结构是 el9-x86_64/ 这种扁平格式（没有 el8 目录）
  # GitLab Runner 是 Go 静态编译的二进制，el9 包在 ACL3（基于 RHEL 8）上完全兼容
  cat > /etc/yum.repos.d/gitlab-runner.repo << 'EOF'
[gitlab-runner]
name=gitlab-runner
baseurl=https://mirrors.tuna.tsinghua.edu.cn/gitlab-runner/yum/el9-x86_64/
enabled=1
gpgcheck=0
EOF

  dnf install -y gitlab-runner

  ok "GitLab Runner 安装完成"
fi
echo ""

# ======================================================================
# 6. 权限配置
# ======================================================================
# gitlab-runner 用户需要以下权限才能执行 CI/CD 任务：
#
#   docker 组：
#     Linux 中，Docker 守护进程的 socket 文件（/var/run/docker.sock）
#     默认只有 root 和 docker 组成员可以访问。
#     usermod -aG docker gitlab-runner 把用户加入 docker 组，
#     这样 runner 可以执行 docker build、docker compose 等命令。
#     -a = append（追加，不移除原有组），-G = supplementary groups
#
#   /opt/blog 和 /var/www/blog 的所有权：
#     CI/CD 脚本需要把构建产物写入这两个目录：
#     - /opt/blog：后端代码和 docker-compose.yml
#     - /var/www/blog：前端静态文件
#     chown -R 递归修改目录的 owner 和 group
# ======================================================================
info "步骤 6/7：配置权限"

usermod -aG docker gitlab-runner
chown -R gitlab-runner:gitlab-runner /opt/blog
chown -R gitlab-runner:gitlab-runner /var/www/blog

ok "权限配置完成"
echo ""

# ======================================================================
# 7. 为 gitlab-runner 用户安装 Node.js
# ======================================================================
# CI/CD 流水线中需要 Node.js 来构建前端（pnpm build）。
# 后端虽然在 Docker 内构建，但前端是在宿主机上构建后直接部署到 /var/www/blog/。
#
# 使用 nvm（Node Version Manager）安装 Node.js：
#   nvm 是 Node.js 版本管理工具，安装在用户目录下（~/.nvm/），
#   不需要 root 权限，不会影响系统全局环境。
#   优点：可以轻松切换版本、多版本共存。
#
# 技术细节：
#   su -s /bin/bash gitlab-runner << 'NODEEOF'
#   ┌────────────────────────────────────────────────────────────────────┐
#   │ su       : 切换到 gitlab-runner 用户执行后续命令                    │
#   │ -s       : 指定使用的 shell（避免用户默认 shell 不是 bash 的情况）   │
#   │ << 'NODEEOF' : heredoc 语法，将多行文本作为标准输入传给 su          │
#   │ 引号包裹 'NODEEOF' 表示不做变量替换（$HOME 等不会被当前 shell 展开）│
#   └────────────────────────────────────────────────────────────────────┘
#
#   export NVM_DIR="$HOME/.nvm" ：
#     nvm 安装后将自身放在 ~/.nvm/ 目录，需要设置这个环境变量让 nvm 命令可用。
#     直接 source nvm.sh 而不是 source ~/.bashrc，因为非交互式 shell 中
#     .bashrc 通常在开头检测 $PS1（命令提示符），如果不存在就直接 return，
#     导致后续的 nvm 初始化代码永远不会被执行。
#
#   corepack enable ：
#     Node.js 16+ 内置了 corepack，它是包管理器的管理器。
#     启用后可以直接使用 pnpm 命令（无需 npm install -g pnpm）。
#     corepack prepare pnpm@10.10.0 --activate 锁定 pnpm 版本，
#     确保与项目 packageManager 字段一致。
# ======================================================================
info "步骤 7/7：为 gitlab-runner 用户安装 Node.js"

su -s /bin/bash gitlab-runner << 'NODEEOF'
set -e
cd ~

# 创建 .bashrc（nvm 安装脚本需要写入初始化代码，RPM 创建的用户可能没有此文件）
touch ~/.bashrc

# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# 直接加载 nvm（不依赖 .bashrc 的交互式 shell 检测）
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# 安装 Node.js 22（LTS）
nvm install 22

# 启用 corepack 并激活 pnpm
corepack enable
corepack prepare pnpm@10.10.0 --activate

# 验证安装
echo "Node.js: $(node --version)"
echo "pnpm:    $(pnpm --version)"
NODEEOF

ok "Node.js + pnpm 安装完成"
echo ""

# ======================================================================
# 8. 配置防火墙
# ======================================================================
# firewalld 是 ACL3/CentOS/RHEL 默认的防火墙管理工具。
# 它基于 iptables/nftables，但提供了更友好的"zone"抽象。
#
# 默认情况下，只有 SSH(22) 是放通的。我们需要额外开放：
#   - http  (80)  : Nginx 监听，提供 HTTP 服务
#   - https (443) : Nginx 监听，提供 HTTPS 服务（certbot 配置后使用）
#
# --permanent 表示持久化规则（重启后仍生效），但不立即应用。
# firewall-cmd --reload 重新加载配置使其立即生效。
#
# 注意：ECS 安全组 和 firewalld 是两层防火墙，都需要放通才能访问。
#   - 安全组：阿里云控制台配置，控制进出 ECS 的网络流量
#   - firewalld：操作系统级别，控制进出主机的流量
#   两者都需要放通 80/443，缺一不可。
# ======================================================================
info "配置防火墙（放通 HTTP/HTTPS）..."

if systemctl is-active --quiet firewalld; then
  firewall-cmd --permanent --add-service=http
  firewall-cmd --permanent --add-service=https
  firewall-cmd --reload
  ok "防火墙已放通 80(HTTP) 和 443(HTTPS)"
else
  warn "firewalld 未运行，跳过防火墙配置（请确认 ECS 安全组已放通 80/443）"
fi
echo ""

# ======================================================================
# 安装完成，输出摘要
# ======================================================================
echo "================================================================="
echo ""
ok "环境部署完成！已安装："
echo "    - Docker $(docker --version 2>/dev/null | grep -oP '\d+\.\d+\.\d+' || echo '(请检查)')"
echo "    - Docker Compose $(docker compose version 2>/dev/null | grep -oP '\d+\.\d+\.\d+' || echo '(请检查)')"
echo "    - Nginx $(nginx -v 2>&1 | grep -oP '\d+\.\d+\.\d+' || echo '(请检查)')"
echo "    - GitLab Runner $(gitlab-runner --version 2>/dev/null | head -1 | grep -oP '\d+\.\d+\.\d+' || echo '(请检查)')"
echo "    - Node.js + pnpm（gitlab-runner 用户环境）"
echo ""
echo "================================================================="
echo ""
info "接下来需要手动完成以下步骤："
echo ""
echo "  1. 创建生产环境变量文件（项目中有模板 deploy/.env.example）："
echo "     cp deploy/.env.example /opt/blog/.env"
echo "     vim /opt/blog/.env"
echo "     提示：用以下命令生成随机密码和密钥："
echo "       openssl rand -base64 16    # POSTGRES_PASSWORD"
echo "       openssl rand -base64 32    # JWT_SECRET"
echo ""
echo "  2. 部署 Nginx 配置（项目中有配置 deploy/nginx/blog.conf）："
echo "     cp deploy/nginx/blog.conf /etc/nginx/conf.d/blog.conf"
echo "     vim /etc/nginx/conf.d/blog.conf    # 修改 server_name 为你的域名"
echo "     nginx -t && systemctl reload nginx"
echo ""
echo "  3. 域名 DNS 解析："
echo "     将域名 A 记录指向本机公网 IP"
echo ""
echo "  4. 注册 GitLab Runner（token 在 GitLab 项目 Settings > CI/CD > Runners 获取）："
echo "     gitlab-runner register \\"
echo "       --url https://gitlab.com \\"
echo "       --token <你的runner-token> \\"
echo "       --executor shell \\"
echo "       --description 'ecs-blog-runner'"
echo ""
echo "  5.（可选）给 gitlab-runner 用户 Nginx 重载权限："
echo "     echo 'gitlab-runner ALL=(ALL) NOPASSWD: /usr/bin/nginx, /usr/bin/systemctl reload nginx' \\"
echo "       | tee /etc/sudoers.d/gitlab-runner"
echo ""
echo "  6. 在 GitHub 仓库配置 Secrets（Settings > Secrets > Actions）："
echo "     GITLAB_TOKEN — GitLab Personal Access Token（scope: write_repository）"
echo "     GITLAB_REPO  — GitLab 仓库地址（如 gitlab.com/username/blog-fullstack.git）"
echo ""
echo "  7. 推送代码到 GitHub main 分支，GitHub Action 自动镜像到 GitLab 并触发 CI/CD"
echo ""
echo "  8.（可选）配置 HTTPS："
echo "     dnf install -y certbot python3-certbot-nginx"
echo "     certbot --nginx -d blog.cuiqs.com"
echo ""
echo "  9.（可选）配置 HTTPS 证书续期："
echo "     certbot renew"
echo ""
echo "  10.（可选）HTTPS 证书手动续期："
echo "     certbot certonly --manual --preferred-challenges dns -d blog.cuiqs.com"
echo ""
echo "     查看证书到期时间："
echo "     certbot certificates"
echo ""
echo "================================================================="
