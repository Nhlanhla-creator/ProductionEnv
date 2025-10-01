console.log("🔧 FIXING AMOUNT ISSUE IN FRONTEND...\n")

const fs = require("fs")
const path = require("path")

// This script will help identify where the amount should be passed to EmbeddedCheckout

console.log("📁 Looking for frontend files that create checkout...")

// Common frontend file locations
const possiblePaths = ["../frontend/src", "../src", "../client/src", "../app/src", "../frontend", "../client", "../app"]

let frontendPath = null

for (const testPath of possiblePaths) {
  const fullPath = path.join(__dirname, testPath)
  if (fs.existsSync(fullPath)) {
    console.log("✅ Found frontend directory:", fullPath)
    frontendPath = fullPath
    break
  }
}

if (!frontendPath) {
  console.log("❌ Could not find frontend directory")
  console.log("Please manually check your frontend code for:")
  console.log("1. Where EmbeddedCheckout component is used")
  console.log("2. Make sure amount prop is passed to EmbeddedCheckout")
  console.log(
    '3. Example: <EmbeddedCheckout checkoutId={id} amount={4500} paymentType="one_time" toolName="Digital Foundation" />',
  )
  process.exit(1)
}

// Search for files that might use EmbeddedCheckout
function searchFiles(dir, pattern) {
  const results = []

  try {
    const files = fs.readdirSync(dir)

    for (const file of files) {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory() && !file.startsWith(".") && file !== "node_modules") {
        results.push(...searchFiles(filePath, pattern))
      } else if (file.endsWith(".js") || file.endsWith(".jsx") || file.endsWith(".ts") || file.endsWith(".tsx")) {
        try {
          const content = fs.readFileSync(filePath, "utf8")
          if (content.includes(pattern)) {
            results.push({
              file: filePath,
              content: content,
            })
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }
  } catch (error) {
    // Skip directories that can't be read
  }

  return results
}

console.log("🔍 Searching for EmbeddedCheckout usage...")
const checkoutFiles = searchFiles(frontendPath, "EmbeddedCheckout")

if (checkoutFiles.length === 0) {
  console.log("❌ No files found using EmbeddedCheckout")
  console.log("Please check your frontend code manually")
  process.exit(1)
}

console.log(`✅ Found ${checkoutFiles.length} files using EmbeddedCheckout:`)

checkoutFiles.forEach((result, index) => {
  console.log(`\n📄 File ${index + 1}: ${result.file}`)

  // Look for EmbeddedCheckout usage
  const lines = result.content.split("\n")
  lines.forEach((line, lineIndex) => {
    if (line.includes("EmbeddedCheckout") && (line.includes("<") || line.includes("import"))) {
      console.log(`   Line ${lineIndex + 1}: ${line.trim()}`)
    }
  })

  // Check if amount prop is being passed
  const hasAmountProp = result.content.includes("amount=") || result.content.includes("amount:")
  console.log(`   Amount prop passed: ${hasAmountProp ? "✅ Yes" : "❌ No"}`)

  if (!hasAmountProp) {
    console.log("   🔧 FIX NEEDED: Add amount prop to EmbeddedCheckout")
    console.log("   Example: <EmbeddedCheckout checkoutId={checkoutId} amount={amount} ... />")
  }
})

// Look for checkout creation code
console.log("\n🔍 Searching for checkout creation code...")
const createCheckoutFiles = searchFiles(frontendPath, "create-checkout")

if (createCheckoutFiles.length > 0) {
  console.log(`✅ Found ${createCheckoutFiles.length} files with checkout creation:`)

  createCheckoutFiles.forEach((result, index) => {
    console.log(`\n📄 File ${index + 1}: ${result.file}`)

    // Look for amount usage
    const lines = result.content.split("\n")
    lines.forEach((line, lineIndex) => {
      if (line.includes("amount") && (line.includes(":") || line.includes("="))) {
        console.log(`   Line ${lineIndex + 1}: ${line.trim()}`)
      }
    })
  })
}

// Generate fix suggestions
console.log("\n🔧 FIX SUGGESTIONS:")
console.log("1. In your checkout creation code, make sure you capture the amount:")
console.log("   const amount = 4500; // or get from your pricing")
console.log("")
console.log("2. Pass the amount to EmbeddedCheckout:")
console.log("   <EmbeddedCheckout")
console.log("     checkoutId={checkoutId}")
console.log("     amount={amount}")
console.log('     paymentType="one_time"')
console.log('     toolName="Digital Foundation"')
console.log("     onCompleted={handlePaymentComplete}")
console.log("   />")
console.log("")
console.log("3. Make sure the amount matches what you sent to create-checkout")
console.log("")
console.log("4. After making changes, restart your frontend server")

console.log("\n✅ Analysis complete!")
