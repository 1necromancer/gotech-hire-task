# GoTech Chat — Fix Write-up

## Security Fixes

### 1. Replaced MD5 with bcrypt for password hashing
**File:** `backend/src/auth/auth.service.ts`

MD5 is cryptographically broken — rainbow tables can reverse MD5 hashes in seconds. Replaced with bcrypt (cost factor 10), which is purpose-built for password hashing with built-in salting and adaptive cost.

Changed login flow: instead of hashing the input and comparing hashes via SQL query, now fetch user by username and use `bcrypt.compare()` for constant-time comparison.

### 2. Moved JWT secret to environment variable
**Files:** `backend/src/auth/auth.service.ts`, `backend/src/chat/chat.controller.ts`, `docker-compose.yml`

The JWT signing secret `'supersecret'` was hardcoded in two separate files. Moved to `process.env.JWT_SECRET` with a fallback. Added `JWT_SECRET` to docker-compose environment. This prevents secret leakage through source control and allows rotation without code changes.

Eliminated the second hardcoded occurrence in `chat.controller.ts` by injecting `AuthService.verifyToken()` instead of duplicating JWT verification logic.

### 3. Removed password exposure from GET /users
**File:** `backend/src/auth/user.controller.ts` (was `backend/src/app.controller.ts`)

The `/users` endpoint returned full user objects including password hashes. Now strips the `password` field from response using destructuring. Also added JWT authentication to the endpoint — it was previously accessible to anyone.

Removed the anti-pattern of accessing `chatService['userRepository']` (private field access) by creating a proper `getUsers()` method in `AuthService`.

### 4. JWT verification in WebSocket gateway
**File:** `backend/src/chat/chat.gateway.ts`

The gateway trusted client-supplied `userId` in the `sendMessage` payload — any user could impersonate another. Now:
- Verifies JWT token from `client.handshake.auth.token` on connection
- Stores `userId` and `username` in `client.data` (server-side)
- Disconnects clients with missing or invalid tokens
- `sendMessage` uses server-verified identity, ignoring any client-supplied userId

### 5. Fixed XSS vulnerability in MessageItem
**File:** `frontend/src/components/MessageItem.tsx`

`dangerouslySetInnerHTML` rendered raw HTML from message content, allowing script injection (`<script>`, `<img onerror>`, etc.). Replaced with standard JSX text rendering which automatically escapes HTML entities.

---

## Architecture Fixes

### 6. Split monolithic AppModule into feature modules
**Files:** `backend/src/auth/auth.module.ts`, `backend/src/chat/chat.module.ts`, `backend/src/app.module.ts`

All controllers, services, and entities were registered in a single `AppModule`. Created:
- `AuthModule` — handles authentication (AuthService, AuthController, UserController)
- `ChatModule` — handles chat functionality (ChatService, ChatController, ChatGateway)

Each module imports only the TypeORM entities it needs and explicitly exports shared services.

### 7. Moved business logic from controller to service
**Files:** `backend/src/auth/auth.controller.ts` (was `backend/src/app.controller.ts`)

Registration validation (`username.length < 3`) was in the controller. Moved to DTO validation with `class-validator` decorators (`@MinLength(3)`) enforced by `ValidationPipe`.

### 8. Enabled ValidationPipe with DTOs
**Files:** `backend/src/main.ts`, `backend/src/auth/auth.controller.ts`, `backend/src/chat/chat.controller.ts`

