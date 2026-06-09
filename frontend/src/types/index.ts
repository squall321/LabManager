export interface User {
  id: number
  name: string
  email: string
  is_admin: boolean
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
