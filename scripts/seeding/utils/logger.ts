/**
 * Seeding Logger Utility
 * Provides consistent logging across all seeding operations
 */

type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug'

const EMOJIS: Record<LogLevel, string> = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '❌',
  debug: '🔍'
}

const COLORS: Record<LogLevel, string> = {
  info: '\x1b[36m',    // Cyan
  success: '\x1b[32m', // Green
  warning: '\x1b[33m', // Yellow
  error: '\x1b[31m',   // Red
  debug: '\x1b[90m'    // Gray
}

const RESET = '\x1b[0m'

export class Logger {
  private static indent = 0
  private static verbose = false

  static setVerbose(verbose: boolean) {
    this.verbose = verbose
  }

  private static format(level: LogLevel, message: string): string {
    const emoji = EMOJIS[level]
    const color = COLORS[level]
    const padding = '  '.repeat(this.indent)
    return `${padding}${color}${emoji} ${message}${RESET}`
  }

  static info(message: string) {
    console.log(this.format('info', message))
  }

  static success(message: string) {
    console.log(this.format('success', message))
  }

  static warning(message: string) {
    console.log(this.format('warning', message))
  }

  static error(message: string, error?: Error) {
    console.error(this.format('error', message))
    if (error && this.verbose) {
      console.error(error)
    }
  }

  static debug(message: string) {
    if (this.verbose) {
      console.log(this.format('debug', message))
    }
  }

  static section(title: string) {
    console.log(`\n${'='.repeat(70)}`)
    console.log(`  ${title}`)
    console.log(`${'='.repeat(70)}`)
  }

  static subsection(title: string) {
    console.log(`\n${'-'.repeat(50)}`)
    console.log(`  ${title}`)
    console.log(`${'-'.repeat(50)}`)
  }

  static increaseIndent() {
    this.indent++
  }

  static decreaseIndent() {
    this.indent = Math.max(0, this.indent - 1)
  }

  static resetIndent() {
    this.indent = 0
  }

  static progress(current: number, total: number, item?: string) {
    const percentage = Math.round((current / total) * 100)
    const bar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5))
    const itemText = item ? ` - ${item}` : ''
    console.log(`  ${bar} ${percentage}% (${current}/${total})${itemText}`)
  }
}

export default Logger
