# SwaraSangam API — Test Suite

**130 test cases across 9 suites. All passing.**

Run: `npm test` (from `music-api/api/`)

---

## Test Results Summary

| Suite | File | Tests | Status |
|-------|------|-------|--------|
| Health & Server | health.test.ts | 3 | ✅ |
| Auth | auth.test.ts | 14 | ✅ |
| Courses | courses.test.ts | 13 | ✅ |
| Students | students.test.ts | 12 | ✅ |
| Sessions | sessions.test.ts | 11 | ✅ |
| Assignments | assignments.test.ts | 12 | ✅ |
| Admin | admin.test.ts | 17 | ✅ |
| Notifications / Events / Content | notifications_events_content.test.ts | 22 | ✅ |
| Resources / Earnings / Community / Settings / Reports / Teachers / Recordings | misc.test.ts | 26 | ✅ |
| **TOTAL** | | **130** | **✅ 130/130** |

---

## Test Case Inventory

### Health (TC-001 – TC-003)
| ID | Description | Expected |
|----|-------------|----------|
| TC-001 | GET /health returns 200 + status ok | 200 |
| TC-002 | Unknown route returns 404 | 404 |
| TC-003 | Swagger docs endpoint accessible | 200 |

### Auth (TC-004 – TC-017)
| ID | Description | Expected |
|----|-------------|----------|
| TC-004 | Login valid teacher credentials | 200, role=TEACHER |
| TC-005 | Login valid student credentials | 200, role=STUDENT |
| TC-006 | Login valid admin credentials | 200, role=ADMIN |
| TC-007 | Login wrong password | 401 |
| TC-008 | Login unknown email | 404 |
| TC-009 | Login missing password | 4xx |
| TC-010 | GET /auth/me unauthenticated | 401 |
| TC-011 | GET /auth/me with valid cookie | 200 + user |
| TC-012 | POST /auth/logout clears session | 200, then 401 on /me |
| TC-013 | Register duplicate email | 409 |
| TC-014 | Register new email creates account | 201 |
| TC-015 | Bearer token auth works | 200 |
| TC-016 | Invalid Bearer token | 401 |
| TC-017 | Change password wrong current | 401 |

### Courses (TC-018 – TC-030)
| ID | Description | Expected |
|----|-------------|----------|
| TC-018 | Browse courses public | 200, array |
| TC-019 | Browseable courses all APPROVED | all status=APPROVED |
| TC-020 | GET /courses/my unauthenticated | 401 |
| TC-021 | GET /courses/my as STUDENT | 403 |
| TC-022 | GET /courses/my as TEACHER | 200 |
| TC-023 | Create course → PENDING_REVIEW | 201, status=PENDING_REVIEW |
| TC-024 | Create course as STUDENT | 403 |
| TC-025 | GET /courses/:id single course | 200 |
| TC-026 | GET /courses/nonexistent | 404 |
| TC-027 | GET /courses/enrolled unauthenticated | 401 |
| TC-028 | GET /courses/enrolled as STUDENT | 200 |
| TC-029 | Enroll in PENDING course | 400 |
| TC-030 | Enroll in approved free course | 201 or 409 |

### Students (TC-031 – TC-042)
| ID | Description | Expected |
|----|-------------|----------|
| TC-031 | List students unauthenticated | 401 |
| TC-032 | List students as STUDENT | 403 |
| TC-033 | List students as TEACHER | 200 |
| TC-034 | Student list has name, email, levelLabel | fields present |
| TC-035 | List students as ADMIN | 200 |
| TC-036 | GET /students/me/stats unauthenticated | 401 |
| TC-037 | GET /students/me/stats as STUDENT | 200 |
| TC-038 | GET /students/me/stats as TEACHER | 403 |
| TC-039 | PUT /students/me/profile updates bio | 200 |
| TC-040 | GET /students/:id as TEACHER | 200 |
| TC-041 | GET /students/nonexistent | 404 |
| TC-042 | Pagination with page/limit params | ≤ limit results |

### Sessions (TC-043 – TC-053)
| ID | Description | Expected |
|----|-------------|----------|
| TC-043 | List sessions unauthenticated | 401 |
| TC-044 | List sessions as TEACHER | 200 |
| TC-045 | List sessions as STUDENT | 200 |
| TC-046 | Create session as TEACHER | 201 |
| TC-047 | Create session as STUDENT | 403 |
| TC-048 | Create session with meetingUrl | meetingUrl stored |
| TC-049 | Update session as TEACHER | 200, title updated |
| TC-050 | Delete session as TEACHER | 200 |
| TC-051 | Update session as STUDENT | 403 |
| TC-052 | Post attendance for session | 200/201/409 |
| TC-053 | Session missing scheduledAt | 4xx |

