# SwaraSangam — Complete API Reference

**Base URL (local):** `http://localhost:4000/api`  
**Interactive docs:** `http://localhost:4000/api/docs`  
**Auth:** httpOnly cookie (browsers) or `Authorization: Bearer <token>` (mobile/API)

---

## Auth

### POST /api/auth/register
Register a new student or teacher account.

**Request**
```json
{
  "email": "ravi@example.com",
  "password": "Secure1234!",
  "name": "Ravi Kumar",
  "role": "STUDENT"
}
```
`role` must be `"STUDENT"` or `"TEACHER"`. Admin/Content Manager accounts are seeded only.

**Response 201**
```json
{
  "user": {
    "id": "clx1a2b3c4",
    "email": "ravi@example.com",
    "role": "STUDENT"
  },
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Errors:** `409` email already registered, `400` validation failed

---

### POST /api/auth/login
**Request**
```json
{ "email": "demo-teacher@swara.test", "password": "Demo1234!" }
```

**Response 200**
```json
{
  "user": {
    "id": "clx...",
    "email": "demo-teacher@swara.test",
    "role": "TEACHER",
    "profile": {
      "displayName": "Priya Sharma",
      "isVerified": true
    }
  },
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```
Cookie `token=<jwt>` is also set (httpOnly, 7-day expiry).

**Errors:** `401` wrong password, `404` email not found

---

### POST /api/auth/logout
Clears the auth cookie.

**Response 200**
```json
{ "success": true }
```

---

### GET /api/auth/me
Returns the currently logged-in user. Used by `AuthContext` on every page load.

**Response 200**
```json
{
  "user": {
    "id": "clx...",
    "email": "demo-student@swara.test",
    "role": "STUDENT",
    "profile": {
      "displayName": "Arjun Nair",
      "level": "BEGINNER",
      "xp": 240,
      "streak": 5
    }
  }
}
```

**Error:** `401` not authenticated

---

### PATCH /api/auth/password
**Request**
```json
{ "currentPassword": "OldPass123!", "newPassword": "NewPass456!" }
```

**Response 200**
```json
{ "success": true }
```

**Error:** `401` current password wrong

---

## Courses

### GET /api/courses
Browse published courses. Public — no auth required.

**Query params:** `level=BEGINNER|INTERMEDIATE|ADVANCED`, `search=Bhairavi`, `page=1`, `limit=20`

**Response 200**
```json
{
  "courses": [
    {
      "id": "clx...",
      "title": "Beginner Carnatic Vocals",
      "description": "Foundation course covering swaras and basic compositions",
      "level": "BEGINNER",
      "ragas": ["Mayamalavagowla", "Shankarabharanam"],
      "price": 0,
      "isPublished": true,
      "status": "APPROVED",
      "teacher": {
        "displayName": "Priya Sharma",
        "rating": 4.8,
        "isVerified": true
      },
      "_count": { "enrollments": 24 }
    }
  ],
  "total": 1,
  "page": 1,
  "pages": 1
}
```

---

### POST /api/courses
Create a course. **TEACHER only.**

**Request**
```json
{
  "title": "Advanced Violin — Thodi Raga",
  "description": "Deep dive into Thodi raga alapana and kriti",
  "level": "ADVANCED",
  "ragas": ["Thodi", "Bhairavi"],
  "price": 1500
}
```

**Response 201**
```json
{
  "course": {
    "id": "clx...",
    "title": "Advanced Violin — Thodi Raga",
    "status": "PENDING_REVIEW",
    "isPublished": false
  }
}
```
Course goes to `PENDING_REVIEW` — Admin must approve before students can see it.

---

### GET /api/courses/my
Teacher's own courses. **TEACHER only.**

**Response 200**
```json
{
  "courses": [
    {
      "id": "clx...",
      "title": "Beginner Carnatic Vocals",
      "status": "APPROVED",
      "_count": { "enrollments": 24, "sessions": 12, "assignments": 8 }
    }
  ]
}
```

---

### GET /api/courses/enrolled
Student's enrolled courses. **STUDENT only.**

**Response 200**
```json
{
  "enrollments": [
    {
      "id": "enr...",
      "enrolledAt": "2026-01-15T10:00:00Z",
      "status": "ACTIVE",
      "course": {
        "id": "clx...",
        "title": "Beginner Carnatic Vocals",
        "teacher": { "displayName": "Priya Sharma" }
      }
    }
  ]
}
```

---

### GET /api/courses/:id
Public course detail page.

**Response 200**
```json
{
  "course": {
    "id": "clx...",
    "title": "Beginner Carnatic Vocals",
    "level": "BEGINNER",
    "ragas": ["Mayamalavagowla"],
    "price": 0,
    "teacher": {
      "displayName": "Priya Sharma",
      "bio": "15 years of teaching experience",
      "rating": 4.8,
      "isVerified": true
    }
  }
}
```

---

### POST /api/courses/:id/enroll
Enroll in a course. **STUDENT only.**

**Response 201**
```json
{
  "enrollment": {
    "id": "enr...",
    "courseId": "clx...",
    "studentId": "stu...",
    "enrolledAt": "2026-06-29T08:30:00Z",
    "status": "ACTIVE"
  }
}
```

**Errors:** `400` course not approved, `409` already enrolled

---

### PUT /api/courses/:id
Update course details. **TEACHER only (own courses).**

**Request** (partial, any subset of fields)
```json
{ "description": "Updated description", "price": 2000 }
```

**Response 200**
```json
{ "course": { "id": "clx...", "title": "...", "price": 2000 } }
```

---

### DELETE /api/courses/:id
Delete a course. **TEACHER only.**

**Response 200**
```json
{ "success": true }
```

---

## Students

### GET /api/students
List all students enrolled in the teacher's courses. **TEACHER or ADMIN.**

**Query params:** `page=1`, `limit=20`

**Response 200**
```json
{
  "students": [
    {
      "id": "stu...",
      "name": "Arjun Nair",
      "email": "arjun@example.com",
      "level": 1,
      "levelLabel": "BEGINNER",
      "xp": 240,
      "streak": 5,
      "totalSessions": 12,
      "presentSessions": 10,
      "avgScore": 78.5,
      "course": { "title": "Beginner Carnatic Vocals" },
      "enrolledAt": "2026-01-15T10:00:00Z"
    }
  ],
  "total": 1
}
```

---

### GET /api/students/me/stats
Student's own dashboard stats. **STUDENT only.**

**Response 200**
```json
{
  "stats": {
    "totalSessions": 12,
    "presentSessions": 10,
    "attendanceRate": 83.3,
    "totalAssignments": 8,
    "submittedAssignments": 6,
    "avgScore": 78.5,
    "xp": 240,
    "streak": 5,
    "level": "BEGINNER",
    "enrolledCourses": 2
  }
}
```

---

### PUT /api/students/me/profile
Update student's own profile. **STUDENT only.**

**Request**
```json
{
  "displayName": "Arjun Nair",
  "bio": "Passionate about Carnatic violin",
  "avatar": "https://..."
}
```

**Response 200**
```json
{ "profile": { "id": "stu...", "displayName": "Arjun Nair", "bio": "..." } }
```

---

### GET /api/students/:id
Full student profile. **TEACHER or ADMIN.**

**Response 200**
```json
{
  "student": {
    "id": "stu...",
    "displayName": "Arjun Nair",
    "level": "BEGINNER",
    "xp": 240,
    "streak": 5,
    "user": { "email": "arjun@example.com", "createdAt": "2026-01-01T00:00:00Z" },
    "enrollments": [...],
    "attendance": [...],
    "submissions": [...]
  }
}
```

---

## Sessions

### GET /api/sessions
Teacher sees all their sessions. Student sees sessions for their enrolled courses.

**Response 200**
```json
{
  "sessions": [
    {
      "id": "ses...",
      "title": "Week 3 — Bhairavi alapana",
      "scheduledAt": "2026-07-05T10:00:00Z",
      "duration": 60,
      "type": "GROUP",
      "status": "SCHEDULED",
      "meetingUrl": "https://meet.google.com/abc-xyz",
      "course": { "title": "Beginner Carnatic Vocals" },
      "teacher": { "displayName": "Priya Sharma" }
    }
  ]
}
```

---

### POST /api/sessions
Create a session. **TEACHER only.**

**Request**
```json
{
  "title": "Week 4 — Rhythm fundamentals",
  "courseId": "clx...",
  "scheduledAt": "2026-07-12T10:00:00.000Z",
  "duration": 60,
  "type": "GROUP",
  "meetingUrl": "https://meet.google.com/def-uvw",
  "notes": "Bring tambura",
  "isRecurring": false
}
```

**Response 201**
```json
{
  "session": {
    "id": "ses...",
    "title": "Week 4 — Rhythm fundamentals",
    "scheduledAt": "2026-07-12T10:00:00Z",
    "status": "SCHEDULED"
  }
}
```

---

### PATCH /api/sessions/:id
Update session status or details. **TEACHER only.**

**Request** (any subset)
```json
{
  "status": "COMPLETED",
  "recordingUrl": "https://drive.google.com/..."
}
```

**Response 200**
```json
{ "session": { "id": "ses...", "status": "COMPLETED" } }
```

`status` values: `SCHEDULED` → `ONGOING` → `COMPLETED` or `CANCELLED`

---

### DELETE /api/sessions/:id
**TEACHER only.** Response 200 `{ "success": true }`

---

### POST /api/sessions/:id/attendance
Mark attendance for a student. **TEACHER only.**

**Request**
```json
{ "studentId": "stu...", "status": "PRESENT" }
```

`status` values: `PRESENT`, `LATE`, `ABSENT`

**Response 200**
```json
{ "attendance": { "sessionId": "ses...", "studentId": "stu...", "status": "PRESENT" } }
```
Upserted — calling again updates the status.

---

## Assignments

### GET /api/assignments
Teacher sees all their assignments. Student sees assignments from enrolled courses.

**Response 200**
```json
{
  "assignments": [
    {
      "id": "asgn...",
      "title": "Varnam in Thodi",
      "type": "PERFORMANCE",
      "raga": "Thodi",
      "dueDate": "2026-07-20T00:00:00Z",
      "course": { "title": "Advanced Violin" },
      "_count": { "submissions": 8 }
    }
  ]
}
```

---

### POST /api/assignments
Create an assignment. **TEACHER only.**

**Request**
```json
{
  "title": "Swarajati in Bhairavi",
  "description": "Record yourself performing the Swarajati. Focus on intonation.",
  "type": "PERFORMANCE",
  "raga": "Bhairavi",
  "dueDate": "2026-07-25T00:00:00.000Z",
  "courseId": "clx..."
}
```

`type` values: `PRACTICE`, `PERFORMANCE`, `THEORY`

**Response 201**
```json
{
  "assignment": {
    "id": "asgn...",
    "title": "Swarajati in Bhairavi",
    "raga": "Bhairavi",
    "dueDate": "2026-07-25T00:00:00Z"
  }
}
```

---

### GET /api/assignments/review-queue
Ungraded submissions for the teacher to review. **TEACHER only.**

**Response 200**
```json
{
  "submissions": [
    {
      "id": "sub...",
      "status": "SUBMITTED",
      "submittedAt": "2026-07-10T08:00:00Z",
      "notes": "My attempt at the Swarajati",
      "student": { "displayName": "Arjun Nair" },
      "assignment": { "title": "Swarajati in Bhairavi", "raga": "Bhairavi" }
    }
  ]
}
```

---

### GET /api/assignments/:id
Assignment detail with submissions. **Auth required.**

**Response 200**
```json
{
  "assignment": {
    "id": "asgn...",
    "title": "Swarajati in Bhairavi",
    "submissions": [
      {
        "id": "sub...",
        "studentId": "stu...",
        "status": "GRADED",
        "score": 82,
        "feedback": "Good intonation, work on gamakas"
      }
    ]
  }
}
```

---

### POST /api/assignments/:id/submit
Submit an assignment. **STUDENT only.**

**Request**
```json
{
  "notes": "Focused on intonation for this recording",
  "recordingUrl": "/uploads/recordings/1720000000-abc123.webm"
}
```

**Response 201**
```json
{
  "submission": {
    "id": "sub...",
    "status": "SUBMITTED",
    "submittedAt": "2026-07-10T08:00:00Z"
  }
}
```

---

### POST /api/assignments/:id/grade
Grade a submission. **TEACHER only.**

**Request**
```json
{
  "submissionId": "sub...",
  "score": 85,
  "feedback": "Excellent intonation! The gamakas in the pallavi section were beautifully executed."
}
```

`score`: 0–100

**Response 200**
```json
{
  "submission": {
    "id": "sub...",
    "score": 85,
    "feedback": "Excellent intonation!...",
    "status": "GRADED",
    "gradedAt": "2026-07-11T10:00:00Z"
  }
}
```

---

## Recordings

### POST /api/recordings/upload
Upload an audio recording. **Auth required.** `multipart/form-data`.

**Field:** `audio` (file, any audio/* MIME type, max 150 MB)

```bash
curl -X POST http://localhost:4000/api/recordings/upload \
  -H "Cookie: token=<jwt>" \
  -F "audio=@practice_session.webm" \
  -F "type=PRACTICE" \
  -F "raga=Bhairavi"
```

**Response 201**
```json
{
  "recording": {
    "id": "rec...",
    "url": "/uploads/recordings/1720000000-a1b2c3d4e5f6.webm",
    "type": "PRACTICE",
    "raga": "Bhairavi",
    "createdAt": "2026-06-29T08:00:00Z"
  }
}
```

File is served at `http://localhost:4000/uploads/recordings/1720000000-a1b2c3d4e5f6.webm`

---

### GET /api/recordings/my
List current user's recordings. **Auth required.**

**Response 200**
```json
{
  "recordings": [
    {
      "id": "rec...",
      "url": "/uploads/recordings/1720000000-abc.webm",
      "type": "PRACTICE",
      "raga": "Bhairavi",
      "duration": null,
      "createdAt": "2026-06-29T08:00:00Z"
    }
  ]
}
```

---

### GET /api/recordings/student/:userId
Teacher views a specific student's recordings. **TEACHER or ADMIN.**

**Response 200** — same shape as `/my`

---

### DELETE /api/recordings/:id
Delete a recording. **Auth required (own recording only).**

**Response 200**
```json
{ "success": true }
```
Deletes both the DB row and the file from disk.

---

### GET /api/recordings/admin/storage-stats
Disk usage for all recordings. **ADMIN only.**

**Response 200**
```json
{
  "totalFiles": 47,
  "totalMB": "312.45",
  "files": [
    { "name": "1720000000-abc.webm", "sizeMB": "6.72", "createdAt": "2026-06-29" }
  ]
}
```

---

## Resources

### GET /api/resources
Teacher: their own resources. Student: resources shared with them. **Auth required.**

**Response 200**
```json
{
  "resources": [
    {
      "id": "res...",
      "title": "Mayamalavagowla — Notation Sheet",
      "type": "PDF",
      "url": "https://drive.google.com/file/...",
      "raga": "Mayamalavagowla",
      "level": "BEGINNER",
      "createdAt": "2026-05-01T00:00:00Z"
    }
  ]
}
```

---

### POST /api/resources
Create a resource. **TEACHER only.**

**Request**
```json
{
  "title": "Thodi Raga — Reference Recording",
  "type": "AUDIO",
  "url": "https://drive.google.com/...",
  "raga": "Thodi",
  "level": "ADVANCED"
}
```

`type` values: `PDF`, `AUDIO`, `VIDEO`, `LINK`

**Response 201**
```json
{ "resource": { "id": "res...", "title": "Thodi Raga — Reference Recording" } }
```

---

### POST /api/resources/:id/share
Share a resource with specific students. **TEACHER only.**

**Request**
```json
{ "studentIds": ["stu_abc", "stu_def"] }
```

**Response 200**
```json
{ "success": true, "sharedWith": ["stu_abc", "stu_def"] }
```

---

### DELETE /api/resources/:id
**TEACHER only.** Response 200 `{ "success": true }`

---

## Notifications

### GET /api/notifications
Last 50 notifications, newest first. **Auth required.**

**Response 200**
```json
{
  "notifications": [
    {
      "id": "notif...",
      "type": "BROADCAST",
      "title": "Summer Concert Registration Open!",
      "body": "Register now for the annual SwaraSangam Summer Concert",
      "read": false,
      "createdAt": "2026-06-25T09:00:00Z"
    },
    {
      "id": "notif...",
      "type": "VERIFICATION",
      "title": "Account Verified",
      "body": "Your teacher account has been verified by an admin",
      "read": true,
      "createdAt": "2026-06-20T14:00:00Z"
    }
  ]
}
```

---

### PATCH /api/notifications/read-all
**Response 200** `{ "success": true, "updated": 7 }`

---

### PATCH /api/notifications/:id/read
**Response 200**
```json
{ "notification": { "id": "notif...", "read": true } }
```

---

## Events

### GET /api/events
Public list of published events.

**Response 200**
```json
{
  "events": [
    {
      "id": "evt...",
      "title": "SwaraSangam Summer Concert 2026",
      "type": "CONCERT",
      "artists": ["Priya Sharma", "Ravi Kumar"],
      "date": "2026-08-15T00:00:00Z",
      "time": "7:00 PM",
      "venue": "Narada Gana Sabha, Chennai",
      "seats": 200,
      "booked": 143,
      "price": 500,
      "isPublished": true
    }
  ]
}
```

---

### GET /api/events/my-registrations
Events the current user has registered for. **Auth required.**

**Response 200**
```json
{ "eventIds": ["evt_abc", "evt_def"] }
```
Used by the frontend to show "Registered" badge on event cards.

---

### POST /api/events/:id/register
**Auth required.**

**Response 201**
```json
{ "registration": { "eventId": "evt...", "userId": "usr..." } }
```

**Error:** `409` already registered, `400` event full

---

## Community

### GET /api/community/posts
Public. Optional query: `category=practice|theory|tips|general`

**Response 200**
```json
{
  "posts": [
    {
      "id": "post...",
      "title": "How I mastered Kalyani raga in 3 months",
      "body": "Here is my practice routine...",
      "category": "practice",
      "tags": ["kalyani", "tips"],
      "pinned": false,
      "likedBy": ["usr_abc", "usr_def"],
      "author": { "role": "STUDENT", "student": { "displayName": "Arjun Nair" } },
      "createdAt": "2026-06-10T00:00:00Z",
      "_count": { "comments": 8 }
    }
  ]
}
```

---

### POST /api/community/posts
**Auth required.**

**Request**
```json
{
  "title": "Resources for learning Shankarabharanam",
  "body": "I have been collecting resources...",
  "category": "theory",
  "tags": ["shankarabharanam", "resources"]
}
```

**Response 201**
```json
{ "post": { "id": "post...", "title": "Resources for learning Shankarabharanam" } }
```

---

### POST /api/community/posts/:id/like
Toggle like on a post. **Auth required.**

**Response 200**
```json
{ "liked": true, "likeCount": 12 }
```

---

### POST /api/community/posts/:id/comments
**Auth required.**

**Request** `{ "body": "Great post! I had the same experience." }`

**Response 201**
```json
{
  "comment": {
    "id": "cmt...",
    "body": "Great post!",
    "author": { "student": { "displayName": "Arjun Nair" } },
    "createdAt": "2026-06-29T09:00:00Z"
  }
}
```

---

### GET /api/community/stats
Public.

**Response 200**
```json
{
  "totalPosts": 142,
  "totalComments": 856,
  "activeMembers": 67,
  "topRagas": ["Bhairavi", "Thodi", "Kalyani"]
}
```

---

## Admin

> All `/admin/*` routes require `role=ADMIN`.

### GET /api/admin/users
**Query params:** `role=STUDENT|TEACHER|ADMIN|CONTENT_MANAGER`, `search=name`, `status=ACTIVE|SUSPENDED`

**Response 200**
```json
{
  "users": [
    {
      "id": "usr...",
      "email": "arjun@example.com",
      "role": "STUDENT",
      "status": "ACTIVE",
      "createdAt": "2026-01-01T00:00:00Z",
      "student": { "displayName": "Arjun Nair" }
    }
  ],
  "total": 1
}
```

---

### PATCH /api/admin/users/:id/suspend
**Response 200** `{ "user": { "id": "...", "status": "SUSPENDED" } }`

### PATCH /api/admin/users/:id/restore
**Response 200** `{ "user": { "id": "...", "status": "ACTIVE" } }`

---

### GET /api/admin/stats
**Response 200**
```json
{
  "stats": {
    "totalStudents": 48,
    "totalTeachers": 6,
    "totalCourses": 14,
    "totalRevenue": 125000,
    "activeSessions": 3
  },
  "monthlySignups": [
    { "month": "Jan 2026", "students": 12, "teachers": 2 },
    { "month": "Feb 2026", "students": 8,  "teachers": 1 }
  ]
}
```

---

### GET /api/admin/courses
**Query params:** `status=PENDING_REVIEW|APPROVED|REJECTED`

**Response 200**
```json
{
  "courses": [
    {
      "id": "clx...",
      "title": "Advanced Violin — Thodi Raga",
      "status": "PENDING_REVIEW",
      "isPublished": false,
      "teacher": { "displayName": "Priya Sharma", "user": { "email": "priya@swara.test" } },
      "_count": { "enrollments": 0 }
    }
  ]
}
```

---

### PATCH /api/admin/courses/:id/approve
**Response 200**
```json
{ "course": { "id": "clx...", "status": "APPROVED", "isPublished": true } }
```

### PATCH /api/admin/courses/:id/reject
**Response 200**
```json
{ "course": { "id": "clx...", "status": "REJECTED", "isPublished": false } }
```

---

### GET /api/admin/teachers
**Query params:** `verified=true|false`, `search=name`

**Response 200**
```json
{
  "teachers": [
    {
      "id": "tch...",
      "displayName": "Priya Sharma",
      "isVerified": false,
      "specialization": ["Vocals", "Veena"],
      "user": { "email": "priya@swara.test", "status": "ACTIVE", "createdAt": "2026-01-01T00:00:00Z" },
      "_count": { "courses": 3, "sessions": 24 }
    }
  ]
}
```

---

### PATCH /api/admin/teachers/:id/verify
**Response 200**
```json
{ "teacher": { "id": "tch...", "isVerified": true } }
```
Also creates an in-app notification for the teacher.

### PATCH /api/admin/teachers/:id/unverify
**Response 200**
```json
{ "teacher": { "id": "tch...", "isVerified": false } }
```

---

### GET /api/admin/payments
**Response 200**
```json
{
  "payments": [
    {
      "id": "pay...",
      "amount": 1500,
      "status": "COMPLETED",
      "description": "Course enrollment — Advanced Violin",
      "teacher": { "displayName": "Priya Sharma" },
      "createdAt": "2026-06-01T00:00:00Z"
    }
  ],
  "total": 125000
}
```

---

## Content Manager

> All `/content/*` routes require `role=ADMIN` or `role=CONTENT_MANAGER`.

### GET /api/content/stats
**Response 200**
```json
{
  "stats": {
    "totalEvents": 12,
    "publishedEvents": 8,
    "draftEvents": 4,
    "totalPosts": 142,
    "pinnedPosts": 3,
    "totalRegistrations": 287
  }
}
```

---

### GET /api/content/events
All events including drafts. **Content Manager only.**

**Response 200** — same as `/api/events` but includes `isPublished: false` events.

---

### POST /api/content/events
**Request**
```json
{
  "title": "Monsoon Raga Festival 2026",
  "description": "Three-day festival featuring 12 ragas of the monsoon season",
  "type": "CONCERT",
  "artists": ["Priya Sharma", "Ravi Kumar"],
  "date": "2026-08-20T00:00:00.000Z",
  "time": "6:30 PM",
  "venue": "Music Academy, Chennai",
  "seats": 300,
  "price": 750,
  "tags": ["monsoon", "concert", "classical"],
  "isPublished": false
}
```

`type` values: `CONCERT`, `WORKSHOP`, `MASTERCLASS`, `SHOWCASE`

**Response 201**
```json
{ "event": { "id": "evt...", "title": "Monsoon Raga Festival 2026", "isPublished": false } }
```

---

### PATCH /api/content/events/:id
Update event fields. **Request** — any subset of the fields above.

**Response 200**
```json
{ "event": { "id": "evt...", "title": "Updated title", "price": 800 } }
```

---

### PATCH /api/content/events/:id/toggle
Toggle publish state.

**Response 200**
```json
{ "event": { "id": "evt...", "isPublished": true } }
```
Calling again flips it back to `false`.

---

### DELETE /api/content/events/:id
**Response 200** `{ "success": true }`

---

### POST /api/content/broadcast
Send in-app notifications to a group of users.

**Request**
```json
{
  "title": "Registration Open — Summer Concert",
  "body": "Early bird tickets available until July 31st. Book now!",
  "targetRole": "ALL"
}
```

`targetRole` values: `"ALL"`, `"STUDENT"`, `"TEACHER"`

**Response 200**
```json
{ "success": true, "sent": 54 }
```
`sent` = number of notification records created.

---

### GET /api/content/posts
All community posts (including flagged/unpinned). **Content Manager only.**

**Response 200** — same shape as `GET /api/community/posts`

---

### PATCH /api/content/posts/:id/pin
Pin or unpin a post (toggle).

**Response 200**
```json
{ "post": { "id": "post...", "pinned": true } }
```

---

### DELETE /api/content/posts/:id
**Response 200** `{ "success": true }`

---

## Reports

### GET /api/reports/monthly
Monthly student progress report. **TEACHER or ADMIN.**

**Query params:** `month=6` (1–12), `year=2026`

**Response 200**
```json
{
  "month": 6,
  "year": 2026,
  "report": [
    {
      "student": { "displayName": "Arjun Nair", "level": "BEGINNER" },
      "sessionsTotal": 8,
      "sessionsPresent": 7,
      "assignmentsTotal": 4,
      "assignmentsSubmitted": 3,
      "avgScore": 82.3
    }
  ]
}
```

---

## Earnings

### GET /api/earnings
Teacher's earnings summary. **TEACHER only.**

**Response 200**
```json
{
  "success": true,
  "total": 45000,
  "monthly": [
    { "month": "Jun 2026", "amount": 12000 },
    { "month": "May 2026", "amount": 8500 }
  ],
  "recent": [
    {
      "id": "earn...",
      "amount": 1500,
      "status": "COMPLETED",
      "description": "Enrollment — Advanced Violin",
      "createdAt": "2026-06-15T00:00:00Z"
    }
  ]
}
```

---

## Settings

### GET /api/settings
**Auth required.** Auto-creates defaults on first call.

**Response 200**
```json
{
  "success": true,
  "settings": {
    "notifAssignments": true,
    "notifSessions": true,
    "notifReminders": true,
    "notifMarketing": false,
    "notifNewStudents": true,
    "notifSubmissions": true,
    "notifPayments": true,
    "autoAcceptEnroll": false,
    "profileVisibility": "students",
    "progressVisibility": "teacher"
  }
}
```

---

### PUT /api/settings
**Auth required.** Any subset of the settings fields.

**Request**
```json
{ "notifMarketing": false, "autoAcceptEnroll": true }
```

**Response 200** `{ "success": true, "settings": { ... } }`

---

## Teacher Profile

### GET /api/teachers/me/profile
**TEACHER only.**

**Response 200**
```json
{
  "profile": {
    "id": "tch...",
    "displayName": "Priya Sharma",
    "bio": "15 years teaching Carnatic vocals and veena",
    "specialization": ["Vocals", "Veena"],
    "hourlyRate": 1500,
    "rating": 4.8,
    "totalRatings": 24,
    "isVerified": true
  }
}
```

---

### PUT /api/teachers/me/profile
**TEACHER only.**

**Request**
```json
{
  "bio": "Updated bio",
  "specialization": ["Vocals", "Veena", "Mridangam"],
  "hourlyRate": 2000
}
```

**Response 200** `{ "success": true, "profile": { ... } }`

---

## AI Guru

### POST /api/ai/chat
**Auth required.**

**Request**
```json
{ "message": "How do I improve my gamakas in Bhairavi?" }
```

**Response 200**
```json
{
  "reply": "Gamakas in Bhairavi require a delicate oscillation technique. Start by practising meend (glide) between Ga and Re slowly, then gradually increase speed. Focus on the characteristic oscillating Ga of Bhairavi — it should hover between the komal Ga and Re. Try these exercises: ..."
}
```

---

## Health

### GET /health
No auth. Used by Docker healthcheck and monitoring.

**Response 200**
```json
{ "status": "ok", "ts": 1719648000000 }
```

---

## Error Response Format

All errors return the same shape:

```json
{
  "error": "Email already registered",
  "statusCode": 409
}
```

| Status | When |
|--------|------|
| 400 | Validation failed, bad request body |
| 401 | Not authenticated (no/expired token) |
| 403 | Authenticated but wrong role |
| 404 | Resource not found |
| 409 | Conflict (duplicate enrollment, duplicate email, etc.) |
| 500 | Unexpected server error (details logged server-side) |
