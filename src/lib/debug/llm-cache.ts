/**
 * LLM Response Cache System - Cache LLM responses for fast test execution
 */

import { v4 as uuidv4 } from 'uuid'
import type { CacheEntry, LLMCallData } from './types'
import { workflowDebugger } from './workflow-debugger'

interface LLMCacheConfig {
  enabled: boolean
  directory: string
  versioning: boolean
  autoGenerate: boolean
  maxCacheSize: number
  ttl: number // Time to live in milliseconds
  hashFunction: 'simple' | 'detailed'
}

interface CacheKey {
  workflowName: string
  stepName: string
  promptHash: string
  model?: string
  temperature?: number
}

class LLMCache {
  private static instance: LLMCache
  private cache: Map<string, CacheEntry> = new Map()
  private config: LLMCacheConfig
  private stats = {
    hits: 0,
    misses: 0,
    saves: 0,
    evictions: 0
  }
  private isEnabled: boolean = false

  constructor(config?: Partial<LLMCacheConfig>) {
    this.config = {
      enabled: process.env.NEXT_PUBLIC_LLM_CACHE_ENABLED === 'true',
      directory: process.env.NEXT_PUBLIC_LLM_CACHE_DIR || '.cache/llm-responses',
      versioning: true,
      autoGenerate: true,
      maxCacheSize: parseInt(process.env.NEXT_PUBLIC_LLM_CACHE_MAX_SIZE || '1000'),
      ttl: parseInt(process.env.NEXT_PUBLIC_LLM_CACHE_TTL || '86400000'), // 24 hours
      hashFunction: 'detailed',
      ...config
    }

    this.isEnabled = this.config.enabled

    if (this.isEnabled) {
      console.log('🧠 LLM Cache initialized', {
        directory: this.config.directory,
        maxSize: this.config.maxCacheSize,
        ttl: `${this.config.ttl / 1000}s`
      })

      // Load existing cache from filesystem
      this.loadCacheFromFiles()
    }
  }

  static getInstance(config?: Partial<LLMCacheConfig>): LLMCache {
    if (!LLMCache.instance) {
      LLMCache.instance = new LLMCache(config)
    }
    return LLMCache.instance
  }

  // Main cache operations
  async get(workflowName: string, stepName: string, prompt: string, model?: string, temperature?: number): Promise<any | null> {
    if (!this.isEnabled) return null

    const key = this.generateCacheKey({ workflowName, stepName, promptHash: this.hashPrompt(prompt), model, temperature })
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      console.log(`🧠❌ Cache miss: ${workflowName}/${stepName}`)
      return null
    }

    // Check if entry is expired
    if (this.isExpired(entry)) {
      this.cache.delete(key)
      this.stats.misses++
      console.log(`🧠⏰ Cache expired: ${workflowName}/${stepName}`)
      return null
    }

    // Update usage stats
    entry.hits++
    entry.last_used = new Date().toISOString()
    this.stats.hits++