### Assignments (TC-071 – TC-082)
| ID | Description | Expected |
|----|-------------|----------|
| TC-071 | List unauthenticated | 401 |
| TC-072 | List as TEACHER | 200 |
| TC-073 | List as STUDENT | 200 |
| TC-074 | Create as TEACHER | 201 |
| TC-075 | Create as STUDENT | 403 |
| TC-076 | Get by ID | 200 |
| TC-077 | Review queue as TEACHER | 200 |
| TC-078 | Review queue as STUDENT | 403 |
| TC-079 | Delete as TEACHER | 200 |
| TC-080 | Submit as STUDENT | ≥200 |
| TC-081 | Grade submission as TEACHER | 200 |
| TC-082 | Raga field stored correctly | raga=Yaman |

### Admin (TC-054 – TC-070)
| ID | Description | Expected |
|----|-------------|----------|
| TC-054 | List users unauthenticated | 401 |
| TC-055 | List users as STUDENT | 403 |
| TC-056 | List users as TEACHER | 403 |
| TC-057 | List users as ADMIN | 200 |
| TC-058 | Filter users by role=TEACHER | all TEACHER |
| TC-059 | Platform stats | 200 + stats object |
| TC-060 | List all courses | 200 |
| TC-061 | Filter courses by PENDING_REVIEW | all PENDING_REVIEW |
| TC-062 | Approve course | status=APPROVED, isPublished=true |
| TC-063 | Reject course | status=REJECTED, isPublished=false |
| TC-064 | Payments list | 200, total is number |
| TC-065 | Teachers list | 200, array |
| TC-066 | Verify teacher | isVerified=true |
| TC-067 | Unverify teacher | isVerified=false |
| TC-068 | Suspend user as STUDENT | 403 |
| TC-069 | CONTENT_MANAGER cannot access admin users | 403 |
| TC-070 | Monthly signups in stats | array present |

### Notifications / Events / Content (TC-083 – TC-104)
| ID | Description | Expected |
|----|-------------|----------|
| TC-083 | List notifications unauthenticated | 401 |
| TC-084 | List notifications as STUDENT | 200 |
| TC-085 | Mark all read | 200 |
| TC-086 | Mark single notification read | read=true |
| TC-087 | Public events list | 200 |
| TC-088 | Public events all published | isPublished=true |
| TC-089 | My registrations unauthenticated | 401 |
| TC-090 | My registrations as STUDENT | 200, eventIds array |
| TC-091 | Register for event | 201 or 409 |
| TC-092 | Content stats as CONTENT_MANAGER | 200 |
| TC-093 | Content stats as STUDENT | 403 |
| TC-094 | Content events (all) as CONTENT_MANAGER | 200 |
| TC-095 | Create event (draft) | 201, isPublished=false |
| TC-096 | Toggle event publish | isPublished=true |
| TC-097 | Update event fields | title updated |
| TC-098 | Delete event | 200 |
| TC-099 | Broadcast to ALL | 200, sent > 0 |
| TC-100 | Broadcast to STUDENT only | 200, sent ≥ 1 |
| TC-101 | Get community posts | 200 |
| TC-102 | Pin post as STUDENT | 403 |
| TC-103 | Pin post as CONTENT_MANAGER | 200 |
| TC-104 | Broadcast missing title | 400 |

### Resources / Earnings / Community / Settings / Reports / Teachers / Recordings (TC-105 – TC-130)
| ID | Description | Expected |
|----|-------------|----------|
| TC-105 | List resources unauthenticated | 401 |
| TC-106 | List resources as TEACHER | 200 |
| TC-107 | Create resource as TEACHER | 201 |
| TC-108 | Create resource as STUDENT | 403 |
| TC-109 | Delete resource | 200 |
| TC-110 | Earnings unauthenticated | 401 |
| TC-111 | Earnings as TEACHER | 200 |
| TC-112 | Earnings as STUDENT | 403 |
| TC-113 | Community posts public | 200 |
| TC-114 | Create post unauthenticated | 401 |
| TC-115 | Create post as STUDENT | 201 |
| TC-116 | Community stats | 200 |
| TC-117 | Settings unauthenticated | 401 |
| TC-118 | Settings as STUDENT | 200 |
| TC-119 | Update notification preferences | 200 |
| TC-120 | Monthly report unauthenticated | 401 |
| TC-121 | Monthly report as TEACHER | 200, array |
| TC-122 | Monthly report as STUDENT | 403 |
| TC-123 | Monthly report with month/year params | filtered correctly |
| TC-124 | Teacher profile GET | 200 |
| TC-125 | Teacher profile PUT bio | 200 |
| TC-126 | Teacher profile as STUDENT | 403 |
| TC-127 | Recordings /my unauthenticated | 401 |
| TC-128 | Recordings /my as STUDENT | 200, array |
| TC-129 | Recordings /my as TEACHER | 200, array |
| TC-130 | Upload without file | ≥400 |

---

## Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Teacher | demo-teacher@swara.test | Demo1234! |
| Student | demo-student@swara.test | Demo1234! |
| Admin | admin@swara.test | Admin1234! |
| Content Manager | content@swara.test | Content1234! |