DTOs (`CreateUserDto`, `SendMessageDto`) were defined but never enforced — controllers used `body: any`. Added global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true`. Controllers now use typed DTOs. Added `CreateRoomDto` for room creation.

### 9. Decomposed ChatPage (400+ lines) into subcomponents
**Files:** `frontend/src/components/ChatPage.tsx`, `MessageList.tsx`, `MessageInput.tsx`, `CreateRoomForm.tsx`

Split the monolithic `ChatPage` into focused components:
- `MessageList` — renders messages with auto-scroll
- `MessageInput` — message text input with Enter key support
- `CreateRoomForm` — room creation form

### 10. Eliminated prop drilling with React Context
**Files:** `frontend/src/context/AppContext.tsx`, `frontend/src/App.tsx`

`token`, `socket`, `userId`, and `apiUrl` were passed through 4-5 component levels (App → ChatPage → RoomList → MessageItem) even when intermediate components didn't use them. Created `AppContext` with a provider that also manages socket lifecycle.

---

## Performance Fixes

### 11. Fixed N+1 query in getMessages
**File:** `backend/src/chat/chat.service.ts`

Each message triggered a separate `SELECT` to fetch its user — O(N+1) queries. Replaced with a single query using `createQueryBuilder` with `leftJoinAndSelect` to fetch messages and their users in one SQL query.

### 12. Added database indexes on foreign key columns
**File:** `backend/src/entities/message.entity.ts`, `backend/src/entities/user.entity.ts`

`room_id` and `user_id` in messages table had no indexes, causing full table scans on `WHERE` clauses. Added `@Index()` decorators. Also added index on `users.username` for login lookups.

### 13. Added message pagination
**Files:** `backend/src/chat/chat.service.ts`, `backend/src/chat/chat.controller.ts`

All messages were loaded at once regardless of room history size. Added `limit` (default 50) and `offset` query parameters using TypeORM's `skip()`/`take()`.

### 14. Append new messages instead of full refetch
**File:** `frontend/src/components/ChatPage.tsx`

On every `newMessage` WebSocket event, the client re-fetched ALL messages via REST (`fetchMessages()`). Changed to append: `setMessages(prev => [...prev, message])`.

### 15. Fixed socket recreation on every render
**Files:** `frontend/src/context/AppContext.tsx` (was `frontend/src/App.tsx`)

`io('http://localhost:3000')` was called in the component body (no `useRef`/`useMemo`), creating a new connection on every React render. Moved to `AppContext` with `useMemo` — socket is created once per token change. Also passes JWT token via `auth` option for server-side verification.

---

## Code Quality Fixes

### 16. Removed dead code and console.logs
**File:** `backend/src/auth/auth.service.ts`, `backend/src/chat/chat.gateway.ts`

Removed: commented-out bcrypt import/method, commented-out `refreshToken`, `console.log` statements in register/login/gateway. Replaced production logging with NestJS `Logger` where appropriate.

### 17. Added proper TypeScript types
**Files:** Multiple backend and frontend files

Replaced `any` types with proper interfaces/types: DTO classes for request bodies, `Room`/`Message`/`User` entity types for service return values, typed WebSocket message payloads in gateway.

### 18. Converted class component to functional
**File:** `frontend/src/components/Header.tsx` (was `frontend/src/class-components/Header.class.tsx`)

The only class component in an otherwise functional codebase. Converted to a functional component, eliminating the magic number state (`status: 1` = disconnected, `status: 2` = connected) in favor of directly using the `isConnected` boolean prop.

### 19. Fixed naming conventions
**File:** `backend/src/entities/message.entity.ts`

Mixed `snake_case` (`room_id`, `user_id`) and `camelCase` (`senderName`) within the same entity. Standardized: camelCase in TypeScript code (`roomId`, `userId`), snake_case in database columns via `@Column({ name: 'room_id' })`.

### 20. Fixed React list keys
**File:** `frontend/src/components/MessageList.tsx` (was in `ChatPage.tsx`)

Array indexes were used as React keys (`key={index}`), which causes incorrect DOM recycling when items are added/removed. Changed to `key={msg.id}` using the database primary key.

### 21. Centralized API URL configuration
**Files:** `frontend/src/components/LoginPage.tsx`, `RegisterPage.tsx`, `frontend/src/context/AppContext.tsx`

`http://localhost:3000` was hardcoded in 4 places. Centralized to `import.meta.env.VITE_API_URL || 'http://localhost:3000'`, configurable via Vite environment variables.
