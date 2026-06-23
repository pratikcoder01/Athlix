# ATHLIX - API Route Map & Events Specification

This document charts the available REST API endpoints and Socket.io real-time events.

---

## 🔒 Authentication Scope
Endpoints protected by JWT require the client to supply a HTTP header:
`Authorization: Bearer <token>`

---

## 📍 API Route Map

### 1. Authentication Module (`/api/auth`)
| HTTP Method | Route | Auth Required | Description | Request Body Shape |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/register` | No | Registers user and creates empty profile. | `{ name, email, password, role, discipline?, beltRank? }` |
| **POST** | `/login` | No | Verifies credentials and yields token. | `{ email, password }` |
| **GET** | `/me` | Yes | Validates session token and yields context. | None |

### 2. User Profiles Module (`/api/profiles`)
| HTTP Method | Route | Auth Required | Description | Request Body Shape |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/` | Yes | List profiles (supports `search`, `discipline`, `role` query filters). | Query params: `?search=joe&role=coach` |
| **GET** | `/:userId` | Yes | Fetch complete Athlete/Coach profile. | None |
| **PUT** | `/` | Yes | Update profile bio, disciplines, and social links. | `{ bio, discipline, beltRank, achievements[], location, socialLinks: { instagram, twitter, linkedin }, profileImage }` |
| **PUT** | `/coach` | Yes (Coach) | Update professional coaching availability calendar. | `{ certifications[], experienceYears, pricingPerHour, availability: [{ dayOfWeek, startTime, endTime }], active }` |

### 3. Academy Discovery Module (`/api/academies`)
| HTTP Method | Route | Auth Required | Description | Request Body Shape |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/` | Yes (Owner) | Registers a new academy with location coordinates. | `{ name, address, longitude, latitude, disciplines[], description, schedule, gallery[] }` |
| **GET** | `/` | Yes | Search academies by name, discipline, or distance. | Query params: `?search=Renzo&discipline=BJJ&lat=37.77&lng=-122.41&maxDistanceKm=15` |
| **GET** | `/:id` | Yes | Fetch details of a single academy. | None |

### 4. Tournament Management Module (`/api/tournaments`)
| HTTP Method | Route | Auth Required | Description | Request Body Shape |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/` | Yes | List tournaments (supports `discipline`, `status`, `search` filters). | Query params: `?discipline=BJJ&status=upcoming` |
| **POST** | `/` | Yes (Org/Admin)| Register a new competitive tournament event. | `{ title, description, date, registrationDeadline, location, entryFee, disciplines[], brackets? }` |
| **GET** | `/:id` | Yes | Fetch details of tournament brackets. | None |
| **POST** | `/:id/register`| Yes (Athlete)| Registers current athlete into tournament. | None |
| **PUT** | `/:id/brackets`| Yes (Org/Admin)| Update bracket schema or status. | `{ brackets, status }` |

### 5. Private Training Bookings Module (`/api/bookings`)
| HTTP Method | Route | Auth Required | Description | Request Body Shape |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/` | Yes (Athlete) | Book a coaching session slot. | `{ coachId, scheduledTime, durationMinutes, price }` |
| **GET** | `/` | Yes | List bookings for athlete or coach. | None |
| **PATCH**| `/:id` | Yes (Coach) | Accept, reject, or complete booking. | `{ status: "accepted" \| "rejected" \| "completed" }` |

### 6. Community Feed Module (`/api/posts`)
| HTTP Method | Route | Auth Required | Description | Request Body Shape |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/` | Yes | Fetch community feed posts. | None |
| **POST** | `/` | Yes | Create post with content and media. | `{ content, mediaUrl?, mediaType? }` |
| **POST** | `/:id/like` | Yes | Toggle user like on a post. | None |
| **POST** | `/:id/comments`| Yes | Comment on post. | `{ content }` |
| **GET** | `/:id/comments`| Yes | Fetch comments list for a post. | None |

---

## ⚡ Socket.io Real-time Events

### Client-to-Server Handshakes
- `join_user_room` (payload: `userId: string`): Joins a unique, secure user channel for private notifications.

### Server-to-Client Broadcasts
- `notification` (channel: `userId`): Sent instantly on new comments, likes, or booking alerts:
  ```json
  {
    "id": "notif_id",
    "type": "booking" | "social" | "tournament",
    "message": "Coach Kirat accepted your training request",
    "createdAt": "2026-06-23T10:30:00Z"
  }
  ```
- `booking_update` (channel: `userId`): Sent when booking is accepted/rejected or completed.
- `new_post` (broadcast): Emitters push new social posts to all active feeds in real-time.
