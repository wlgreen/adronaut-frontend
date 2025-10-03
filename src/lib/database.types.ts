export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          project_id: string
          name: string
          created_at: string
        }
        Insert: {
          project_id?: string
          name: string
          created_at?: string
        }
        Update: {
          project_id?: string
          name?: string
          created_at?: string
        }
      }
      artifacts: {
        Row: {
          artifact_id: string
          project_id: string
          filename: string
          mime: string
          storage_url: string
          summary_json: any
          created_at: string
        }
        Insert: {
          artifact_id?: string
          project_id: string
          filename: string
          mime: string
          storage_url: string
          summary_json?: any
          created_at?: string
        }
        Update: {
          artifact_id?: string
          project_id?: string
          filename?: string
          mime?: string
          storage_url?: string
          summary_json?: any
          created_at?: string
        }
      }
      analysis_snapshots: {
        Row: {
          snapshot_id: string
          project_id: string
          snapshot_data: any
          created_at: string
        }
        Insert: {
          snapshot_id?: string
          project_id: string
          snapshot_data: any
          created_at?: string
        }
        Update: {
          snapshot_id?: string
          project_id?: string
          snapshot_data?: any
          created_at?: string
        }
      }
      strategy_versions: {
        Row: {
          strategy_id: string
          project_id: string
          version: number
          strategy_json: any
          created_at: string
        }
        Insert: {
          strategy_id?: string
          project_id: string
          version: number
          strategy_json: any
          created_at?: string
        }
        Update: {
          strategy_id?: string
          project_id?: string
          version?: number
          strategy_json?: any
          created_at?: string
        }
      }
      strategy_active: {
        Row: {
          project_id: string
          strategy_id: string
        }
        Insert: {
          project_id: string
          strategy_id: string
        }
        Update: {
          project_id?: string
          strategy_id?: string
        }
      }
      strategy_patches: {
        Row: {
          patch_id: string
          project_id: string
          source: 'insights' | 'reflection' | 'edited_llm'
          status: 'proposed' | 'approved' | 'rejected' | 'superseded'
          patch_data: any
          justification: string
          created_at: string
        }
        Insert: {
          patch_id?: string
          project_id: string
          source: 'insights' | 'reflection' | 'edited_llm'
          status?: 'proposed' | 'approved' | 'rejected' | 'superseded'
          patch_data: any
          justification: string
          created_at?: string
        }
        Update: {
          patch_id?: string
          project_id?: string
          source?: 'insights' | 'reflection' | 'edited_llm'
          status?: 'proposed' | 'approved' | 'rejected' | 'superseded'
          patch_data?: any
          justification?: string
          created_at?: string
        }
      }
      briefs: {
        Row: {
          brief_id: string
          strategy_id: string
          brief_json: any
          created_at: string
        }
        Insert: {
          brief_id?: string
          strategy_id: string
          brief_json: any
          created_at?: string
        }
        Update: {
          brief_id?: string
          strategy_id?: string
          brief_json?: any
          created_at?: string
        }
      }
      campaigns: {
        Row: {
          campaign_id: string
          project_id: string
          strategy_id: string
          status: 'running' | 'completed' | 'failed'
          policy_json: any
          created_at: string
        }
        Insert: {
          campaign_id?: string
          project_id: string
          strategy_id: string
          status?: 'running' | 'completed' | 'failed'
          policy_json: any
          created_at?: string
        }
        Update: {
          campaign_id?: string
          project_id?: string
          strategy_id?: string
          status?: 'running' | 'completed' | 'failed'
          policy_json?: any
          created_at?: string
        }
      }
      metrics: {
        Row: {
          metric_id: string
          campaign_id: string
          ts: string
          impressions: number
          clicks: number
          spend: number
          conversions: number
          revenue: number
          extra_json: any
        }
        Insert: {
          metric_id?: string
          campaign_id: string
          ts: string
          impressions: number
          clicks: number
          spend: number
          conversions: number
          revenue: number
          extra_json?: any
        }
        Update: {
          metric_id?: string
          campaign_id?: string
          ts?: string
          impressions?: number
          clicks?: number
          spend?: number
          conversions?: number
          revenue?: number
          extra_json?: any
        }
      }
      step_events: {
        Row: {
          event_id: string
          project_id: string
          run_id: string
          step_name: string
          status: 'started' | 'completed' | 'failed'
          created_at: string
        }
        Insert: {
          event_id?: string
          project_id: string
          run_id: string
          step_name: string
          status: 'started' | 'completed' | 'failed'
          created_at?: string
        }
        Update: {
          event_id?: string
          project_id?: string
          run_id?: string
          step_name?: string
          status?: 'started' | 'completed' | 'failed'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}