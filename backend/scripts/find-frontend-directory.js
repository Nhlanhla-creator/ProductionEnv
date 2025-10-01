#!/usr/bin/env node

const fs = require("fs")
const path = require("path")

console.log("🔍 Finding your frontend directory...")
console.log("====================================")

const currentDir = process.cwd()
console.log(`📁 Current directory: ${currentDir}`)

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

// Check if we're currently in backend
const isBackend = fileExists("package.json") && (dirExists("routes") || dirExists("services") || dirExists("scripts"))

if (isBackend) {
  console.log("✅ You're currently in the BACKEND directory")
  console.log("📋 You need to navigate to your FRONTEND directory")

  // Look for common frontend directory names
  const frontendDirs = ["frontend", "client", "web", "ui", "app", "website"]

  console.log("\n🔍 Looking for frontend directories...")

  // Check parent directory
  const parentDir = path.dirname(currentDir)
  console.log(`📁 Checking parent directory: ${parentDir}`)

  const foundFrontend = []

  // Check sibling directories
  try {
    const siblings = fs.readdirSync(parentDir)
    for (const sibling of siblings) {
      const siblingPath = path.join(parentDir, sibling)
      if (dirExists(siblingPath) && sibling !== path.basename(currentDir)) {
        // Check if it's a frontend directory
        const hasPackageJson = fileExists(path.join(siblingPath, "package.json"))
        const hasNextConfig = fileExists(path.join(siblingPath, "next.config.js"))
        const hasAppDir = dirExists(path.join(siblingPath, "app"))
        const hasPagesDir = dirExists(path.join(siblingPath, "pages"))
        const hasSrcDir = dirExists(path.join(siblingPath, "src"))
        const hasComponentsDir = dirExists(path.join(siblingPath, "components"))

        if (hasPackageJson && (hasNextConfig || hasAppDir || hasPagesDir || hasSrcDir || hasComponentsDir)) {
          foundFrontend.push({
            name: sibling,
            path: siblingPath,
            type: hasNextConfig ? (hasAppDir ? "Next.js App Router" : "Next.js Pages Router") : "React",
          })
        }
      }
    }
  } catch (error) {
    console.log("❌ Could not read parent directory")
  }

  // Check current directory siblings
  try {
    const currentSiblings = fs.readdirSync(currentDir)
    for (const item of currentSiblings) {
      if (frontendDirs.includes(item.toLowerCase())) {
        const itemPath = path.join(currentDir, item)
        if (dirExists(itemPath)) {
          const hasPackageJson = fileExists(path.join(itemPath, "package.json"))
          const hasNextConfig = fileExists(path.join(itemPath, "next.config.js"))
          const hasAppDir = dirExists(path.join(itemPath, "app"))
          const hasPagesDir = dirExists(path.join(itemPath, "pages"))

          if (hasPackageJson) {
            foundFrontend.push({
              name: item,
              path: itemPath,
              type: hasNextConfig ? (hasAppDir ? "Next.js App Router" : "Next.js Pages Router") : "React",
            })
          }
        }
      }
    }
  } catch (error) {
    console.log("❌ Could not read current directory")
  }

  if (foundFrontend.length > 0) {
    console.log("\n✅ Found potential frontend directories:")
    foundFrontend.forEach((frontend, index) => {
      console.log(`${index + 1}. ${frontend.name} (${frontend.type})`)
      console.log(`   Path: ${frontend.path}`)
    })

    console.log("\n📋 NEXT STEPS:")
    console.log("1. Navigate to your frontend directory:")
    foundFrontend.forEach((frontend, index) => {
      console.log(`   cd "${frontend.path}"`)
    })
    console.log("2. Create the payment result page in the correct location")
    console.log("3. Update your EmbeddedCheckout component")
  } else {
    console.log("\n❌ No frontend directories found automatically")
    console.log("\n📋 MANUAL STEPS:")
    console.log("1. Find your frontend project directory (it should have package.json with React/Next.js)")
    console.log("2. Navigate to that directory")
    console.log("3. Run the setup script from there")
  }
} else {
  console.log("🔍 Checking if this is a frontend directory...")

  const hasPackageJson = fileExists("package.json")
  const hasNextConfig = fileExists("next.config.js")
  const hasAppDir = dirExists("app")
  const hasPagesDir = dirExists("pages")
  const hasSrcDir = dirExists("src")
  const hasComponentsDir = dirExists("components")

  if (hasPackageJson && (hasNextConfig || hasAppDir || hasPagesDir || hasSrcDir || hasComponentsDir)) {
    console.log("✅ You're in a FRONTEND directory!")

    if (hasNextConfig && hasAppDir) {
      console.log("📱 Detected: Next.js App Router")
      console.log("📍 Create payment result page at: app/payment/result/page.js")
    } else if (hasNextConfig && hasPagesDir) {
      console.log("📱 Detected: Next.js Pages Router")
      console.log("📍 Create payment result page at: pages/payment/result.js")
    } else if (hasSrcDir) {
      console.log("⚛️  Detected: React with src directory")
      console.log("📍 Create payment result page at: src/pages/PaymentResult.js")
    } else {
      console.log("⚛️  Detected: React application")
      console.log("📍 Create payment result page at: pages/PaymentResult.js")
    }

    console.log("\n📋 NEXT STEPS:")
    console.log("1. Run the setup script: bash scripts/setup-frontend-fix.sh")
    console.log("2. Or create the payment result page manually")
    console.log("3. Update your EmbeddedCheckout component")
  } else {
    console.log("❌ This doesn't appear to be a frontend directory")
    console.log("📋 Look for a directory with:")
    console.log("   - package.json")
    console.log("   - React or Next.js dependencies")
    console.log("   - app/, pages/, src/, or components/ folders")
  }
}

console.log("\n💡 SUMMARY:")
console.log("- Backend: Node.js/Express server (where you run scripts)")
console.log("- Frontend: React/Next.js app (where users visit your website)")
console.log("- The payment result page goes in the FRONTEND")
console.log("- The app/ folder is part of Next.js App Router (FRONTEND)")
