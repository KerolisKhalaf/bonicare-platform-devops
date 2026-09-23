# BoniCare Backend API Review Report

**Date:** September 18, 2026  
**Reviewer:** Principal Software Engineer (Frontend Architecture)  
**Backend:** `orthopedic-platform-BoniCare-` (Node.js / Express / MongoDB)  
**Status:** Updated after implementation and native integration testing

---

## Executive Summary

The BoniCare backend exposes a functional REST API with JWT authentication, Stripe payments, AI integration (via FastAPI microservice), Socket.IO chat, file management, patient profiles, and a separate WebRTC signaling service. Documentation drift remains in several areas, but the previously missing patient profile and medical-file workflows are now implemented. Production gaps remain around AI authorization, admin APIs, payment history, TURN infrastructure, and automated browser coverage.

**Recommendation:** Continue review on the implemented native communication flow, then add server-side appointment authorization, TURN configuration, and end-to-end two-browser tests before production rollout.

---

## 1. Existing APIs Found

### Base URL
| Source | URL |
|--------|-----|
| Swagger `servers` | `http://localhost:3000/api/v1` |
| `.env.example` | `PORT=3000` |
| `server.js` default | `PORT=3000` (configured for local and Docker development) |

**Issue:** Port mismatch between Swagger/docs (3000) and server fallback (5000).

### Authentication (`/api/v1/auth`)

| Method | Path | Auth | Roles | Request Body | Response |
|--------|------|------|-------|--------------|----------|
| POST | `/auth/signup` | None | — | `{ name, email, password, phone?, role? }` | `{ success, token, user: { id, name, email, role } }` |
| POST | `/auth/login` | None | — | `{ email, password }` | `{ success, token, user }` |

**Notes:**
- Single JWT token returned (no refresh token endpoint despite `.env` JWT_REFRESH_SECRET).
- README documents `username`, `firstName`, `lastName` — actual API uses `name`.

### Patient (`/api/v1/patient`)

| Method | Path | Auth | Roles | Response |
|--------|------|------|-------|----------|
| GET | `/patient/dashboard` | Bearer | `patient` | `{ success, patient, files, ai_reports, appointments }` |
| GET | `/patient/profile` | Bearer | `patient` | `{ success, data: { user, patient } }` |
| PUT | `/patient/profile` | Bearer | `patient` | `{ name?, phone?, dob?, gender?, medical_history? }` | `{ success, data: { user, patient } }` |

**Notes:** `appointments` is hardcoded empty array in controller — not populated from DB.

### Doctor (`/api/v1/doctor`)

| Method | Path | Auth | Roles | Request | Response |
|--------|------|------|-------|---------|----------|
| GET | `/doctor/profile` | Bearer | `doctor` | — | `{ success, data: DoctorProfile }` |
| PUT | `/doctor/profile` | Bearer | `doctor` | `{ specialty, bio, licenseNumber, yearsOfExperience, hospitalInfo }` | `{ success, data }` |
| GET | `/doctor/availability` | Bearer | `doctor` | — | `{ success, data: Availability[] }` |
| POST | `/doctor/availability` | Bearer | `doctor` | `{ dayOfWeek, startTime, endTime }` | `{ success, data }` |
| DELETE | `/doctor/availability/:id` | Bearer | `doctor` | — | `{ success, message }` |
| GET | `/doctor/appointments` | Bearer | `doctor` | — | `{ success, data: Appointment[] }` |

### Appointments (`/api/v1/appointment`)

| Method | Path | Auth | Roles | Request | Response |
|--------|------|------|-------|---------|----------|
| GET | `/appointment/doctors` | Bearer | `patient`, `admin` | — | `{ success, data: DoctorProfile[] }` |
| GET | `/appointment/doctors/:doctorId/availability` | Bearer | `patient`, `admin` | — | `{ success, data }` |
| POST | `/appointment/book` | Bearer | `patient` | `{ doctorId, scheduledDate, startTime, endTime, notes? }` | `{ success, data }` |
| GET | `/appointment/my-appointments` | Bearer | `patient` | — | `{ success, data }` |
| PUT | `/appointment/:id/cancel` | Bearer | `patient`, `doctor`, `admin` | — | `{ success, message, data }` |

### Medical Files (`/api/v1/files`)

| Method | Path | Auth | Roles | Request | Response |
|--------|------|------|-------|---------|----------|
| POST | `/files/upload` | Bearer | `patient` | `multipart/form-data` field `file` | `{ success, message, data: { originalname, filename, path, size, mimetype } }` |
| GET | `/files` | Bearer | `patient` | — | `{ success, data: MedicalFile[] }` |
| GET | `/files/:filename` | Bearer | `patient` | — | File content |
| DELETE | `/files/:filename` | Bearer | `patient` | — | `{ success, message }` |

File upload persists the binary under `apps/bonicare-backend/uploads/` in native/local storage and saves patient-scoped metadata in MongoDB. Listing and deletion are registered and protected for patients.

### AI (`/api/v1/ai`)

