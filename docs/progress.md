# 📊 Tiến Độ Dự Án - Fashion AI Chatbot

> **Cập nhật lần cuối**: 26/02/2026  
> **Trạng thái tổng thể**: 🟡 Đang triển khai (Tuần 2/5)

---

## 🗓️ Tổng Quan Timeline

| Tuần | Nội dung | Trạng thái | Hoàn thành |
|------|----------|------------|------------|
| 1 | Requirements, Architecture & Database Design | ✅ Hoàn thành | 100% |
| 2 | Tool Layer, Chat API & Embedding Pipeline | 🟡 Gần xong | 85% |
| 3 | Client Layer (Chat UI + Generative UI) | ⬜ Chưa bắt đầu | 0% |
| 4 | RAG Enhancement & Agent Optimization | ⬜ Chưa bắt đầu | 0% |
| 5 | Testing, Polish & Deploy | ⬜ Chưa bắt đầu | 0% |

---

## ✅ Tuần 1 — Requirements, Architecture & Database Design (100%)

### Phase 1: Project Initialization
- [x] Khởi tạo Next.js 15 + TypeScript + App Router
- [x] Cài dependencies: `ai`, `@ai-sdk/google`, `prisma`, `pgvector`, `zod`
- [x] Thiết lập folder structure (`app/`, `lib/`, `prisma/`, `docs/`)

### Phase 2: Requirements Analysis
- [x] Tài liệu yêu cầu → `docs/requirements.md`
- [x] Intent taxonomy (7 intents)
- [x] Happy-case flow (≤ 8 turns)
- [x] Non-functional requirements

### Phase 3: Architecture Design
- [x] Kiến trúc 5 lớp → `docs/architecture.md`
- [x] RAG pipeline design (Gemini text-embedding-004, pgvector)
- [x] Generative UI strategy
- [x] Agentic Workflow design

### Phase 4: Database Schema
- [x] Prisma schema (12 models) → `prisma/schema.prisma`
- [x] Seed data templates → `prisma/seed-data.ts`
- [x] Seed script (~200 sản phẩm) → `prisma/seed.ts`
- [x] Prisma client singleton → `src/lib/db/prisma.ts`

### Phase 5: Infrastructure
- [x] Docker Compose file (PostgreSQL 16 + pgvector)
- [x] Environment config (`.env`, `.env.example`)
- [x] Package scripts (`db:generate`, `db:push`, `db:seed`, `db:studio`, `db:embed`)

---

## 🟡 Tuần 2 — Tool Layer, Chat API & Embedding Pipeline (85%)

### Phase 1: Bug Fixes ✅
- [x] Fix Policy vector dimension (1536 → 768 cho Gemini)
- [x] Update seed.ts reference (OpenAI → Gemini)

### Phase 2: Docker & Database ⚠️ BLOCKED
- [ ] ⚠️ **Docker Desktop chưa chạy** — cần khởi động thủ công
- [ ] `docker compose up -d`
- [ ] `npx prisma db push`
- [ ] `npm run db:seed`
- [ ] `npm run db:embed` (generate embeddings)
- [ ] Verify bằng Prisma Studio

### Phase 3: Tool Layer ✅
- [x] `searchProducts` — tìm kiếm keyword + filter danh mục/brand/giới tính/giá
- [x] `getProductDetail` — chi tiết sản phẩm + variants grouped by color
- [x] `checkStock` — kiểm tra tồn kho theo size/color
- [x] `addToCart` — thêm giỏ hàng + validate stock + auto-create cart
- [x] `createOrder` — tạo đơn hàng + tính phí ship + giảm stock (transaction)
- [x] `getPolicy` — tra cứu chính sách cửa hàng
- [x] `tools/index.ts` — export tools với AI SDK v6 `inputSchema`

### Phase 4: Chat API Route ✅
- [x] `POST /api/chat` endpoint
- [x] Gemini 2.5 Flash model
- [x] Vietnamese system prompt (xưng em, gọi anh/chị)
- [x] Multi-step tool calling (`stopWhen: stepCountIs(5)`)
- [x] Session-based cart/order management

### Phase 5: RAG & Embedding ✅
- [x] `generate-embeddings.ts` — batch embed bằng Gemini text-embedding-004
- [x] `rag/index.ts` — `semanticSearch()` với pgvector cosine similarity

