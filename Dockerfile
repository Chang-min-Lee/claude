# 진로AI 코치 — 운영용 이미지 (외부 의존성 없음, 내장 SQLite 사용)
FROM node:22-slim
WORKDIR /app
COPY package.json server.js ./
COPY lib ./lib
COPY public ./public
COPY scripts ./scripts
# 데이터(SQLite)는 /data 볼륨에 저장 — 반드시 볼륨/디스크를 연결하세요
RUN mkdir -p /data && chown node:node /data
ENV NODE_ENV=production PORT=3000 DATA_DIR=/data TRUST_PROXY=1
VOLUME /data
EXPOSE 3000
USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD node -e "fetch('http://localhost:'+process.env.PORT+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
