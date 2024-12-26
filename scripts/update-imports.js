import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function updateImports(dir) {
  const files = readdirSync(dir)
  
  files.forEach(file => {
    const path = join(dir, file)
    const stat = statSync(path)
    
    if (stat.isDirectory()) {
      updateImports(path)
    } else if (file.endsWith('.ts') && !file.endsWith('.test.ts')) {
      let content = readFileSync(path, 'utf8')
      
      // Update import paths
      content = content.replace(/from ['"]\.\.\/([^'"]+)['"]/g, "from '../$1'")
      content = content.replace(/from ['"]\.\.\.\/([^'"]+)['"]/g, "from '../../$1'")
      
      writeFileSync(path, content)
      console.log(`Updated imports in ${path}`)
    }
  })
}

// Start migration
const baseDir = join(__dirname, '../src')
updateImports(baseDir)
