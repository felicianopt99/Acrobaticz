#!/usr/bin/env node
/**
 * Database Seeding CLI
 * Main entry point for all seeding operations
 * 
 * Usage:
 *   npm run db:seed              # Run default seeding
 *   npm run db:seed -- --clean   # Clean and seed
 *   npm run db:seed -- --verbose # Verbose output
 *   npm run db:seed -- --help    # Show help
 */

import { parseArgs, mergeConfig } from './seeding/core/config'
import { SeedingOrchestrator } from './seeding/core/orchestrator'
import { Logger } from './seeding/utils'

const HELP_TEXT = `
🌱 Database Seeding Tool

USAGE:
  npm run db:seed [OPTIONS]

OPTIONS:
  --clean               Clean database before seeding
  --verbose, -v         Enable verbose logging
  --dry-run             Simulate seeding without making changes
  --defaults            Use default hardcoded data instead of JSON files
  --json                Use JSON data files (default)
  --users-only          Seed only users
  --no-products         Skip product seeding
  --with-partners       Include partner data
  --help, -h            Show this help message

EXAMPLES:
  npm run db:seed
    Standard seeding with JSON data

  npm run db:seed -- --clean --verbose
    Clean database and seed with detailed logging

  npm run db:seed -- --defaults --users-only
    Create only default users

  npm run db:seed -- --dry-run
    Preview what would be seeded without making changes

For more information, see: scripts/seeding/README.md
`

async function main() {
  try {
    const args = process.argv.slice(2)

    // Show help
    if (args.includes('--help') || args.includes('-h')) {
      console.log(HELP_TEXT)
      process.exit(0)
    }

    // Parse configuration
    const partialConfig = parseArgs(args)
    const config = mergeConfig(partialConfig)

    // Set logger verbosity
    Logger.setVerbose(config.verbose)

    // Create and run orchestrator
    const orchestrator = new SeedingOrchestrator(config)
    await orchestrator.execute()

    process.exit(0)
  } catch (error) {
    Logger.error('Seeding process failed', error as Error)
    process.exit(1)
  }
}

// Run if executed directly
if (require.main === module) {
  main()
}

export default main
