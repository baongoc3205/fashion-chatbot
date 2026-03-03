# Kiến Trúc Hệ Thống - Fashion AI Chatbot

## 1. Tổng Quan Kiến Trúc

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
│  Next.js App Router + useChat() + Generative UI Components  │
│  [ChatInterface] [ProductCard] [OrderCard] [PolicyCard]     │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP Stream (SSE)
┌─────────────────────▼───────────────────────────────────────┐
│                     API LAYER                               │
│  /api/chat - Request validation, session management, log    │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                     AGENT LAYER                             │
│  Vercel AI SDK Core: streamText()                           │
│  - System Prompt (Vietnamese fashion assistant persona)     │
│  - Tool definitions (6 tools)                               │
│  - Conversation history management                          │
│  - Multi-step tool calling                                  │
└──────────┬──────────────────────────┬───────────────────────┘
           │ Tool Call                │ Tool Call
┌──────────▼──────────┐   ┌──────────▼───────────────────────┐
│    TOOL LAYER       │   │    RAG PIPELINE                  │
│  - searchProducts   │   │  - Embedding: Gemini             │
│  - getProductDetail │   │    text-embedding-004 (768 dims) │
│  - checkStock       │   │  - Hybrid Search:                │
│  - addToCart        │   │    Semantic (pgvector cosine)     │
│  - createOrder      │   │    + Keyword filter              │
│  - getPolicy        │   │  - Re-ranking by relevance       │
└──────────┬──────────┘   └──────────┬───────────────────────┘
           │                         │
┌──────────▼─────────────────────────▼───────────────────────┐
│                   DATABASE LAYER                            │
│  PostgreSQL 16 + pgvector                                   │
│  Prisma ORM                                                 │
│  [products] [variants] [embeddings] [orders] [messages]     │
└─────────────────────────────────────────────────────────────┘
```

## 2. Component Layers Chi Tiết

### 2.1 Client Layer
- **Framework**: Next.js 15 App Router
- **Chat hook**: `useChat()` từ Vercel AI SDK React
- **Streaming**: Server-Sent Events (SSE) cho real-time streaming
- **Generative UI**: AI trả structured data → Frontend render React components

**Key Components:**
| Component | Mô tả | Data Source |
|-----------|--------|-------------|
| `ChatInterface` | Giao diện chat chính | useChat() |
| `ProductCard` | Card sản phẩm với ảnh, giá, size | Tool: searchProducts |
| `ProductGrid` | Grid hiển thị nhiều sản phẩm | Tool: searchProducts |
| `ProductDetail` | Chi tiết sản phẩm đầy đủ | Tool: getProductDetail |
| `StockBadge` | Badge hiển thị tình trạng kho | Tool: checkStock |
| `OrderConfirmation` | Card xác nhận đơn hàng | Tool: createOrder |
| `PolicyInfo` | Hiển thị chính sách | Tool: getPolicy |

### 2.2 API Layer
- **Route**: `POST /api/chat`
- **Input**: `{ messages: Message[], sessionId: string }`
- **Output**: Streaming response (text + tool results)
- **Middleware**: Session validation, rate limiting (future)

### 2.3 Agent Layer
- **Engine**: `streamText()` từ `ai` package
- **Model**: Google Gemini 2.5 Flash (fast, cost-effective, strong reasoning)
- **Provider**: `@ai-sdk/google`
- **System Prompt**: Vietnamese fashion assistant persona
- **Max steps**: 5 (multi-step tool calling)
- **Temperature**: 0.3 (balanced creativity vs accuracy)

### 2.4 Tool Layer

```typescript
// 6 tools chính
const tools = {
  searchProducts:   { /* Tìm kiếm sản phẩm bằng semantic search + filter */ },
  getProductDetail: { /* Lấy chi tiết sản phẩm từ DB */ },
  checkStock:       { /* Kiểm tra tồn kho variant cụ thể */ },
  addToCart:        { /* Thêm sản phẩm vào giỏ hàng */ },
  createOrder:      { /* Tạo đơn hàng từ giỏ hàng */ },
  getPolicy:        { /* Truy vấn chính sách cửa hàng */ },
};
```

### 2.5 Database Layer
- **Engine**: PostgreSQL 16
- **ORM**: Prisma (type-safe queries)
- **Vector**: pgvector extension cho similarity search
- **Tables**: 12 models (xem `prisma/schema.prisma`)

## 3. RAG Pipeline

### 3.1 Indexing Phase (Seed time)
```
Product Data → Generate text content → Gemini Embedding API → Store in product_embeddings
```

**Content template:**
```
"{product.name} - {product.brand} - {product.category.name}
{product.description}
Chất liệu: {product.material}
Tags: {product.tags.join(', ')}
Giá: {product.price} VND"
```

### 3.2 Query Phase (Runtime)
```
User query → Gemini Embedding → pgvector cosine similarity
                                → Filter by category/gender/price
                                → Top-K results (K=6)
                                → Return to Agent
