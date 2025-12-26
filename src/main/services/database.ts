import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, statSync } from 'fs'

// 数据库行类型定义
interface ConversationRow {
  id: string
  title: string
  timestamp: number
  message_count: number
}

interface MessageRow {
  id: string
  role: 'user' | 'assistant'
  content: string
  image: string | null
  video: string | null
  video_blob: Buffer | null
  pdf_images: string | null
  pdf_name: string | null
  ppt_images: string | null
  ppt_name: string | null
  timestamp: number
}

interface CountRow {
  count: number
}

// 聊天消息接口
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  image?: string
  video?: string
  videoBase64?: string
  pdfImages?: string[]
  pdfName?: string
  pptImages?: string[]
  pptName?: string
  timestamp?: number
}

// 对话历史接口
export interface ConversationHistory {
  id: string
  title: string
  messages: ChatMessage[]
  timestamp: number
  messageCount: number
}

class DatabaseService {
  private db: Database.Database | null = null
  private readonly dbPath: string
  private static readonly CURRENT_DB_VERSION = 1 // 当前数据库版本

  constructor() {
    // 确保用户数据目录存在
    const userDataPath = app.getPath('userData')
    if (!existsSync(userDataPath)) {
      mkdirSync(userDataPath, { recursive: true })
    }

    this.dbPath = join(userDataPath, 'polaris_desk.db')
    this.init()
  }

  private init(): void {
    try {
      console.log('数据库服务：开始初始化数据库，路径:', this.dbPath)
      this.db = new Database(this.dbPath)

      // 检查是否需要创建表
      const needsInit = this.checkIfTablesExist()
      if (needsInit) {
        this.createTables()
        console.log('数据库服务：表结构初始化完成')

        // 初始化完成后直接设为最新版本
        this.getCurrentDbVersion() // 确保版本表存在
        this.updateDbVersion(DatabaseService.CURRENT_DB_VERSION)
      } else {
        console.log('数据库服务：表结构已存在，跳过初始化')

        // 检查数据库版本，只有需要时才进行迁移
        const currentVersion = this.getCurrentDbVersion()
        if (currentVersion < DatabaseService.CURRENT_DB_VERSION) {
          console.log(`数据库服务：检测到版本更新 (${currentVersion} -> ${DatabaseService.CURRENT_DB_VERSION})，开始迁移`)
          this.migrateDatabase()
          this.updateDbVersion(DatabaseService.CURRENT_DB_VERSION)
        } else {
          console.log(`数据库服务：版本 ${currentVersion} 已是最新，跳过迁移检查`)
        }
      }

      // 清理可能存在的重复消息（仅在首次运行时）
      if (needsInit) {
        this.cleanupDuplicateMessages()
      }

      console.log('数据库服务：SQLite 数据库初始化成功:', this.dbPath)
    } catch (error) {
      console.error('数据库服务：SQLite 数据库初始化失败:', error)
      console.log('数据库服务：将回退到 localStorage 存储')
      // 设置为 null，让所有方法回退到 localStorage
      this.db = null
    }
  }

  private checkIfTablesExist(): boolean {
    if (!this.db) return true // 如果数据库不可用，假设需要初始化

    try {
      // 检查所有必需的表是否都存在
      const tables = ['conversations', 'messages', 'settings']

      for (const tableName of tables) {
        const result = this.db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(tableName)

        if (!result) {
          console.log(`数据库服务：表 ${tableName} 不存在，需要初始化`)
          return true // 如果任何表不存在，返回 true 表示需要初始化
        }
      }

      console.log('数据库服务：所有必需的表都已存在')
      return false // 所有表都存在
    } catch (error) {
      console.error('数据库服务：检查表存在性失败:', error)
      return true // 出错时假设需要初始化
    }
  }

  // 获取当前数据库版本
  private getCurrentDbVersion(): number {
    if (!this.db) return 0

    try {
      // 检查是否存在版本表
      const tableExists = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='db_version'").get()

      if (!tableExists) {
        // 版本表不存在，创建并设为版本0（表示需要迁移）
        this.db.exec(`
          CREATE TABLE db_version (
            version INTEGER PRIMARY KEY
          )
        `)
        this.db.prepare('INSERT INTO db_version (version) VALUES (0)').run()
        return 0
      }

      // 获取当前版本
      const versionRow = this.db.prepare('SELECT version FROM db_version LIMIT 1').get() as { version: number } | undefined
      return versionRow?.version || 0
    } catch (error) {
      console.error('数据库服务：获取版本失败:', error)
      return 0
    }
  }

