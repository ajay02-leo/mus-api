import { Response } from 'express'
import { prisma } from '../lib/prisma'
import { AuthRequest } from '../middleware/auth'

// XP thresholds per level
const LEVEL_THRESHOLDS = { BEGINNER: 0, INTERMEDIATE: 500, ADVANCED: 2000 }

const BADGES: Record<string, { label: string; condition: (xp: number, streak: number, practiceMin: number) => boolean }> = {
  first_recording:    { label: 'First Note',       condition: (_x, _s, pm) => pm >= 1 },
  practice_30:        { label: '30 Min Streak',     condition: (_x, _s, pm) => pm >= 30 },
  practice_100:       { label: '100 Min Club',      condition: (_x, _s, pm) => pm >= 100 },
  practice_500:       { label: 'Half-Day Musician', condition: (_x, _s, pm) => pm >= 500 },
  streak_7:           { label: '7-Day Streak',      condition: (_x, s) => s >= 7 },
  streak_30:          { label: 'Monthly Devotee',   condition: (_x, s) => s >= 30 },
  xp_100:             { label: 'Centurion',         condition: (x) => x >= 100 },
  xp_500:             { label: 'Rising Star',       condition: (x) => x >= 500 },
  xp_2000:            { label: 'Master',            condition: (x) => x >= 2000 },
}

/**
 * Award XP to a user. Handles level-ups, badge unlocks, and streak update.
 * Safe to fire-and-forget (errors logged but not thrown).
 */
export async function awardXp(userId: string, amount: number, reason: string): Promise<void> {
  try {
    await prisma.xpEvent.create({ data: { userId, amount, reason } })

    const profile = await prisma.studentProfile.findUnique({
      where: { userId },
      select: { xp: true, streak: true, totalPracticeMin: true, badges: true, lastPracticed: true },
    })
    if (!profile) return

    const newXp = profile.xp + amount

    // Streak: if last practice was yesterday (within 25h window), increment; else reset to 1
    const now = new Date()
    const last = profile.lastPracticed
    let newStreak = profile.streak
    if (last) {
      const hoursSince = (now.getTime() - last.getTime()) / 3_600_000
      if (hoursSince <= 25) {
        newStreak = profile.streak + 1
      } else if (hoursSince > 48) {
        newStreak = 1
      }
    }

    // Compute new level
    let newLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' = 'BEGINNER'
    if (newXp >= LEVEL_THRESHOLDS.ADVANCED) newLevel = 'ADVANCED'
    else if (newXp >= LEVEL_THRESHOLDS.INTERMEDIATE) newLevel = 'INTERMEDIATE'

    // Check new badges
    const existingBadges = new Set(profile.badges)
    const newBadges: string[] = []
    for (const [key, badge] of Object.entries(BADGES)) {
      if (!existingBadges.has(key) && badge.condition(newXp, newStreak, profile.totalPracticeMin)) {
        newBadges.push(key)
      }
    }

    await prisma.studentProfile.update({
      where: { userId },
      data: {
        xp:     newXp,
        streak: newStreak,
        level:  newLevel,
        badges: { push: newBadges },
      },
    })

    // Send badge notifications
    for (const key of newBadges) {
      await prisma.notification.create({
        data: {
          userId,
          type:  'BADGE',
          title: `Badge Unlocked: ${BADGES[key].label}`,
          body:  `You earned the "${BADGES[key].label}" badge! Keep practising.`,
        },
      })
    }
  } catch (err) {
    console.error('[gamification] awardXp error:', err)
  }
}

export async function getLeaderboard(_req: AuthRequest, res: Response) {
  const top = await prisma.studentProfile.findMany({
    select: {
      displayName: true,
      xp:          true,
      streak:      true,
      level:       true,
      badges:      true,
      totalPracticeMin: true,
    },
    orderBy: { xp: 'desc' },
    take: 20,
  })

  return res.json({ success: true, leaderboard: top })
}

export async function getMyBadges(req: AuthRequest, res: Response) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: req.user!.userId },
    select: { xp: true, streak: true, level: true, badges: true, totalPracticeMin: true },
  })
  if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' })

  const earned = profile.badges
  const all = Object.entries(BADGES).map(([key, b]) => ({
    key,
    label:   b.label,
    earned:  earned.includes(key),
    earnedAt: earned.includes(key) ? true : null,
  }))

  return res.json({
    success: true,
    xp:      profile.xp,
    level:   profile.level,
    streak:  profile.streak,
    totalPracticeMin: profile.totalPracticeMin,
    badges:  all,
    xpToNextLevel: profile.level === 'BEGINNER'
      ? LEVEL_THRESHOLDS.INTERMEDIATE - profile.xp
      : profile.level === 'INTERMEDIATE'
      ? LEVEL_THRESHOLDS.ADVANCED - profile.xp
      : 0,
  })
}
