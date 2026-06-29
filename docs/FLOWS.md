# SwaraSangam — User Flows

Every flow below maps the user action → which page handles it → which API is called → what happens in the database.

---

## Flow 1: Registration & Login

### Student/Teacher Self-Registration
```
User visits /register
  → Fills: name, email, password, role (STUDENT or TEACHER)
  → POST /api/auth/register
  → API: validates with Zod, bcrypt.hash(password, 10)
  → DB: INSERT User + INSERT StudentProfile (or TeacherProfile)
  → Returns JWT (set as httpOnly cookie + JSON)
  → Redirect to /student or /teacher dashboard
```

### Login
```
User visits /login
  → Fills: email, password
  → POST /api/auth/login
  → API: finds User by email, bcrypt.compare(password, hash)
  → jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: '7d' })
  → Cookie: token=<jwt>; HttpOnly; SameSite=Lax; Path=/
  → Redirect based on role: STUDENT→/student, TEACHER→/teacher, ADMIN→/admin
```

### Auth State in Frontend
```
AuthContext (src/contexts/AuthContext.tsx)
  → On mount: GET /api/auth/me (uses cookie automatically)
  → Sets user in React state
  → All pages call useAuth() to get { user, loading, logout }
  → Protected pages redirect to /login if user is null
```

---

## Flow 2: Student Enrolls in a Course

```
Student visits /marketplace (Browse Courses page)
  → GET /api/courses?level=BEGINNER&search=Bhairavi
  → Sees list of APPROVED courses only
  → Clicks "Enroll"
  → POST /api/courses/:id/enroll
  → DB: INSERT Enrollment { studentId, courseId, status: ACTIVE }
  → 409 if already enrolled
  → Student's /student/classes page now shows this course
```

**DB tables touched:** `enrollments`, (reads `courses`)

---

## Flow 3: Teacher Creates a Course

```
Teacher visits /teacher/courses
  → GET /api/courses/my  →  their courses with enrollment counts
  → Clicks "New Course"
  → POST /api/courses { title, description, level, ragas[], price }
  → DB: INSERT Course { status: PENDING_REVIEW, isPublished: false }
  → Course is NOT visible to students yet
  → Admin approves it (Flow 5 below) → status=APPROVED, isPublished=true
  → Now visible on /marketplace
```

---

## Flow 4: Teacher Schedules a Session

```
Teacher visits /teacher/schedule
  → GET /api/sessions  →  all sessions they created
  → Clicks "New Session"
  → POST /api/sessions {
      title, courseId, scheduledAt, duration,
      type: "ONE_ON_ONE" | "GROUP",
      meetingUrl, isRecurring
    }
  → DB: INSERT Session { status: SCHEDULED }
  → Students enrolled in that course see it on their /student/classes page
  → Teacher marks attendance during/after the session:
      POST /api/sessions/:id/attendance { studentId, status: "PRESENT"|"LATE"|"ABSENT" }
  → DB: UPSERT Attendance (unique on sessionId+studentId)
```

---

## Flow 5: Admin Approves a Course

```
Admin visits /admin (Courses tab)
  → GET /api/admin/courses?status=PENDING_REVIEW
  → Sees list of courses awaiting review
  → Clicks "Approve"
  → PATCH /api/admin/courses/:id/approve
  → DB: UPDATE Course SET status=APPROVED, isPublished=true
  → Course now appears on /marketplace
  → Clicks "Reject"
  → PATCH /api/admin/courses/:id/reject
  → DB: UPDATE Course SET status=REJECTED, isPublished=false
```

---

## Flow 6: Teacher Verifies Through Admin

```
Admin visits /admin (Teachers tab)
  → GET /api/admin/teachers?verified=false
  → Sees list of unverified teachers with badge count
  → Clicks "Verify"
  → PATCH /api/admin/teachers/:id/verify
  → DB: UPDATE TeacherProfile SET isVerified=true
  → DB: INSERT Notification { userId: teacher.userId, title: "Account Verified" }
  → Teacher's notification bell shows the verification message
  → Admin can Revoke: PATCH /api/admin/teachers/:id/unverify → isVerified=false
```

---

## Flow 7: Assignment — Create, Submit, Grade

```
TEACHER creates assignment:
  → /teacher/assignments page
  → POST /api/assignments { title, type, raga, dueDate, description, courseId }
  → DB: INSERT Assignment

STUDENT submits:
  → /student/assignments page
  → GET /api/assignments  →  assignments from all enrolled courses
  → POST /api/assignments/:id/submit { notes, recordingUrl }
  → DB: UPSERT AssignmentSubmission { status: SUBMITTED }
  → 409 if already submitted (upsert updates instead)

TEACHER grades:
  → GET /api/assignments/review-queue  →  all ungraded submissions
  → POST /api/assignments/:id/grade { submissionId, score, feedback }
  → DB: UPDATE AssignmentSubmission { score, feedback, status: GRADED, gradedAt: now }
```

---

