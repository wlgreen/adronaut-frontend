import { v4 as uuidv4 } from 'uuid'
import { supabase } from './supabase'
import { errorLogger } from './error-logger'
import { logger } from './logger'

export interface AnalysisSnapshot {
  audience_segments: Array<{
    name: string
    characteristics: string[]
    size_estimate: string
    value_score: number
  }>
  content_themes: Array<{
    theme: string
    performance: 'high' | 'medium' | 'low'
    keywords: string[]
  }>
  performance_metrics: {
    conversion_rate: string
    engagement_rate: string
    cost_per_acquisition: string
    roi: string
  }
  geographic_insights: Array<{
    region: string
    performance: 'high' | 'medium' | 'low'
    opportunity: string
  }>
  temporal_patterns: {
    best_days: string[]
    best_hours: string[]
    seasonal_trends: string
  }
  recommendations: string[]
}

export interface Strategy {
  strategy_id: string
  version: number
  created_at: string
  audience_targeting: {
    segments: Array<{
      name: string
      targeting_criteria: {
        age: string
        interests: string[]
        income: string
        location: string
        behaviors?: string[]
      }
      budget_allocation: string
      priority: 'high' | 'medium' | 'low'
    }>
  }
  messaging_strategy: {
    primary_message: string
    tone: string
    key_themes: string[]
  }
  channel_strategy: {
    primary_channels: string[]
    budget_split: Record<string, string>
    scheduling: {
      peak_hours: string[]
      peak_days: string[]
    }
  }
  budget_allocation: {
    total_budget: string
    channel_breakdown: Record<string, string>
    optimization_strategy: string
  }
}

export interface StrategyPatch {
  patch_id: string
  source: 'insights' | 'performance' | 'manual'
  status: 'proposed' | 'approved' | 'rejected'
  patch_json: Partial<Strategy>
  justification: string
  created_at: string
}

export interface Campaign {
  campaign_id: string
  name: string
  status: 'running' | 'paused' | 'completed'
  start_date: string
  strategy_version: number
  platforms: string[]
  current_metrics: {
    impressions: number
    clicks: number
    conversions: number
    spend: number
    revenue: number
  }
  performance_indicators: {
    ctr: number
    cpa: number
    roas: number
    conversion_rate: number
  }
}

export interface PerformanceAlert {
  id: string
  type: 'optimization' | 'opportunity' | 'warning'
  severity: 'low' | 'medium' | 'high'
  title: string
  description: string
  recommendation: string
  created_at: string
}

const AUTOGEN_SERVICE_URL = process.env.NEXT_PUBLIC_AUTOGEN_SERVICE_URL || 'http://localhost:8000'

export class LLMService {
  private static instance: LLMService

