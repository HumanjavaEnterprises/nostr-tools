import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function migrateTest(content) {
  // Replace Bun test imports with Vitest
  content = content.replace(/from ['"]bun:test['"]/g, "from '../test/helpers/test-utils'")
  
  // Replace test syntax
  content = content.replace(/test\(/g, 'it(')
  content = content.replace(/describe\(/g, 'describe(')
  
  // Replace assertions
  content = content.replace(/expect\((.*?)\)\.toBe\((.*?)\)/g, 'expect($1).toBe($2)')
  content = content.replace(/expect\((.*?)\)\.toEqual\((.*?)\)/g, 'expect($1).toEqual($2)')
  
  return content
}

function processDirectory(dir) {
  const files = readdirSync(dir)
  
  files.forEach(file => {
    const fullPath = join(dir, file)
    const stat = statSync(fullPath)
    
    if (stat.isDirectory()) {
      processDirectory(fullPath)
    } else if (file.endsWith('.test.ts')) {
      console.log(`Processing ${fullPath}`)
      const content = readFileSync(fullPath, 'utf8')
      const migratedContent = migrateTest(content)
      writeFileSync(fullPath, migratedContent)
    }
  })
}

// Start migration
processDirectory(join(__dirname, '..', 'src'))