### Phase 6: Verification ✅
- [x] `npm run build` — PASS (0 errors)
- [x] `npm run dev` — PASS (localhost:3000)
- [ ] Test chat endpoint (cần DB chạy)

---

## ⬜ Tuần 3 — Client Layer (0%)

### Chat UI
- [ ] Chat interface component (`ChatInterface`)
- [ ] Message list + input box
- [ ] `useChat()` hook integration
- [ ] Streaming text display

### Generative UI Components
- [ ] `ProductCard` — card sản phẩm nhỏ
- [ ] `ProductGrid` — grid nhiều sản phẩm
- [ ] `ProductDetail` — chi tiết sản phẩm đầy đủ
- [ ] `StockBadge` — badge tình trạng kho
- [ ] `CartNotification` — thông báo giỏ hàng
- [ ] `OrderConfirmation` — xác nhận đơn hàng
- [ ] `PolicyCard` — thẻ chính sách

### Tool Result → Component Mapping
- [ ] `toolName → Component` mapping logic
- [ ] Render tool results as React components

---

## ⬜ Tuần 4 — RAG Enhancement & Agent Optimization (0%)

- [ ] Integrate semantic search vào `searchProducts` tool
- [ ] Hybrid search: semantic + keyword
- [ ] Re-ranking logic (in-stock first, popular first)
- [ ] Conversation history persistence
- [ ] Context window management
- [ ] Error handling & fallback responses
- [ ] Rate limiting

---

## ⬜ Tuần 5 — Testing, Polish & Deploy (0%)

- [ ] End-to-end testing (full conversation flow)
- [ ] Edge case handling
- [ ] Performance optimization
- [ ] UI polish & responsive design
- [ ] Deployment setup (Vercel / Docker)
- [ ] Documentation final review

---

## 📁 File Structure Hiện Tại

```
fashion-chatbot/
├── docs/
│   ├── requirements.md          ✅ Tuần 1
│   ├── architecture.md          ✅ Tuần 1
│   └── progress.md              ✅ File này
├── prisma/
│   ├── schema.prisma            ✅ 12 models + pgvector
│   ├── seed.ts                  ✅ ~200 sản phẩm
│   └── seed-data.ts             ✅ Templates dữ liệu
├── src/
│   ├── app/
│   │   ├── api/chat/route.ts    ✅ Tuần 2
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── generated/prisma/        ✅ Auto-generated
│   └── lib/
│       ├── db/prisma.ts         ✅ Singleton (PrismaPg adapter)
│       ├── tools/
│       │   ├── index.ts         ✅ 6 tools exported
│       │   ├── search-products.ts
│       │   ├── get-product-detail.ts
│       │   ├── check-stock.ts
│       │   ├── add-to-cart.ts
│       │   ├── create-order.ts
│       │   └── get-policy.ts
│       ├── rag/
│       │   ├── index.ts         ✅ semanticSearch()
│       │   └── generate-embeddings.ts  ✅ Batch embed script
│       └── utils/index.ts       ✅ formatVND, generateOrderNumber
├── docker-compose.yml           ✅ PostgreSQL 16 + pgvector
├── .env / .env.example          ✅ Gemini API key
└── package.json                 ✅ All scripts configured
```

---

## 🛠️ Tech Stack

| Component | Technology | Status |
|-----------|-----------|--------|
| Frontend | Next.js 16.1.6 (App Router) | ✅ |
| AI Model | Google Gemini 2.5 Flash | ✅ |
| AI SDK | Vercel AI SDK v6.0.97 | ✅ |
| Embedding | Gemini text-embedding-004 (768 dims) | ✅ |
| ORM | Prisma v7.4.1 | ✅ |
| Database | PostgreSQL 16 + pgvector | ⚠️ Docker chưa chạy |
| Validation | Zod v4 | ✅ |

---

## ⚠️ Blockers & Risks

| Issue | Impact | Giải pháp |
|-------|--------|-----------|
| Docker Desktop chưa chạy | Không thể seed data, test DB | Khởi động Docker Desktop |
| AI SDK v6 breaking changes | `inputSchema` thay `parameters`, API streaming khác | Đã fix ✅ |
| Prisma v7 constructor thay đổi | Cần `PrismaPg` adapter | Đã fix ✅ |