| Method | Path | Auth | Roles | Request | Response |
|--------|------|------|-------|---------|----------|
| POST | `/ai/predict` | **None** | — | `{ patientId, features[12], fileId?, doctorId? }` | `{ status, data: AiReport }` |
| POST | `/ai/bone-fracture` | **None** | — | `multipart/form-data` field `file` | `{ status, data }` |
| GET | `/ai/health` | None | — | — | `{ status, aiStatus }` |

### Payments (`/api/v1/payment`)

| Method | Path | Auth | Roles | Request | Response |
|--------|------|------|-------|---------|----------|
| POST | `/payment/create-intent` | Bearer | `patient` | `{ appointmentId, amount, type }` | `{ status, clientSecret }` |
| POST | `/payment/webhook` | Stripe sig | — | Raw Stripe event | `{ received: true }` |
| POST | `/payment/refund` | Bearer | `admin`, `doctor` | `{ paymentId, amount?, reason? }` | `{ status, data: Payment }` |

### Notifications (`/api/v1/notification`)

| Method | Path | Auth | Roles | Request | Response |
|--------|------|------|-------|---------|----------|
| GET | `/notification/preferences` | Bearer | Any authenticated | — | `{ status, data: NotificationPreferences }` |
| PATCH | `/notification/preferences` | Bearer | Any authenticated | `{ pushEnabled?, emailEnabled? }` | `{ status, data }` |
| POST | `/notification/token` | Bearer | Any authenticated | `{ fcmToken }` | `{ status, message }` |

### Socket.IO Events (Chat)

| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `joinConversation` | Client → Server | `conversationId` | Join room |
| `sendMessage` | Client → Server | `{ receiverId, conversationId, content, ... }` | Send chat |
| `newMessage` | Server → Client | `message` | Broadcast message |
| `error` | Server → Client | string | Error feedback |

The separate WebRTC service at `localhost:5002` handles `call:ping`, `call:join`, `call:peer-joined`, `call:peer-left`, `call:offer`, `call:answer`, `call:ice-candidate`, and `call:leave`. Appointment IDs are used as rooms for both signaling and in-call chat.

---

## 2. Missing APIs (Required for Full Feature Set)

### Authentication & Profile
| Missing Endpoint | Priority | Impact |
|------------------|----------|--------|
| `POST /auth/forgot-password` | High | Password reset flow blocked |
| `POST /auth/reset-password` | High | Password reset flow blocked |
| `POST /auth/refresh-token` | Medium | Env vars exist but no endpoint |
| `GET /auth/me` | Medium | Profile bootstrap without decode |
| `PUT /auth/profile` | Medium | User profile update |

### Admin Portal
| Missing Endpoint | Priority |
|------------------|----------|
| `GET /admin/users` | Critical |
| `PUT /admin/users/:id/approve` | Critical |
| `PUT /admin/users/:id/suspend` | High |
| `GET /admin/analytics` | High |
| `GET /admin/doctors/pending` | High |
| Doctor approval workflow | Critical |

**No admin routes exist in codebase.**

### Medical Files
| Missing Endpoint | Priority | Notes |
|------------------|----------|-------|
| `GET /doctor/patients/:id/files` | High | Doctor patient records access |

### AI
| Missing Endpoint | Priority |
|------------------|----------|
| `GET /ai/reports` | High |
| `GET /ai/reports/:id` | Medium |
| Auth middleware on `/ai/*` | Critical |

### Payments
| Missing Endpoint | Priority |
|------------------|----------|
| `GET /payment/history` | Critical |
| `GET /payment/:id` | High |
| `GET /payment/refunds` | High |
| Patient ownership validation on create-intent | Medium |

### Notifications
| Missing Endpoint | Priority |
|------------------|----------|
| `GET /notification` | Critical |
| `GET /notification/unread-count` | High |
| `PATCH /notification/:id/read` | High |
| Socket `notification` event | High |

### Video Consultation (WebRTC)
| Remaining Capability | Priority |
|--------------------|----------|
| Server-side appointment authorization for signaling rooms | High |
| TURN server configuration for production NAT traversal | High |
| Call duration/state persistence | Medium |
| Automated two-browser media test | High |

### Appointments
| Missing Endpoint | Priority |
|------------------|----------|
| `PUT /appointment/:id/complete` | Medium |
| `PUT /appointment/:id/reschedule` | Medium |
| Populate appointments on patient dashboard | High |

---

## 3. Swagger Issues

| Issue | Severity | Details |
|-------|----------|---------|
| Global `security: bearerAuth` | Medium | Auth endpoints incorrectly show as requiring JWT |
| Path inconsistencies | High | Swagger documents `/appointment` POST/GET but routes are `/appointment/book`, `/appointment/my-appointments` |
| Swagger documents `/appointment/doctor/{doctorId}/availability` | Medium | Actual route: `/appointment/doctors/:doctorId/availability` |
| File endpoint documentation | Low | Controller JSDoc should be kept synchronized with route definitions |
| Notification endpoints lack Swagger JSDoc | Low | Only in route file comments |
| AI endpoints missing `security` | Critical | Undocumented public access |
| Request/response schemas incomplete | Medium | Most endpoints lack response schema definitions |
| README vs Swagger vs Code drift | High | Three sources of truth conflict |

