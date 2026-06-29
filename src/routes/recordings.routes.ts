import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth'
import { audioUpload } from '../lib/upload'
import * as ctrl from '../controllers/recordings.controller'

const router = Router()
router.use(authenticate)

// Upload a recording (student or teacher)
router.post('/upload', audioUpload.single('audio'), ctrl.uploadRecording)

// My recordings
router.get('/my', ctrl.listMyRecordings)

// Single recording
router.get('/:id', ctrl.getRecording)

// Delete
router.delete('/:id', ctrl.deleteRecording)

// Teacher: view a specific student's recordings
router.get('/student/:userId', requireRole('TEACHER', 'ADMIN'), ctrl.studentRecordings)

// Admin: disk usage stats
router.get('/admin/storage-stats', requireRole('ADMIN'), ctrl.storageStats)

export default router