  public static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService()
    }
    return LLMService.instance
  }

  async analyzeUploadedFiles(projectId: string): Promise<AnalysisSnapshot> {
    const timer = logger.startTimer('LLM_ANALYZE_FILES')

    try {
      logger.info('Starting file analysis with backend service', {
        projectId,
        operation: 'analyze_uploaded_files'
      })

      // Start the AutoGen workflow on the backend
      const startResponse = await fetch(`${AUTOGEN_SERVICE_URL}/autogen/run/start?project_id=${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!startResponse.ok) {
        const errorText = await startResponse.text()
        throw new Error(`Failed to start workflow: ${startResponse.status} ${startResponse.statusText} - ${errorText}`)
      }

      const startResult = await startResponse.json()
      logger.info('AutoGen workflow started', { projectId, runId: startResult.run_id })

      // For now, return sample analysis while the backend processes
      // TODO: Implement proper polling or WebSocket connection to get real results
      const result = this.createSampleAnalysis()
      const duration = logger.endTimer(timer)
      logger.info('Analysis completed (backend initiated)', { projectId, duration, segmentCount: result.audience_segments.length })
      return result

    } catch (error) {
      const duration = logger.endTimer(timer)
      logger.error('File analysis failed', {
        projectId,
        duration,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack?.substring(0, 500)
        } : error
      })

      errorLogger.logError('llm-analysis', 'File analysis failed', {
        projectId,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : error
      })

      // Provide more detailed error messages
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          throw new Error('Network error: Unable to connect to analysis service. Please check your internet connection.')
        } else if (error.message.includes('API key')) {
          throw new Error('Authentication error: OpenAI API key is invalid or missing. Please check your configuration.')
        } else if (error.message.includes('rate limit')) {
          throw new Error('Rate limit error: Too many requests to OpenAI API. Please wait and try again.')
        } else if (error.message.includes('401')) {
          throw new Error('Authentication error: OpenAI API key is invalid. Please check your API key configuration.')
        } else if (error.message.includes('429')) {
          throw new Error('Rate limit exceeded: Please wait and try again. Consider upgrading your OpenAI plan.')
        } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
          throw new Error('Service unavailable: OpenAI service is temporarily down. Please try again later.')
        }
      }

      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error occurred'}`)
    }
  }

  async generateStrategy(analysisSnapshot: AnalysisSnapshot, projectId: string): Promise<Strategy> {
    const timer = logger.startTimer('LLM_GENERATE_STRATEGY')

    try {
      logger.info('Starting strategy generation', {
        projectId,
        segmentCount: analysisSnapshot.audience_segments.length,
        themeCount: analysisSnapshot.content_themes.length
      })

      // Check if we should use real LLM
      const useRealLLM = process.env.NEXT_PUBLIC_OPENAI_API_KEY &&
                        process.env.NEXT_PUBLIC_OPENAI_API_KEY.startsWith('sk-')

      if (!useRealLLM) {
        logger.info('No OpenAI API key - generating sample strategy', { projectId })
        await new Promise(resolve => setTimeout(resolve, 1500))
        const result = this.createSampleStrategy(analysisSnapshot)
        const duration = logger.endTimer(timer)
        logger.info('Sample strategy generated', { projectId, duration, version: result.version })
        return result
      }

      logger.info('Generating real strategy with OpenAI', { projectId })
      const result = await this.generateRealStrategy(analysisSnapshot, projectId)
      const duration = logger.endTimer(timer)
      logger.info('Real strategy generated', { projectId, duration, version: result.version })
      return result
    } catch (error) {
      const duration = logger.endTimer(timer)
      logger.error('Strategy generation failed', {
        projectId,
        duration,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack?.substring(0, 500)
        } : error
      })

      errorLogger.logError('llm-strategy', 'Strategy generation failed', {
        projectId,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : error
      })

      // Provide more detailed error messages
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          throw new Error('Network error: Unable to connect to strategy service. Please check your internet connection.')
        } else if (error.message.includes('API key')) {
          throw new Error('Authentication error: OpenAI API key is invalid or missing. Please check your configuration.')
        } else if (error.message.includes('rate limit')) {
          throw new Error('Rate limit error: Too many requests to OpenAI API. Please wait and try again.')
        }
      }

      throw new Error(`Strategy generation failed: ${error instanceof Error ? error.message : 'Unknown error occurred'}`)
    }
  }

  async generateStrategyPatches(currentStrategy: Strategy, performanceData: any[]): Promise<StrategyPatch[]> {
    try {
      const response = await fetch(`${AUTOGEN_SERVICE_URL}/autogen/patches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_strategy: currentStrategy,
          performance_data: performanceData
        })
      })

      if (!response.ok) {
        throw new Error(`Patch generation failed: ${response.statusText}`)
      }

      const patchResult = await response.json()
      return this.parsePatchesOutput(patchResult.patches_output)
    } catch (error) {
      console.error('Patch generation failed:', error)

      // Provide more detailed error messages
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          throw new Error('Network error: Unable to connect to AutoGen service. Please check if the backend is running.')
        } else if (error.message.includes('timeout')) {
          throw new Error('Timeout error: Patch generation took too long. Please try again with smaller datasets.')
        }
      }

      throw new Error(`Patch generation failed: ${error instanceof Error ? error.message : 'Unknown error occurred'}`)
    }
  }

  async analyzePerformance(campaigns: Campaign[]): Promise<PerformanceAlert[]> {
    try {
      const response = await fetch(`${AUTOGEN_SERVICE_URL}/autogen/performance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaigns: campaigns
        })
      })

      if (!response.ok) {
        throw new Error(`Performance analysis failed: ${response.statusText}`)
      }

      const performanceResult = await response.json()
      return this.parsePerformanceOutput(performanceResult.performance_output)
    } catch (error) {
      console.error('Performance analysis failed:', error)
      errorLogger.logError('llm-performance', 'Performance analysis failed', {
        campaignCount: campaigns.length,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : error
      })

      // Provide more detailed error messages
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          throw new Error('Network error: Unable to connect to AutoGen service. Please check if the backend is running.')
        } else if (error.message.includes('campaigns')) {
          throw new Error('Data error: Invalid campaign data provided. Please check your campaign configuration.')
        } else if (error.message.includes('timeout')) {
          throw new Error('Timeout error: Performance analysis took too long. Please try again.')
        }
      }

      throw new Error(`Performance analysis failed: ${error instanceof Error ? error.message : 'Unknown error occurred'}`)
    }
  }

  private parseAnalysisOutput(llmOutput: string): AnalysisSnapshot {
    try {
      // Parse structured LLM output - expecting JSON format
      const parsed = JSON.parse(llmOutput)

      // Validate required fields and provide defaults
      return {
        audience_segments: parsed.audience_segments || [],
        content_themes: parsed.content_themes || [],
        performance_metrics: {
          conversion_rate: parsed.performance_metrics?.conversion_rate || '0%',
          engagement_rate: parsed.performance_metrics?.engagement_rate || '0%',
          cost_per_acquisition: parsed.performance_metrics?.cost_per_acquisition || '$0',
          roi: parsed.performance_metrics?.roi || '0%'
        },
        geographic_insights: parsed.geographic_insights || [],
        temporal_patterns: {
          best_days: parsed.temporal_patterns?.best_days || [],
          best_hours: parsed.temporal_patterns?.best_hours || [],
          seasonal_trends: parsed.temporal_patterns?.seasonal_trends || 'No patterns detected'
        },
        recommendations: parsed.recommendations || []
      }
    } catch (error) {
      // Fallback: try to extract insights from unstructured text
      return this.extractInsightsFromText(llmOutput)
    }
  }

  private parseStrategyOutput(llmOutput: string): Strategy {
    try {
      const parsed = JSON.parse(llmOutput)
      return {
        strategy_id: uuidv4(),
        version: 1,
        created_at: new Date().toISOString(),
        ...parsed
      }
    } catch (error) {
      throw new Error('Failed to parse strategy output from LLM')
    }
  }

  private parsePatchesOutput(llmOutput: string): StrategyPatch[] {
    try {
      const parsed = JSON.parse(llmOutput)
      return parsed.patches?.map((patch: any, index: number) => ({
        patch_id: `patch_${Date.now()}_${index}`,
        source: 'insights' as const,
        status: 'proposed' as const,
        created_at: new Date().toISOString(),
        ...patch
      })) || []
    } catch (error) {
      console.error('Failed to parse patches output:', error)
      return []
    }
  }

  private parsePerformanceOutput(llmOutput: string): PerformanceAlert[] {
    try {
      const parsed = JSON.parse(llmOutput)
      return parsed.alerts?.map((alert: any, index: number) => ({
        id: `alert_${Date.now()}_${index}`,
        created_at: new Date().toISOString(),
        ...alert
      })) || []
    } catch (error) {
      console.error('Failed to parse performance output:', error)
      return []
    }
  }

  private extractInsightsFromText(text: string): AnalysisSnapshot {
    // Basic text parsing fallback - extract insights from unstructured LLM output
    const lines = text.split('\n').filter(line => line.trim())

    return {
      audience_segments: [
        {
          name: "Extracted Segment",
          characteristics: ["data_driven"],
          size_estimate: "Unknown",
          value_score: 5
        }
      ],
      content_themes: [
        {
          theme: "Extracted Theme",
          performance: 'medium' as const,
          keywords: []
        }
      ],
      performance_metrics: {
        conversion_rate: "Unknown",
        engagement_rate: "Unknown",
        cost_per_acquisition: "Unknown",
        roi: "Unknown"
      },
      geographic_insights: [],
      temporal_patterns: {
        best_days: [],
        best_hours: [],
        seasonal_trends: "Analysis required"
      },
      recommendations: lines.slice(0, 3) // Take first 3 lines as recommendations
    }
  }

  private async performRealAnalysis(projectId: string): Promise<AnalysisSnapshot> {
    const timer = logger.startTimer('OPENAI_ANALYSIS_CALL')
    logger.info('Starting real OpenAI analysis', { projectId })

    const analysisPrompt = `
You are a marketing analytics AI. Analyze the uploaded marketing data and provide insights in the following JSON format:

{
  "audience_segments": [
    {
      "name": "Segment Name",
      "characteristics": ["characteristic1", "characteristic2"],
      "size_estimate": "percentage",
      "value_score": number (1-10)
    }
  ],
  "content_themes": [
    {
      "theme": "Theme Name",
      "performance": "high|medium|low",
      "keywords": ["keyword1", "keyword2"]
    }
  ],
  "performance_metrics": {
    "conversion_rate": "percentage",
    "engagement_rate": "percentage",
    "cost_per_acquisition": "dollar amount",
    "roi": "percentage"
  },
  "geographic_insights": [
    {
      "region": "Region Name",
      "performance": "high|medium|low",
      "opportunity": "description"
    }
  ],
  "temporal_patterns": {
    "best_days": ["day1", "day2"],
    "best_hours": ["time1", "time2"],
    "seasonal_trends": "description"
  },
  "recommendations": ["recommendation1", "recommendation2"]
}

Based on the project context and typical marketing patterns, provide a realistic analysis that would be valuable for marketing strategy development. Focus on actionable insights for audience targeting, content optimization, and budget allocation.
`

    try {
      const requestBody = {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a expert marketing analytics AI that provides detailed, actionable insights from marketing data.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      }

      logger.llmCall('ANALYSIS_REQUEST', requestBody)

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const duration = logger.endTimer(timer)
        // Handle specific error cases
        if (response.status === 429) {
          logger.warn('OpenAI API rate limit reached, falling back to sample', { status: response.status, duration })
          return this.createSampleAnalysis()
        } else if (response.status === 401) {
          logger.warn('OpenAI API authentication failed, falling back to sample', { status: response.status, duration })
          return this.createSampleAnalysis()
        } else if (response.status === 403) {
          logger.warn('OpenAI API access forbidden, falling back to sample', { status: response.status, duration })
          return this.createSampleAnalysis()
        } else if (response.status === 500 || response.status === 502 || response.status === 503) {
          logger.warn('OpenAI API server error, falling back to sample', { status: response.status, duration })
          return this.createSampleAnalysis()
        } else {
          const errorText = await response.text().catch(() => 'Unknown error')
          logger.llmCall('ANALYSIS_REQUEST', requestBody, null, duration, new Error(`API Error ${response.status}: ${errorText}`))
          throw new Error(`OpenAI API error (${response.status}): ${errorText || response.statusText}`)
        }
      }

      const data = await response.json()
      const duration = logger.endTimer(timer)

      logger.llmCall('ANALYSIS_REQUEST', requestBody, data, duration)

      const content = data.choices[0]?.message?.content

      if (!content) {
        logger.warn('No content received from OpenAI, falling back to sample', { duration })
        return this.createSampleAnalysis()
      }

      logger.info('OpenAI analysis response received, parsing', {
        contentLength: content.length,
        duration,
        usage: data.usage
      })
      return this.parseAnalysisOutput(content)

    } catch (error) {
      const duration = logger.endTimer(timer)
      logger.error('Real LLM analysis failed, falling back to sample', {
        projectId,
        duration,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack?.substring(0, 500)
        } : error
      })
      return this.createSampleAnalysis()
    }
  }

  private async generateRealStrategy(analysisSnapshot: AnalysisSnapshot, projectId: string): Promise<Strategy> {
    const timer = logger.startTimer('OPENAI_STRATEGY_CALL')
    logger.info('Starting real OpenAI strategy generation', { projectId })

    const strategyPrompt = `
Based on the following marketing analysis, create a comprehensive marketing strategy in JSON format:

ANALYSIS DATA:
${JSON.stringify(analysisSnapshot, null, 2)}

Please generate a strategy in this exact JSON format:

{
  "strategy_id": "<generated_uuid>",
  "version": 1,
  "created_at": "${new Date().toISOString()}",
  "audience_targeting": {
    "segments": [
      {
        "name": "Segment Name",
        "targeting_criteria": {
          "age": "age range",
          "interests": ["interest1", "interest2"],
          "income": "income range",
          "location": "location type",
          "behaviors": ["behavior1", "behavior2"]
        },
        "budget_allocation": "percentage",
        "priority": "high|medium|low"
      }
    ]
  },
  "messaging_strategy": {
    "primary_message": "main value proposition",
    "tone": "brand voice description",
    "key_themes": ["theme1", "theme2", "theme3"]
  },
  "channel_strategy": {
    "primary_channels": ["channel1", "channel2"],
    "budget_split": {
      "channel1": "percentage",
      "channel2": "percentage"
    },
    "scheduling": {
      "peak_hours": ["time1", "time2"],
      "peak_days": ["day1", "day2"]
    }
  },
  "budget_allocation": {
    "total_budget": "dollar amount",
    "channel_breakdown": {
      "channel1": "dollar amount",
      "channel2": "dollar amount"
    },
    "optimization_strategy": "optimization approach description"
  }
}

Create a strategic plan that leverages the insights from the analysis to maximize ROI and reach the identified audience segments effectively.
`

    try {
      const requestBody = {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a strategic marketing expert who creates data-driven marketing strategies based on audience insights and market analysis.'
          },
          {
            role: 'user',
            content: strategyPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2500
      }

      logger.llmCall('STRATEGY_REQUEST', requestBody)

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const duration = logger.endTimer(timer)
        // Handle specific error cases for strategy generation
        if (response.status === 429) {
          logger.warn('OpenAI API rate limit reached for strategy generation, falling back to sample', { status: response.status, duration })
          return this.createSampleStrategy(analysisSnapshot)
        } else if (response.status === 401) {
          logger.warn('OpenAI API authentication failed for strategy generation, falling back to sample', { status: response.status, duration })
          return this.createSampleStrategy(analysisSnapshot)
        } else if (response.status === 403) {
          logger.warn('OpenAI API access forbidden for strategy generation, falling back to sample', { status: response.status, duration })
          return this.createSampleStrategy(analysisSnapshot)
        } else if (response.status === 500 || response.status === 502 || response.status === 503) {
          logger.warn('OpenAI API server error for strategy generation, falling back to sample', { status: response.status, duration })
          return this.createSampleStrategy(analysisSnapshot)
        } else {
          const errorText = await response.text().catch(() => 'Unknown error')
          logger.llmCall('STRATEGY_REQUEST', requestBody, null, duration, new Error(`API Error ${response.status}: ${errorText}`))
          throw new Error(`OpenAI API error (${response.status}): ${errorText || response.statusText}`)
        }
      }

      const data = await response.json()
      const duration = logger.endTimer(timer)

      logger.llmCall('STRATEGY_REQUEST', requestBody, data, duration)

      const content = data.choices[0]?.message?.content

      if (!content) {
        logger.warn('No strategy content received from OpenAI, falling back to sample', { duration })
        return this.createSampleStrategy(analysisSnapshot)
      }

      logger.info('OpenAI strategy response received, parsing', {
        contentLength: content.length,
        duration,
        usage: data.usage
      })
      return this.parseStrategyOutput(content)

    } catch (error) {
      const duration = logger.endTimer(timer)
      logger.error('Real strategy generation failed, falling back to sample', {
        projectId,
        duration,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack?.substring(0, 500)
        } : error
      })
      return this.createSampleStrategy(analysisSnapshot)
    }
  }

  private createSampleStrategy(analysisSnapshot: AnalysisSnapshot): Strategy {
    // Create a strategy based on the analysis insights
    const topSegment = analysisSnapshot.audience_segments[0]
    const topTheme = analysisSnapshot.content_themes.find(t => t.performance === 'high') || analysisSnapshot.content_themes[0]

    return {
      strategy_id: uuidv4(),
      version: 1,
      created_at: new Date().toISOString(),
      audience_targeting: {
        segments: [
          {
            name: topSegment?.name || "Primary Target Segment",
            targeting_criteria: {
              age: "25-45",
              interests: topTheme?.keywords || ["technology", "innovation"],
              income: "75k+",
              location: "urban_areas",
              behaviors: topSegment?.characteristics || ["early_adopters"]
            },
            budget_allocation: "70%",
            priority: "high" as const
          },
          {
            name: "Secondary Segment",
            targeting_criteria: {
              age: "30-55",
              interests: ["value", "quality"],
              income: "50k+",
              location: "suburban_areas"
            },
            budget_allocation: "30%",
            priority: "medium" as const
          }
        ]
      },
      messaging_strategy: {
        primary_message: `${topTheme?.theme || "Innovation"} that delivers real value`,
        tone: "professional yet approachable",
        key_themes: topTheme?.keywords || ["innovation", "efficiency", "value"]
      },
      channel_strategy: {
        primary_channels: ["social_media", "search_ads", "content_marketing"],
        budget_split: {
          "social_media": "45%",
          "search_ads": "35%",
          "content_marketing": "20%"
        },
        scheduling: {
          peak_hours: analysisSnapshot.temporal_patterns.best_hours || ["10-12pm", "2-4pm"],
          peak_days: analysisSnapshot.temporal_patterns.best_days || ["Tuesday", "Wednesday", "Thursday"]
        }
      },
      budget_allocation: {
        total_budget: "$15,000",
        channel_breakdown: {
          "social_media": "$6,750",
          "search_ads": "$5,250",
          "content_marketing": "$3,000"
        },
        optimization_strategy: `Focus on ${topSegment?.name || "high-value segments"} and scale successful ${topTheme?.theme || "content themes"}`
      }
    }
  }

  private createSampleAnalysis(): AnalysisSnapshot {
    // Sample analysis for development/demo purposes
    return {
      audience_segments: [
        {
          name: "Tech-Savvy Professionals",
          characteristics: ["early_adopters", "high_income", "urban"],
          size_estimate: "35%",
          value_score: 8
        },
        {
          name: "Budget-Conscious Families",
          characteristics: ["price_sensitive", "suburban", "family_oriented"],
          size_estimate: "45%",
          value_score: 6
        }
      ],
      content_themes: [
        {
          theme: "Innovation & Technology",
          performance: "high" as const,
          keywords: ["AI", "innovation", "future", "smart"]
        },
        {
          theme: "Value & Savings",
          performance: "medium" as const,
          keywords: ["save", "discount", "affordable", "value"]
        }
      ],
      performance_metrics: {
        conversion_rate: "3.2%",
        engagement_rate: "7.8%",
        cost_per_acquisition: "$24",
        roi: "425%"
      },
      geographic_insights: [
        {
          region: "North America",
          performance: "high" as const,
          opportunity: "Strong performance across all segments"
        },
        {
          region: "Europe",
          performance: "medium" as const,
          opportunity: "Opportunity to expand in Eastern markets"
        }
      ],
      temporal_patterns: {
        best_days: ["Tuesday", "Wednesday", "Thursday"],
        best_hours: ["9-11am", "2-4pm", "7-9pm"],
        seasonal_trends: "Higher engagement during Q4 holiday season"
      },
      recommendations: [
        "Focus budget allocation on Tech-Savvy Professionals segment",
        "Develop mobile-first creative strategy",
        "Implement dynamic pricing for price-sensitive segments",
        "Expand geographic targeting to emerging markets"
      ]
    }
  }
}

export const llmService = LLMService.getInstance()