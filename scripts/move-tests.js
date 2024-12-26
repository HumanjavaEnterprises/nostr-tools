import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function ensureDirectoryExists(dir) {
  try {
    mkdirSync(dir, { recursive: true })
  } catch (err) {
    if (err.code !== 'EEXIST') throw err
  }
}

function moveTests(srcDir, testDir) {
  const files = readdirSync(srcDir)
  
  files.forEach(file => {
    const srcPath = join(srcDir, file)
    const stat = statSync(srcPath)
    
    if (stat.isDirectory()) {
      moveTests(srcPath, join(testDir, file))
    } else if (file.endsWith('.test.ts')) {
      const testPath = join(testDir, file)
      ensureDirectoryExists(dirname(testPath))
      
      let content = readFileSync(srcPath, 'utf8')
      
      // Update import paths
      content = content.replace(/from ['"]\.\.\/test\/helpers\/test-utils['"]/g, "from '../../test/helpers/test-utils'")
      content = content.replace(/from ['"]\.\.\/([^'"]+)['"]/g, "from '../../src/$1'")
      content = content.replace(/from ['"]\.\.\.\/([^'"]+)['"]/g, "from '../../../src/$1'")
      
      writeFileSync(testPath, content)
      console.log(`Moved ${srcPath} to ${testPath}`)
    }
  })
}

// Start migration
const baseDir = join(__dirname, '..')
moveTests(join(baseDir, 'src'), join(baseDir, 'test'))