    console.log(`🧠✅ Cache hit: ${workflowName}/${stepName} (${entry.hits} total hits)`)
    return entry.response
  }

  async set(
    workflowName: string,
    stepName: string,
    prompt: string,
    response: any,
    model?: string,
    temperature?: number,
    metadata?: any
  ): Promise<void> {
    if (!this.isEnabled) return

    const promptHash = this.hashPrompt(prompt)
    const key = this.generateCacheKey({ workflowName, stepName, promptHash, model, temperature })

    const entry: CacheEntry = {
      key,
      workflow_name: workflowName,
      step_name: stepName,
      prompt_hash: promptHash,
      response,
      created_at: new Date().toISOString(),
      hits: 0,
      last_used: new Date().toISOString(),
      metadata: {
        model,
        ...metadata
      }
    }

    this.cache.set(key, entry)
    this.stats.saves++

    // Enforce cache size limit
    this.evictIfNeeded()

    // Save to filesystem for persistence
    await this.saveCacheEntry(entry)

    console.log(`🧠💾 Cached response: ${workflowName}/${stepName}`)
  }

  // Wrapper for LLM calls with automatic caching
  async wrapLLMCall<T>(
    workflowName: string,
    stepName: string,
    prompt: string,
    llmFunction: () => Promise<T>,
    options?: {
      model?: string
      temperature?: number
      forceRefresh?: boolean
      metadata?: any
    }
  ): Promise<T> {
    const { model, temperature, forceRefresh = false, metadata } = options || {}

    // Try cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedResponse = await this.get(workflowName, stepName, prompt, model, temperature)
      if (cachedResponse !== null) {
        // Track this as a cached LLM call in the workflow debugger
        if (workflowDebugger.isDebugEnabled()) {
          const currentExecution = workflowDebugger.getCurrentExecution()
          if (currentExecution && currentExecution.steps.length > 0) {
            const stepId = currentExecution.steps[currentExecution.steps.length - 1].id
            const callId = workflowDebugger.trackLLMCall(stepId, model || 'cached', model || 'cached', prompt)
            workflowDebugger.completeLLMCall(callId, JSON.stringify(cachedResponse), undefined, 0, true)
          }
        }
        return cachedResponse
      }
    }

    // Make actual LLM call
    const startTime = Date.now()
    try {
      const response = await llmFunction()
      const duration = Date.now() - startTime

      // Cache the response
      await this.set(workflowName, stepName, prompt, response, model, temperature, {
        ...metadata,
        original_latency: duration
      })

      return response
    } catch (error) {
      console.error(`🧠❌ LLM call failed: ${workflowName}/${stepName}`, error)
      throw error
    }
  }

  // Cache management
  clear(): void {
    this.cache.clear()
    this.resetStats()
    console.log('🧠🧹 Cache cleared')
  }

  clearWorkflow(workflowName: string): void {
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (entry.workflow_name === workflowName) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
    console.log(`🧠🧹 Cleared cache for workflow: ${workflowName} (${keysToDelete.length} entries)`)
  }

  clearStep(workflowName: string, stepName: string): void {
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (entry.workflow_name === workflowName && entry.step_name === stepName) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
    console.log(`🧠🧹 Cleared cache for step: ${workflowName}/${stepName} (${keysToDelete.length} entries)`)
  }

  // Override specific responses for testing
  setOverride(workflowName: string, stepName: string, prompt: string, response: any, model?: string): void {
    const promptHash = this.hashPrompt(prompt)
    const key = this.generateCacheKey({ workflowName, stepName, promptHash, model })

    const entry: CacheEntry = {
      key,
      workflow_name: workflowName,
      step_name: stepName,
      prompt_hash: promptHash,
      response,
      created_at: new Date().toISOString(),
      hits: 0,
      last_used: new Date().toISOString(),
      metadata: {
        model,
        override: true
      }
    }

    this.cache.set(key, entry)
    console.log(`🧠🎯 Set override for: ${workflowName}/${stepName}`)
  }

  // Statistics and analytics
  getStats() {
    const totalCalls = this.stats.hits + this.stats.misses
    return {
      ...this.stats,
      hitRate: totalCalls > 0 ? (this.stats.hits / totalCalls) * 100 : 0,
      cacheSize: this.cache.size,
      maxSize: this.config.maxCacheSize
    }
  }

  getCacheEntries(): CacheEntry[] {
    return Array.from(this.cache.values())
  }

  getCacheEntriesForWorkflow(workflowName: string): CacheEntry[] {
    return Array.from(this.cache.values()).filter(entry => entry.workflow_name === workflowName)
  }

  // File system operations
  private async loadCacheFromFiles(): Promise<void> {
    if (typeof window !== 'undefined') return // Only run on server side

    try {
      const fs = await import('fs')
      const path = await import('path')

      const cacheDir = this.config.directory
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true })
        return
      }

      const files = fs.readdirSync(cacheDir, { recursive: true }) as string[]
      let loadedCount = 0

      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(cacheDir, file)
            const content = fs.readFileSync(filePath, 'utf-8')
            const entry = JSON.parse(content) as CacheEntry

            // Check if entry is not expired
            if (!this.isExpired(entry)) {
              this.cache.set(entry.key, entry)
              loadedCount++
            }
          } catch (error) {
            console.warn(`Could not load cache file ${file}:`, error)
          }
        }
      }

      console.log(`🧠📁 Loaded ${loadedCount} cache entries from filesystem`)
    } catch (error) {
      console.warn('Could not load cache from filesystem:', error)
    }
  }

  private async saveCacheEntry(entry: CacheEntry): Promise<void> {
    if (typeof window !== 'undefined') return // Only run on server side

    try {
      const fs = await import('fs')
      const path = await import('path')

      // Create directory structure: workflow/step/
      const workflowDir = path.join(this.config.directory, entry.workflow_name)
      const stepDir = path.join(workflowDir, entry.step_name)

      if (!fs.existsSync(stepDir)) {
        fs.mkdirSync(stepDir, { recursive: true })
      }

      const filename = `${entry.prompt_hash}.json`
      const filePath = path.join(stepDir, filename)

      fs.writeFileSync(filePath, JSON.stringify(entry, null, 2))
    } catch (error) {
      console.warn('Could not save cache entry to filesystem:', error)
    }
  }

  // Utility methods
  private generateCacheKey(components: CacheKey): string {
    const { workflowName, stepName, promptHash, model = '', temperature = 0 } = components
    return `${workflowName}:${stepName}:${promptHash}:${model}:${temperature}`
  }

  private hashPrompt(prompt: string): string {
    if (this.config.hashFunction === 'simple') {
      // Simple hash based on content length and first/last chars
      return `${prompt.length}_${prompt.slice(0, 10)}_${prompt.slice(-10)}`
    } else {
      // More detailed hash using a basic hash function
      let hash = 0
      for (let i = 0; i < prompt.length; i++) {
        const char = prompt.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(36)
    }
  }

  private isExpired(entry: CacheEntry): boolean {
    const now = Date.now()
    const entryTime = new Date(entry.created_at).getTime()
    return (now - entryTime) > this.config.ttl
  }

  private evictIfNeeded(): void {
    if (this.cache.size <= this.config.maxCacheSize) return

    // Evict least recently used entries
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => new Date(a.last_used).getTime() - new Date(b.last_used).getTime())

    const entriesToEvict = entries.slice(0, this.cache.size - this.config.maxCacheSize)

    for (const [key] of entriesToEvict) {
      this.cache.delete(key)
      this.stats.evictions++
    }

    console.log(`🧠🗑️ Evicted ${entriesToEvict.length} cache entries`)
  }

  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      saves: 0,
      evictions: 0
    }
  }

  // Configuration
  updateConfig(newConfig: Partial<LLMCacheConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.isEnabled = this.config.enabled
  }

  getConfig(): LLMCacheConfig {
    return { ...this.config }
  }

  isEnabled(): boolean {
    return this.isEnabled
  }

  // Import/Export for test scenarios
  exportCache(): Record<string, CacheEntry> {
    const exported: Record<string, CacheEntry> = {}
    for (const [key, entry] of this.cache.entries()) {
      exported[key] = entry
    }
    return exported
  }

  importCache(cacheData: Record<string, CacheEntry>): void {
    this.cache.clear()
    for (const [key, entry] of Object.entries(cacheData)) {
      this.cache.set(key, entry)
    }
    console.log(`🧠📥 Imported ${Object.keys(cacheData).length} cache entries`)
  }

  // Pre-populate cache for scenarios
  async prePopulate(workflowName: string, responses: Record<string, any>): Promise<void> {
    for (const [stepName, response] of Object.entries(responses)) {
      // Use a generic prompt hash for pre-populated responses
      const promptHash = this.hashPrompt(`scenario_${stepName}`)
      const key = this.generateCacheKey({ workflowName, stepName, promptHash })

      const entry: CacheEntry = {
        key,
        workflow_name: workflowName,
        step_name: stepName,
        prompt_hash: promptHash,
        response,
        created_at: new Date().toISOString(),
        hits: 0,
        last_used: new Date().toISOString(),
        metadata: {
          prePopulated: true
        }
      }

      this.cache.set(key, entry)
    }

    console.log(`🧠🎬 Pre-populated cache for workflow: ${workflowName} (${Object.keys(responses).length} responses)`)
  }
}

// Export singleton instance
export const llmCache = LLMCache.getInstance()

// Export convenience functions
export function cacheLLMCall<T>(
  workflowName: string,
  stepName: string,
  prompt: string,
  llmFunction: () => Promise<T>,
  options?: { model?: string; temperature?: number; forceRefresh?: boolean }
): Promise<T> {
  return llmCache.wrapLLMCall(workflowName, stepName, prompt, llmFunction, options)
}

export function setCachedResponse(workflowName: string, stepName: string, prompt: string, response: any): void {
  llmCache.setOverride(workflowName, stepName, prompt, response)
}

export function clearLLMCache(): void {
  llmCache.clear()
}

export { LLMCache }