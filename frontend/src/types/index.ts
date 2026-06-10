export interface User {
  id: number
  name: string
  email: string
  is_admin: boolean
  is_part_leader: boolean
  department: string | null
  is_active: boolean
  password_set: boolean
  created_at: string
}

export interface ComponentScore {
  usual: number
  need: number
  stress: number
}

export interface ColorInfo {
  code: string
  name: string
  keyword: string
  tagline?: string
  hex: string
}

export interface InterestItem {
  category: string
  name: string
  score: number
}

export interface ReportData {
  primary_color: string
  secondary_color: string
  life_style_x: number
  life_style_y: number
  life_style_need_x: number
  life_style_need_y: number
  intensity: number
  components: Record<string, ComponentScore>
  interests: Record<string, number>
  user_name: string
  color_info: {
    primary: ColorInfo
    secondary: ColorInfo
  }
  top_interests: InterestItem[]
  component_names: Record<string, string>
  narrative: {
    summary: string
    usual_behavior: string
    needs: string
    stress_behavior: string
    communication: string
    team_role: string
    growth: string
  }
}

export interface Report {
  id: number
  user_id: number
  user_name: string
  user_email: string
  is_public: boolean
  report_data: ReportData
  created_at: string
}

export interface SurveyQuestion {
  id: number
  text: string
}

export interface SurveySection {
  section: number
  total_sections: number
  total_questions: number
  section_title: string
  section_subtitle: string
  questions: SurveyQuestion[]
  scale_labels: string[]
}

export interface SurveyStatus {
  has_survey: boolean
  id?: number
  status?: 'in_progress' | 'completed'
  current_section?: number
  responses_count?: number
  completed_at?: string
}

export type BirkmanColor = 'red' | 'yellow' | 'green' | 'blue'

// ── WorkCraft Studio ──
export type Visibility = 'private' | 'leader_only' | 'team_public' | 'anonymous_template'
export type MissionStatus = 'idea' | 'prompt_ready' | 'in_progress' | 'review' | 'done' | 'shared'

export interface WorkFriction {
  id: number
  user_id: number
  title: string
  description: string
  friction_type: string
  frequency: string
  expected_effect: string
  related_skill: string
  claude_feasible: boolean
  visibility: Visibility
  created_at: string
  updated_at: string
}

export interface GrowthMission {
  id: number
  user_id: number
  work_friction_id: number | null
  origin_friction_id: number | null
  title: string
  problem: string
  goal: string
  output: string
  scope: string
  success_criteria: string
  deadline: string
  learning_goal: string
  start_date: string
  due_date: string
  status: MissionStatus
  visibility: Visibility
  created_at: string
  updated_at: string
}

export interface SharedFriction {
  id: number
  owner_name: string
  department: string | null
  title: string
  description: string
  friction_type: string
  frequency: string
  related_skill: string
  claude_feasible: boolean
  visibility: Visibility
  created_at: string
}

export interface ClaudePrompt {
  id: number
  mission_id: number
  prompt_text: string
  prompt_type: string
  created_at: string
}

export interface RecommendationItem {
  title: string
  reason: string
}

export interface Recommendation {
  has_birkman: boolean
  color_name: string | null
  color_keyword: string | null
  tone: string | null
  skill_tags: string[]
  mission_ideas: RecommendationItem[]
}

export interface WorkCraftMeta {
  friction_types: string[]
  visibility_values: Visibility[]
  mission_statuses: MissionStatus[]
}

export interface SharedTemplate {
  id: number
  title: string
  category: string
  description: string
  body: string
  source_type: string
  owner_name: string
  created_at: string
}

export interface SupportRequest {
  id: number
  request_type: string
  description: string
  anonymous: boolean
  status: string
  created_at: string
}

// ── Leader (anonymous aggregates only) ──
export interface FrictionTrend {
  category: string
  contributors: number | null
  progress: number
  min_n: number
  visible: boolean
}

export interface SupportTrend {
  type: string
  count: number
}

export interface LeaderTotals {
  total_frictions: number
  total_missions: number
  completed_missions: number
  generated_prompts: number
  shared_templates: number
  participants: number
}

export interface LeaderDashboard {
  anonymity_min_n: number
  totals: LeaderTotals
  friction_trends: FrictionTrend[]
  support_trends: SupportTrend[]
}

export interface LeaderSupportItem {
  id: number
  request_type: string
  description: string
  requester: string
  status: string
  created_at: string
}