## Flow 8: Student Practice Recording Upload

```
Student records on /student/practice page
  → Browser MediaRecorder API captures audio → Blob
  → POST /api/recordings/upload (multipart/form-data, field: "audio")
  → Multer middleware:
      - validates MIME type (audio/*)
      - generates filename: {timestamp}-{12-hex-bytes}.webm
      - writes to api/uploads/recordings/
  → DB: INSERT Recording { url: "/uploads/recordings/filename.webm", type, raga, userId }
  → File served at: http://localhost:4000/uploads/recordings/filename.webm
  
Teacher views student recordings:
  → GET /api/recordings/student/:userId
  → Returns array of Recording rows for that student
  
Delete:
  → DELETE /api/recordings/:id
  → DB: DELETE Recording
  → fs.unlinkSync(filepath)  ← removes file from disk too
```

---

## Flow 9: Content Manager — Events & Broadcasts

```
Content Manager visits /content-manager

EVENTS:
  → GET /api/content/events  →  ALL events including drafts
  → POST /api/content/events { title, type, date, time, venue, seats, price, isPublished: false }
  → Creates as draft (invisible to public)
  → PATCH /api/content/events/:id/toggle  →  flips isPublished true/false
  → Published events appear on public /events page

BROADCAST NOTIFICATIONS:
  → POST /api/content/broadcast { title, body, targetRole: "ALL"|"STUDENT"|"TEACHER" }
  → API fetches all users matching targetRole
  → INSERT Notification for each user
  → Users see it in their notification bell (GET /api/notifications)

COMMUNITY MODERATION:
  → GET /api/content/posts  →  all posts including unpublished
  → PATCH /api/content/posts/:id/pin  →  pins post to top
  → DELETE /api/content/posts/:id  →  removes post
```

---

## Flow 10: AI Guru Chat

```
Student visits /student/ai
  → Types message
  → POST /api/ai/chat { message }
  → Controller calls Anthropic SDK (Claude API)
  → System prompt: "You are an expert Carnatic music teacher..."
  → Returns { reply: "..." }
  → Displayed in chat UI
```

---

## Flow 11: Notifications

```
Notifications are created by:
  1. Content Manager → broadcast (bulk INSERT)
  2. Admin verifying a teacher → INSERT Notification for that teacher
  3. (Future) Assignment graded → INSERT for student

User sees notifications:
  → Bell icon in Sidebar → GET /api/notifications (last 50)
  → Click one → PATCH /api/notifications/:id/read
  → Click "mark all read" → PATCH /api/notifications/read-all
  → Badge count = unread notifications
```

---

## Flow 12: Events & Registration

```
PUBLIC:
  → /events page → GET /api/events  →  only isPublished=true events
  → Shows upcoming concerts, workshops, masterclasses

REGISTRATION:
  → Student/Teacher clicks "Register"
  → POST /api/events/:id/register
  → DB: INSERT EventRegistration (unique on eventId+userId)
  → DB: INCREMENT Event.booked
  → 409 if already registered
  → GET /api/events/my-registrations  →  array of eventIds user is registered for
    (used by frontend to show "Registered" badge)
```

---

## Flow 13: Community Forum

```
PUBLIC (no login needed):
  → GET /api/community/posts  →  all posts with author, likes, comment count
  → GET /api/community/stats  →  total posts, active members, top ragas
  → GET /api/community/posts/:id/comments

AUTHENTICATED:
  → POST /api/community/posts { title, body, category, tags[] }
  → POST /api/community/posts/:id/like  →  toggles like (add/remove userId from likedBy[])
  → POST /api/community/posts/:id/bookmark  →  toggle bookmark
  → POST /api/community/posts/:id/comments { body }
```

---

## Flow 14: Teacher Earnings & Reports

```
EARNINGS:
  → Teacher visits /teacher/earnings
  → GET /api/earnings
  → Returns Earning[] records with total, monthly breakdown, per-student

MONTHLY REPORT:
  → Teacher visits /teacher/reports
  → GET /api/reports/monthly?month=6&year=2026
  → Returns per-student: sessions attended, assignments submitted/graded, avg score
  → Used for end-of-month progress reviews
```

---

## Flow 15: Settings

```
Any user visits their settings page:
  → GET /api/settings  →  UserSettings (auto-created with defaults if first visit)
  → PUT /api/settings {
      notifAssignments: true,
      notifSessions: true,
      notifMarketing: false,
      autoAcceptEnroll: false,
      profileVisibility: "students",
      progressVisibility: "teacher"
    }
  → DB: UPSERT UserSettings
```

---

## Flow 16: Admin Platform Stats

```
Admin visits /admin (Overview tab)
  → GET /api/admin/stats
  → Returns:
    {
      stats: { totalStudents, totalTeachers, totalCourses, totalRevenue, activeSessions },
      monthlySignups: [{ month: "Jan 2026", students: 12, teachers: 3 }, ...]
    }
  → Used for the admin dashboard charts and KPI cards
```
