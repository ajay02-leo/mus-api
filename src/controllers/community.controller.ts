import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { AuthRequest } from '../middleware/auth'

export async function listPosts(req: Request, res: Response) {
  const { category, search } = req.query as Record<string, string>
  const posts = await prisma.post.findMany({
    where: {
      category: (category && category !== 'All') ? category : undefined,
      OR: search ? [
        { title: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
      ] : undefined,
    },
    include: {
      author: {
        select: {
          id: true,
          role: true,
          student: { select: { displayName: true, avatar: true } },
          teacher: { select: { displayName: true, avatar: true } },
        },
      },
      _count: { select: { comments: true } },
    },
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    take: 50,
  })

  const formatted = posts.map(p => ({
    ...p,
    authorName: p.author.teacher?.displayName ?? p.author.student?.displayName ?? 'User',
    authorRole: p.author.role,
    authorAvatar: (p.author.teacher?.displayName ?? p.author.student?.displayName ?? 'U')[0].toUpperCase(),
    likes: p.likedBy.length,
    bookmarks: p.bookmarkedBy.length,
    replies: p._count.comments,
  }))

  return res.json({ success: true, posts: formatted })
}

export async function createPost(req: AuthRequest, res: Response) {
  const { category, title, body, tags } = req.body
  const post = await prisma.post.create({
    data: { authorId: req.user!.userId, category, title, body, tags: tags ?? [] },
  })
  return res.status(201).json({ success: true, post })
}

export async function toggleLike(req: AuthRequest, res: Response) {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } })
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' })

  const userId = req.user!.userId
  const liked = post.likedBy.includes(userId)
  const updated = await prisma.post.update({
    where: { id: req.params.id },
    data: { likedBy: liked ? { set: post.likedBy.filter(id => id !== userId) } : { push: userId } },
  })
  return res.json({ success: true, liked: !liked, likes: updated.likedBy.length })
}

export async function toggleBookmark(req: AuthRequest, res: Response) {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } })
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' })

  const userId = req.user!.userId
  const bookmarked = post.bookmarkedBy.includes(userId)
  const updated = await prisma.post.update({
    where: { id: req.params.id },
    data: { bookmarkedBy: bookmarked ? { set: post.bookmarkedBy.filter(id => id !== userId) } : { push: userId } },
  })
  return res.json({ success: true, bookmarked: !bookmarked, bookmarks: updated.bookmarkedBy.length })
}

export async function listComments(req: Request, res: Response) {
  const comments = await prisma.comment.findMany({
    where: { postId: req.params.id },
    include: {
      author: {
        select: {
          role: true,
          student: { select: { displayName: true } },
          teacher: { select: { displayName: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })
  return res.json({ success: true, comments })
}

export async function addComment(req: AuthRequest, res: Response) {
  const comment = await prisma.comment.create({
    data: { postId: req.params.id, authorId: req.user!.userId, body: req.body.body },
  })
  return res.status(201).json({ success: true, comment })
}

export async function communityStats(_req: Request, res: Response) {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [members, totalPosts, todayPosts] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.post.count({ where: { createdAt: { gte: startOfDay } } }),
  ])

  return res.json({ success: true, stats: { members, totalPosts, todayPosts } })
}
