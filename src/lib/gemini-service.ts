/**
 * Google Gemini API service wrapper
 * Provides a unified interface for Gemini AI model interactions
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { logger } from './logger'

export interface GeminiResponse {
  text: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export class GeminiService {
  private static instance: GeminiService
  private genAI: GoogleGenerativeAI | null = null
  private model: any = null

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService()
    }
    return GeminiService.instance
  }

  private initialize() {
    if (this.genAI) return

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      throw new Error('Gemini API key not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY in your .env.local file.')
    }

    this.genAI = new GoogleGenerativeAI(apiKey)
    // Using gemini-1.5-flash for fast responses, can switch to gemini-1.5-pro for more complex tasks
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  }

  async generateText(prompt: string, options: {
    maxTokens?: number
    temperature?: number
    systemInstruction?: string
  } = {}): Promise<GeminiResponse> {
    const timer = logger.startTimer('GEMINI_REQUEST')

    try {
      this.initialize()

      logger.debug('Starting Gemini request', {
        promptLength: prompt.length,
        temperature: options.temperature,
        maxTokens: options.maxTokens
      })

      // If we have a system instruction, prepend it to the prompt
      const fullPrompt = options.systemInstruction
        ? `${options.systemInstruction}\n\n${prompt}`
        : prompt

      const result = await this.model.generateContent(fullPrompt)
      const response = await result.response
      const text = response.text()

      const duration = logger.endTimer(timer)

      logger.info('Gemini request completed', {
        duration,
        promptLength: prompt.length,
        responseLength: text.length,
        model: 'gemini-1.5-flash'
      })

      return {
        text,
        usage: {
          promptTokens: 0, // Gemini doesn't provide detailed token counts in the same way
          completionTokens: 0,
          totalTokens: 0
        }
      }

    } catch (error) {
      const duration = logger.endTimer(timer)

      logger.error('Gemini request failed', {
        duration,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack?.substring(0, 500)
        } : error
      })

      // Handle common Gemini errors
      if (error instanceof Error) {
        if (error.message.includes('API_KEY_INVALID')) {
          throw new Error('Invalid Gemini API key. Please check your NEXT_PUBLIC_GEMINI_API_KEY.')
        } else if (error.message.includes('QUOTA_EXCEEDED')) {
          throw new Error('Gemini API quota exceeded. Please check your usage limits.')
        } else if (error.message.includes('RATE_LIMIT_EXCEEDED')) {
          throw new Error('Gemini API rate limit exceeded. Please wait and try again.')
        }
      }

      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async generateChatCompletion(messages: Array<{role: string, content: string}>, options: {
    maxTokens?: number
    temperature?: number
  } = {}): Promise<GeminiResponse> {
    // Convert chat messages to a single prompt for Gemini
    const prompt = messages.map(msg => {
      const role = msg.role === 'assistant' ? 'AI' : msg.role.toUpperCase()
      return `${role}: ${msg.content}`
    }).join('\n\n')

    return this.generateText(prompt, options)
  }

  isConfigured(): boolean {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    return !!(apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE')
  }
}

export const geminiService = GeminiService.getInstance()