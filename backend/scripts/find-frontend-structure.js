#!/usr/bin/env node

const fs = require("fs")
const path = require("path")

console.log("🔍 Finding your frontend structure...")
console.log("=====================================")

// Function to check if a directory exists
function dirExists(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory()
  } catch (error) {
    return false
  }
}

// Function to check if a file exists
function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile()
  } catch (error) {
    return false
  }
}

// Get current directory
const currentDir = process.cwd()
console.log(`📁 Current directory: ${currentDir}`)

// Check for common frontend structures
const structures = [
  {
    name: "Next.js App Router",
    check: () => dirExists("app") && fileExists("next.config.js"),
    resultPath: "app/payment/result/page.js",
    description: "Modern Next.js with App Router",
  },
  {
    name: "Next.js Pages Router",
    check: () => dirExists("pages") && fileExists("next.config.js"),
    resultPath: "pages/payment/result.js",
    description: "Traditional Next.js with Pages Router",
  },
  {
    name: "React with src folder",
    check: () => dirExists("src") && fileExists("package.json"),
    resultPath: "src/pages/PaymentResult.js",
    description: "React app with src directory",
  },
  {
    name: "React without src folder",
    check: () => dirExists("components") && fileExists("package.json") && !dirExists("src"),
    resultPath: "pages/PaymentResult.js",
    description: "React app in root directory",
  },
  {
    name: "Vue.js",
    check: () => dirExists("src") && fileExists("vue.config.js"),
    resultPath: "src/views/PaymentResult.vue",
    description: "Vue.js application",
  },
]

console.log("\n🔍 Checking for frontend frameworks...\n")

let detectedStructure = null

for (const structure of structures) {
  const isMatch = structure.check()
  console.log(`${isMatch ? "✅" : "❌"} ${structure.name}: ${structure.description}`)

  if (isMatch && !detectedStructure) {
    detectedStructure = structure
  }
}

console.log("\n📋 Directory contents:")
try {
  const contents = fs.readdirSync(currentDir)
  contents.forEach((item) => {
    const itemPath = path.join(currentDir, item)
    const isDir = dirExists(itemPath)
    console.log(`${isDir ? "📁" : "📄"} ${item}`)
  })
} catch (error) {
  console.log("❌ Could not read directory contents")
}

if (detectedStructure) {
  console.log(`\n🎯 DETECTED STRUCTURE: ${detectedStructure.name}`)
  console.log(`📍 Create payment result page at: ${detectedStructure.resultPath}`)

  // Check if the directory structure exists
  const resultDir = path.dirname(detectedStructure.resultPath)
  if (!dirExists(resultDir)) {
    console.log(`\n⚠️  Directory doesn't exist: ${resultDir}`)
    console.log(`📝 You'll need to create the directory first:`)
    console.log(`   mkdir -p ${resultDir}`)
  }

  console.log(`\n📋 NEXT STEPS:`)
  console.log(`1. Create the directory: mkdir -p ${resultDir}`)
  console.log(`2. Create the file: ${detectedStructure.resultPath}`)
  console.log(`3. Copy the appropriate code from the project above`)
  console.log(`4. Update your EmbeddedCheckout component`)
  console.log(`5. Restart your frontend server`)
} else {
  console.log("\n❌ Could not detect frontend structure automatically")
  console.log("\n📋 MANUAL STEPS:")
  console.log("1. Tell me what files/folders you see in your frontend project")
  console.log("2. Look for: package.json, next.config.js, src/, pages/, app/, components/")
  console.log("3. Share the structure so I can help you place the files correctly")
}

console.log("\n🔍 Package.json check:")
if (fileExists("package.json")) {
  try {
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"))
    console.log("✅ Found package.json")
    console.log(`📦 Project name: ${packageJson.name || "Unknown"}`)

    if (packageJson.dependencies) {
      const deps = Object.keys(packageJson.dependencies)
      console.log("📚 Key dependencies:")

      if (deps.includes("next")) {
        console.log("  ✅ Next.js detected")
      }
      if (deps.includes("react")) {
        console.log("  ✅ React detected")
      }
      if (deps.includes("vue")) {
        console.log("  ✅ Vue.js detected")
      }
      if (deps.includes("react-router-dom")) {
        console.log("  ✅ React Router detected")
      }
    }
  } catch (error) {
    console.log("❌ Could not parse package.json")
  }
} else {
  console.log("❌ No package.json found")
}

console.log("\n💡 If you're still unsure, run this command in your frontend directory:")
console.log("   ls -la")
console.log("   And share the output with me!")
