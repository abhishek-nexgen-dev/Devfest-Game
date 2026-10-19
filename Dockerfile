FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

COPY . .
RUN pnpm build

FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm

ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN pnpm install --prod --frozen-lockfile || pnpm install --prod

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.js"]