```

### 3.3 Hybrid Search Strategy
1. **Semantic search**: pgvector `<=>` operator (cosine distance)
2. **Keyword filter**: Prisma `where` clause (category, brand, price range, gender)
3. **Re-ranking**: Combine similarity score + business rules (in-stock first, popular first)

## 4. Agentic Workflow

### 4.1 Decision Flow
```
User Message
    │
    ▼
Agent analyzes intent
    │
    ├─ Simple greeting/chitchat → Direct text response
    │
    ├─ Need product info → Call searchProducts / getProductDetail
    │
    ├─ Check availability → Call checkStock
    │
    ├─ Cart action → Call addToCart
    │
    ├─ Order action → Call createOrder (may need customer info first)
    │
    └─ Policy question → Call getPolicy
```

### 4.2 Multi-step Example
```
User: "Tìm áo sơ mi trắng size M, thêm vào giỏ luôn"
  → Step 1: Agent calls searchProducts("áo sơ mi trắng")
  → Step 2: Agent calls checkStock(productId, "M", "trắng")
  → Step 3: Agent calls addToCart(variantId, 1)
  → Agent responds with confirmation + ProductCard
```

## 5. Generative UI Strategy

AI **không trả HTML/React code**. Thay vào đó:
1. Tool trả về **structured JSON** (product data, order data)
2. Frontend nhận tool results → **map to React components**
3. Pattern: `toolName → Component mapping`

```typescript
const componentMap = {
  searchProducts:   ProductGrid,    // Hiển thị grid sản phẩm
  getProductDetail: ProductDetail,  // Chi tiết sản phẩm
  checkStock:       StockBadge,     // Tình trạng kho
  addToCart:        CartNotification,// Thông báo giỏ hàng
  createOrder:      OrderConfirmation,// Xác nhận đơn
  getPolicy:        PolicyCard,     // Thẻ chính sách
};
```

## 6. Data Flow Diagram

```
┌─────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐
│  User   │───▶│ Next.js  │───▶│  Vercel   │───▶│  Tools   │
│ Browser │    │   API    │    │  AI SDK   │    │  Layer   │
│         │◀───│ /api/chat│◀───│streamText │◀───│          │
└─────────┘    └──────────┘    └───────────┘    └────┬─────┘
   SSE Stream    Validate       Orchestrate          │
   + UI Render   + Log          + Decide             │
                                                     ▼
                                              ┌──────────────┐
                                              │ PostgreSQL   │
                                              │ + pgvector   │
                                              │              │
                                              │ Products     │
                                              │ Embeddings   │
                                              │ Orders       │
                                              │ Messages     │
                                              └──────────────┘
```

## 7. Technology Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js (App Router) | 15.x |
| Chat SDK | Vercel AI SDK | latest |
| LLM | Google Gemini 2.5 Flash | - |
| Embedding | Gemini text-embedding-004 | 768 dims |
| ORM | Prisma | latest |
| Database | PostgreSQL | 16 |
| Vector Search | pgvector | 0.7+ |
| Validation | Zod | latest |
| Container | Docker Compose | - |
| Language | TypeScript | 5.x |
