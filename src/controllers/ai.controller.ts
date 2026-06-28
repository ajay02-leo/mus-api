import { Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { AuthRequest } from '../middleware/auth'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `You are an AI Guru for SwaraSangam, a Carnatic music learning platform.
You are an expert in Carnatic music theory, ragas, talas, compositions, gamakas, and practice techniques.
Provide accurate, helpful, and encouraging responses. Use appropriate Indian music terminology.
When listing ragas use: S R G M P D N notation (saptasvaras).
Keep responses concise and practical for students at all levels.`

export async function chat(req: AuthRequest, res: Response) {
  const { messages } = req.body as { messages: { role: 'user' | 'assistant'; content: string }[] }
  if (!messages?.length) return res.status(400).json({ success: false, message: 'messages required' })

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: SYSTEM,
    messages,
  })

  const reply = response.content[0].type === 'text' ? response.content[0].text : ''
  return res.json({ success: true, reply })
}