  // 更新数据库版本
  private updateDbVersion(version: number): void {
    if (!this.db) return

    try {
      this.db.prepare('UPDATE db_version SET version = ?').run(version)
      console.log(`数据库服务：版本已更新至 ${version}`)
    } catch (error) {
      console.error('数据库服务：更新版本失败:', error)
    }
  }

  private createTables(): void {
    if (!this.db) return

    console.log('数据库服务：开始创建数据表')

    // 创建设置表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `)
    console.log('数据库服务：settings 表已创建')

    // 创建对话表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        message_count INTEGER DEFAULT 0
      )
    `)
    console.log('数据库服务：conversations 表已创建')

    // 创建消息表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        image TEXT,
        video TEXT,
        video_blob BLOB,
        pdf_images TEXT,
        pdf_name TEXT,
        ppt_images TEXT,
        ppt_name TEXT,
        timestamp INTEGER,
        FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE
      )
    `)
    console.log('数据库服务：messages 表已创建')

    // 创建索引
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON conversations (timestamp DESC)
    `)

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages (conversation_id)
    `)

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages (timestamp)
    `)
    console.log('数据库服务：索引已创建')
  }

  // 单独保存一条消息（增量保存）
  saveMessage(conversationId: string, message: ChatMessage): boolean {
    console.log('数据库服务：保存单条消息', { conversationId, messageId: message.id, role: message.role })

    if (!this.db) {
      console.error('数据库服务：数据库连接不可用')
      return false
    }

    try {
      // 为了避免 ID 冲突，为每个消息生成一个唯一的 ID（结合对话 ID 和消息 ID）
      const uniqueMessageId = `${conversationId}_${message.id}`

      // 处理视频数据：如果有 videoBase64，则转换为 Buffer 存储
      let videoBlob: Buffer | null = null
      if (message.videoBase64) {
        try {
          // 从 data:video/mp4;base64,xxxxx 格式中提取 base64 数据
          const base64Data = message.videoBase64.split(',')[1] || message.videoBase64
          videoBlob = Buffer.from(base64Data, 'base64')
        } catch (error) {
          console.warn('转换视频数据失败:', error)
        }
      }

      // 插入消息记录 - 使用 INSERT OR REPLACE 避免主键冲突
      const insertMessage = this.db.prepare(`
        INSERT OR REPLACE INTO messages (
          id, conversation_id, role, content, image, video, video_blob,
          pdf_images, pdf_name, ppt_images, ppt_name, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      insertMessage.run(uniqueMessageId, conversationId, message.role, message.content, message.image || null, message.video || null, videoBlob, message.pdfImages ? JSON.stringify(message.pdfImages) : null, message.pdfName || null, message.pptImages ? JSON.stringify(message.pptImages) : null, message.pptName || null, message.timestamp || Date.now())

      console.log('数据库服务：单条消息保存成功')
      return true
    } catch (error) {
      console.error('数据库服务：保存单条消息失败:', error)
      return false
    }
  }

  // 保存或更新对话信息（不删除消息）
  saveOrUpdateConversation(conversationId: string, title: string, timestamp: number, messageCount: number): boolean {
    console.log('数据库服务：保存/更新对话信息', { conversationId, title, messageCount })

    if (!this.db) {
      console.error('数据库服务：数据库连接不可用')
      return false
    }

    try {
      const insertConversation = this.db.prepare(`
        INSERT OR REPLACE INTO conversations (id, title, timestamp, message_count)
        VALUES (?, ?, ?, ?)
      `)

      insertConversation.run(conversationId, title, timestamp, messageCount)
      console.log('数据库服务：对话信息已保存/更新')
      return true
    } catch (error) {
      console.error('数据库服务：保存/更新对话信息失败:', error)
      return false
    }
  }

  // 增量保存对话（推荐使用）
  saveConversationIncremental(conversation: ConversationHistory): boolean {
    console.log('数据库服务：增量保存对话', { id: conversation.id, title: conversation.title, messageCount: conversation.messages.length })

    if (!this.db) {
      console.error('数据库服务：数据库连接不可用')
      return false
    }

    const transaction = this.db.transaction(() => {
      // 1. 保存/更新对话信息
      if (!this.saveOrUpdateConversation(conversation.id, conversation.title, conversation.timestamp, conversation.messages.length)) {
        throw new Error('保存对话信息失败')
      }

      // 2. 获取已存在的消息ID列表
      const existingMessagesStmt = this.db!.prepare(`
        SELECT id FROM messages WHERE conversation_id = ?
      `)
      const existingMessages = existingMessagesStmt.all(conversation.id) as Array<{ id: string }>
      const existingMessageIds = new Set(existingMessages.map(msg => msg.id))

      // 3. 只保存新消息
      let newMessagesCount = 0
      for (const message of conversation.messages) {
        const uniqueMessageId = `${conversation.id}_${message.id}`

        // 如果消息不存在，则保存
        if (!existingMessageIds.has(uniqueMessageId)) {
          if (!this.saveMessage(conversation.id, message)) {
            throw new Error(`保存消息失败: ${message.id}`)
          }
          newMessagesCount++
        }
      }

      console.log(`数据库服务：增量保存完成，新增 ${newMessagesCount} 条消息`)
    })

    try {
      transaction()
      console.log('数据库服务：增量对话保存成功')
      return true
    } catch (error) {
      console.error('数据库服务：增量保存对话失败:', error)
      return false
    }
  }

  // 保存对话历史（保留原有方法，用于完整重建）
  saveConversation(conversation: ConversationHistory): boolean {
    console.log('数据库服务：完整保存对话（重建模式）', { id: conversation.id, title: conversation.title, messageCount: conversation.messages.length })

    if (!this.db) {
      console.error('数据库服务：数据库连接不可用')
      return false
    }

    const transaction = this.db.transaction(() => {
      // 插入对话记录
      const insertConversation = this.db!.prepare(`
        INSERT OR REPLACE INTO conversations (id, title, timestamp, message_count)
        VALUES (?, ?, ?, ?)
      `)

      insertConversation.run(conversation.id, conversation.title, conversation.timestamp, conversation.messages.length)
      console.log('数据库服务：对话记录已插入')

      // 删除旧的消息记录（如果存在）
      const deleteMessages = this.db!.prepare('DELETE FROM messages WHERE conversation_id = ?')
      const deleteResult = deleteMessages.run(conversation.id)
      console.log(`数据库服务：删除了 ${deleteResult.changes} 条旧消息`)

      // 插入消息记录 - 使用 INSERT OR REPLACE 避免主键冲突
      const insertMessage = this.db!.prepare(`
        INSERT OR REPLACE INTO messages (
          id, conversation_id, role, content, image, video, video_blob,
          pdf_images, pdf_name, ppt_images, ppt_name, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      for (const message of conversation.messages) {
        // 为了避免 ID 冲突，为每个消息生成一个唯一的 ID（结合对话 ID 和消息 ID）
        const uniqueMessageId = `${conversation.id}_${message.id}`

        // 处理视频数据：如果有 videoBase64，则转换为 Buffer 存储
        let videoBlob: Buffer | null = null
        if (message.videoBase64) {
          try {
            // 从 data:video/mp4;base64,xxxxx 格式中提取 base64 数据
            const base64Data = message.videoBase64.split(',')[1] || message.videoBase64
            videoBlob = Buffer.from(base64Data, 'base64')
          } catch (error) {
            console.warn('转换视频数据失败:', error)
          }
        }

        insertMessage.run(uniqueMessageId, conversation.id, message.role, message.content, message.image || null, message.video || null, videoBlob, message.pdfImages ? JSON.stringify(message.pdfImages) : null, message.pdfName || null, message.pptImages ? JSON.stringify(message.pptImages) : null, message.pptName || null, message.timestamp || Date.now())
      }
      console.log(`数据库服务：${conversation.messages.length} 条消息已插入`)
    })

    try {
      transaction()
      console.log('数据库服务：对话保存成功')
      return true
    } catch (error) {
      console.error('数据库服务：保存对话历史失败:', error)
      return false
    }
  }

  // 获取对话历史列表
  getConversationList(): Array<{ id: string; title: string; timestamp: number; messageCount: number }> {
    console.log('数据库服务：获取对话历史列表')

    if (!this.db) {
      console.error('数据库服务：数据库连接不可用')
      return []
    }

    try {
      const stmt = this.db.prepare(`
        SELECT id, title, timestamp, message_count as messageCount
        FROM conversations
        ORDER BY timestamp DESC
        LIMIT 100
      `)

      const result = stmt.all() as Array<{ id: string; title: string; timestamp: number; messageCount: number }>
      console.log(`数据库服务：找到 ${result.length} 个对话记录`)
      return result
    } catch (error) {
      console.error('数据库服务：获取对话历史列表失败:', error)
      return []
    }
  }

  // 加载特定对话
  loadConversation(conversationId: string): ConversationHistory | null {
    if (!this.db) return null

    try {
      // 获取对话信息
      const conversationStmt = this.db.prepare(`
        SELECT id, title, timestamp, message_count
        FROM conversations
        WHERE id = ?
      `)

      const conversation = conversationStmt.get(conversationId) as ConversationRow
      if (!conversation) return null

      // 获取消息列表
      const messagesStmt = this.db.prepare(`
        SELECT id, role, content, image, video, video_blob, pdf_images, pdf_name, ppt_images, ppt_name, timestamp
        FROM messages
        WHERE conversation_id = ?
        ORDER BY timestamp ASC
      `)

      const messageRows = messagesStmt.all(conversationId) as MessageRow[]

      const messages: ChatMessage[] = messageRows.map(row => {
        // 处理视频数据：如果有 video_blob，则转换为 base64 格式
        let videoBase64: string | undefined = undefined
        let videoUrl: string | undefined = row.video || undefined

        if (row.video_blob) {
          try {
            const base64Data = row.video_blob.toString('base64')
            videoBase64 = `data:video/mp4;base64,${base64Data}`
            // 如果有 blob 数据，使用 base64 作为视频源
            videoUrl = videoBase64
          } catch (error) {
            console.warn('转换视频 blob 数据失败:', error)
          }
        }

        return {
          // 从数据库中的唯一 ID 恢复原始消息 ID
          id: row.id.includes('_') ? row.id.split('_').slice(1).join('_') : row.id,
          role: row.role,
          content: row.content,
          image: row.image || undefined,
          video: videoUrl,
          videoBase64: videoBase64,
          pdfImages: row.pdf_images ? JSON.parse(row.pdf_images) : undefined,
          pdfName: row.pdf_name || undefined,
          pptImages: row.ppt_images ? JSON.parse(row.ppt_images) : undefined,
          pptName: row.ppt_name || undefined,
          timestamp: row.timestamp
        }
      })

      return {
        id: conversation.id,
        title: conversation.title,
        timestamp: conversation.timestamp,
        messages,
        messageCount: messages.length
      }
    } catch (error) {
      console.error('加载对话失败:', error)
      return null
    }
  }

  // 删除对话
  deleteConversation(conversationId: string): boolean {
    if (!this.db) return false

    try {
      const stmt = this.db.prepare('DELETE FROM conversations WHERE id = ?')
      const result = stmt.run(conversationId)
      return result.changes > 0
    } catch (error) {
      console.error('删除对话失败:', error)
      return false
    }
  }

  // 搜索对话
  searchConversations(keyword: string): Array<{ id: string; title: string; timestamp: number; messageCount: number }> {
    if (!this.db) return []

    try {
      const stmt = this.db.prepare(`
        SELECT DISTINCT c.id, c.title, c.timestamp, c.message_count as messageCount
        FROM conversations c
        LEFT JOIN messages m ON c.id = m.conversation_id
        WHERE c.title LIKE ? OR m.content LIKE ?
        ORDER BY c.timestamp DESC
        LIMIT 50
      `)

      const searchPattern = `%${keyword}%`
      return stmt.all(searchPattern, searchPattern) as Array<{ id: string; title: string; timestamp: number; messageCount: number }>
    } catch (error) {
      console.error('搜索对话失败:', error)
      return []
    }
  }

  // 获取数据库统计信息
  getStats(): { totalConversations: number; totalMessages: number; dbSize: string } {
    if (!this.db) return { totalConversations: 0, totalMessages: 0, dbSize: '0 KB' }

    try {
      const conversationCount = this.db.prepare('SELECT COUNT(*) as count FROM conversations').get() as CountRow
      const messageCount = this.db.prepare('SELECT COUNT(*) as count FROM messages').get() as CountRow

      // 获取数据库文件大小
      const { size } = statSync(this.dbPath)
      const dbSize = size < 1024 ? `${size} B` : size < 1024 * 1024 ? `${(size / 1024).toFixed(1)} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`

      return {
        totalConversations: conversationCount.count,
        totalMessages: messageCount.count,
        dbSize
      }
    } catch (error) {
      console.error('获取数据库统计信息失败:', error)
      return { totalConversations: 0, totalMessages: 0, dbSize: '0 KB' }
    }
  }

  // 清理旧数据（保留最近的N个对话）
  cleanup(keepRecentCount: number = 100): boolean {
    if (!this.db) return false

    try {
      const stmt = this.db.prepare(`
        DELETE FROM conversations
        WHERE id NOT IN (
          SELECT id FROM conversations
          ORDER BY timestamp DESC
          LIMIT ?
        )
      `)

      const result = stmt.run(keepRecentCount)
      console.log(`清理完成，删除了 ${result.changes} 个旧对话`)
      return true
    } catch (error) {
      console.error('清理旧数据失败:', error)
      return false
    }
  }

  // 清理重复的消息记录
  cleanupDuplicateMessages(): boolean {
    if (!this.db) return false

    try {
      // 删除重复的消息，只保留最新的
      const stmt = this.db.prepare(`
        DELETE FROM messages
        WHERE rowid NOT IN (
          SELECT MIN(rowid)
          FROM messages
          GROUP BY id
        )
      `)

      const result = stmt.run()
      console.log(`清理了 ${result.changes} 条重复消息`)
      return true
    } catch (error) {
      console.error('清理重复消息失败:', error)
      return false
    }
  }

  // 数据库迁移
  private migrateDatabase(): void {
    if (!this.db) return

    try {
      // 检查 settings 表是否存在
      const settingsTableExists = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='settings'").get()

      if (!settingsTableExists) {
        console.log('数据库服务：创建 settings 表')
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at INTEGER NOT NULL
          )
        `)
        console.log('数据库服务：settings 表创建完成')
      }

      // 检查 messages 表是否有 video_blob 字段
      const tableInfo = this.db.prepare('PRAGMA table_info(messages)').all() as Array<{ name: string }>
      const hasVideoBlobField = tableInfo.some(field => field.name === 'video_blob')

      if (!hasVideoBlobField) {
        console.log('数据库服务：添加 video_blob 字段')
        this.db.exec('ALTER TABLE messages ADD COLUMN video_blob BLOB')
        console.log('数据库服务：video_blob 字段添加完成')
      }
      // 如果字段已存在，不输出任何日志（静默跳过）
    } catch (error) {
      console.error('数据库服务：迁移失败:', error)
    }
  }

  // 保存设置
  saveSetting(key: string, value: string): boolean {
    console.log('数据库服务：保存设置', { key })

    if (!this.db) {
      console.error('数据库服务：数据库连接不可用')
      return false
    }

    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO settings (key, value, updated_at)
        VALUES (?, ?, ?)
      `)

      stmt.run(key, value, Date.now())
      console.log('数据库服务：设置已保存')
      return true
    } catch (error) {
      console.error('数据库服务：保存设置失败:', error)
      return false
    }
  }

  // 获取设置
  getSetting(key: string): string | null {
    if (!this.db) return null

    try {
      const stmt = this.db.prepare('SELECT value FROM settings WHERE key = ?')
      const result = stmt.get(key) as { value: string } | undefined
      return result?.value || null
    } catch (error) {
      console.error('数据库服务：获取设置失败:', error)
      return null
    }
  }

  // 获取所有设置
  getAllSettings(): Record<string, string> {
    if (!this.db) return {}

    try {
      const stmt = this.db.prepare('SELECT key, value FROM settings')
      const results = stmt.all() as Array<{ key: string; value: string }>

      const settings: Record<string, string> = {}
      for (const row of results) {
        settings[row.key] = row.value
      }

      console.log(`数据库服务：加载了 ${Object.keys(settings).length} 个设置`)
      return settings
    } catch (error) {
      console.error('数据库服务：获取所有设置失败:', error)
      return {}
    }
  }

  // 删除设置
  deleteSetting(key: string): boolean {
    if (!this.db) return false

    try {
      const stmt = this.db.prepare('DELETE FROM settings WHERE key = ?')
      stmt.run(key)
      console.log('数据库服务：设置已删除', { key })
      return true
    } catch (error) {
      console.error('数据库服务：删除设置失败:', error)
      return false
    }
  }

  // 关闭数据库连接
  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}

// 导出单例实例
export const databaseService = new DatabaseService()