---

## 4. Security Issues

| Issue | Severity | Recommendation |
|-------|----------|----------------|
| AI routes unauthenticated | **Critical** | Add `protect()` with role checks |
| Socket.IO CORS `origin: '*'` | High | Restrict to frontend origin |
| No rate limiting | High | Add express-rate-limit |
| Helmet imported in README but not in `server.js` | Medium | Enable security headers |
| File access is patient-only today | Medium | Add explicitly authorized doctor access when the doctor-records workflow is implemented |
| JWT single token, no refresh rotation | Medium | Implement refresh flow |
| Payment create-intent doesn't verify appointment ownership | Medium | Validate `patientId` matches |
| No CSRF for cookie-based auth | Low | OK if JWT in Authorization header only |
| FCM token update without validation | Low | Sanitize token format |

---

## 5. Scalability Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Local file storage (`uploads/`) | High | Migrate to S3 (partially configured) |
| Redis required for Socket.IO adapter | Medium | Document Redis as hard dependency |
| No pagination on list endpoints | High | Add cursor/page params |
| Patient dashboard loads all files/reports | Medium | Paginate and lazy load |
| Duplicate Socket connection handlers in `socket.js` | Low | Remove duplicate `io.on('connection')` |
| MongoDB transactions only in production | Medium | Document behavior in dev |
| AI service single point of failure | Medium | Circuit breaker, fallback UI |

---

## 6. Video Consultation Requirements

### Current State
The backend Socket.IO server provides appointment-room text chat. A separate Socket.IO WebRTC service provides signaling for native development. Both flows use the appointment ID as the room key.

### Implemented Signaling Events

```
'call:join'       → { appointmentId, userId, role }
'call:leave'      → { appointmentId }
'call:offer'      → { appointmentId, sdp }
'call:answer'     → { appointmentId, sdp }
'call:ice-candidate' → { appointmentId, candidate }
'call:peer-joined' → { appointmentId, peerCount }
'call:peer-left'   → { appointmentId }
```

### Remaining Video Consultation Work
- Add server-side appointment authorization before allowing a signaling room join.
- Configure TURN servers for production NAT traversal.
- Persist call state/duration if required by product reporting.
- Add automated two-browser media and chat tests.

---

## 7. Payment Integration Gaps

| Gap | Frontend Workaround |
|-----|---------------------|
| No payment history API | Show payments from appointment status only; request history endpoint |
| No Stripe publishable key endpoint | Use environment variable `STRIPE_PUBLISHABLE_KEY` |
| Webhook-only status updates | Poll appointment status after payment |
| Amount in cents unclear | Document: Stripe expects cents; validator should confirm |
| No idempotency key | Handle duplicate intent creation in UI |

**Integrable now:** `create-intent` + Stripe Elements with `clientSecret`.

---

## 8. Notification Integration Gaps

| Available | Missing |
|-----------|---------|
| Preference management | Notification list/inbox |
| FCM token registration | Real-time socket push to client |
| Server-side send on chat | Mark as read |
| Email via nodemailer | Notification history API |

**Frontend approach:** Implement preference UI + FCM registration. Notification center shows empty state with note until `GET /notification` is added. Use Socket.IO listener stub for future `notification` event.

---

## 9. Recommended Backend Changes (Priority Order)

### P0 — Before Production
1. Add auth middleware to all `/ai/*` routes
2. Add server-side appointment authorization to WebRTC signaling rooms
3. Add TURN infrastructure for production calls
4. Add `GET /payment/history` for authenticated users
5. Add admin route module with RBAC
6. Add `GET /notification` with pagination

### P1 — Video & Real-time
1. Persist call state and duration if required
2. Add notification events and read-state handling
3. Add browser-level WebRTC and chat tests

### P2 — Completeness
1. Password reset flow
2. Refresh token rotation
3. Swagger alignment with actual routes
4. Helmet, rate limiting, CORS hardening
5. Pagination on all list endpoints

---

## 10. Frontend Integration Decision

| Module | Integration Status |
|--------|-------------------|
| Authentication | ✅ Full |
| Patient Dashboard | ✅ Appointments, files, reports, and profile data |
| Doctor Portal | ✅ Full |
| Appointments | ✅ Full |
| Medical Files | ✅ Upload, patient-scoped listing, and deletion |
| AI Reports | ⚠️ Predict + dashboard list; no dedicated list API |
| Payments | ⚠️ Create intent + Stripe UI only |
| Notifications | ⚠️ Preferences + FCM token only |
| Admin | ❌ No backend — UI shell with gap notice |
| Video Consultation | ✅ Native signaling, two-party negotiation, and in-call chat; TURN and authorization remain |

**Review reflects the current implementation. Remaining gaps are production hardening and feature-completeness items listed above.**

---

*End of Report*
