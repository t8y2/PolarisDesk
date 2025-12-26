export interface ChatMessage {
  role: 'user' | 'assistant'
  text?: string
  image?: string
  video?: string
  pdf?: string
  pdfImages?: string[]
  pdfName?: string // 添加PDF文件名字段
  pptImages?: string[] // 添加PPT图片数组
  pptName?: string // 添加PPT文件名字段
  timestamp: number
}

export interface ModelRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content:
      | string
      | Array<{
          type: 'text' | 'image_url' | 'video_url'
          text?: string
          image_url?: {
            url: string
          }
          video_url?: {
            url: string
          }
        }>
  }>
  tools?: Array<unknown>
  stream?: boolean
  top_p?: number
  top_k?: number
  temperature?: number
  max_tokens?: number
  repetition_penalty?: number
  skip_special_tokens?: boolean
  stop_token_ids?: number[]
  include_stop_str_in_output?: boolean
}

export interface ModelResponse {
  choices: Array<{
    message: {
      role: 'assistant'
      content: string
    }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}
