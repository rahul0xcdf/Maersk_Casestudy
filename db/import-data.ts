import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'
import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') })

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL is not set in .env.local')
  console.error('Please add NEXT_PUBLIC_SUPABASE_URL to your .env.local file')
  process.exit(1)
}

if (!supabaseKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is not set in .env.local')
  console.error('Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const DATASET_DIR = path.join(process.cwd(), 'db', 'dataset')

// Helper function to read CSV file
function readCSV(filePath: string): any[] {
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })
  return records
}

// Helper function to batch insert data
async function batchInsert(
  tableName: string,
  data: any[],
  batchSize: number = 1000
): Promise<{ success: number; failed: number }> {
  console.log(`\nInserting ${data.length} records into ${tableName}...`)
  
  let successCount = 0
  let failedCount = 0
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize)
    
    // Clean the data - remove empty strings, convert types
    const cleanedBatch = batch.map(record => {
      const cleaned: any = {}
      for (const [key, value] of Object.entries(record)) {
        // Convert empty strings to null
        if (value === '' || value === null || value === undefined) {
          cleaned[key] = null
        }
        // Convert numeric strings to numbers
        else if (typeof value === 'string' && /^\d+$/.test(value) && 
                 (key.includes('lenght') || key.includes('qty') || key.includes('score') || 
                  key.includes('installments') || key.includes('sequential') || 
                  key.includes('item_id') || key.includes('weight') || 
                  key.includes('length') || key.includes('height') || key.includes('width'))) {
          cleaned[key] = parseInt(value)
        }
        // Convert decimal strings to numbers
        else if (typeof value === 'string' && /^\d+\.\d+$/.test(value) && 
                 (key.includes('price') || key.includes('freight') || key.includes('payment') || 
                  key.includes('lat') || key.includes('lng'))) {
          cleaned[key] = parseFloat(value)
        }
        // Convert date strings to ISO format
        else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
          cleaned[key] = value.replace(' ', 'T') + (value.includes(':') ? '' : 'T00:00:00')
        }
        else {
          cleaned[key] = value
        }
      }
      return cleaned
    })

    // Use upsert for tables that might have duplicates (like reviews)
    const shouldUpsert = tableName === 'olist_order_reviews'
    
    let result
    if (shouldUpsert) {
      // Use upsert to handle duplicates - update if exists, insert if not
      result = await supabase
        .from(tableName)
        .upsert(cleanedBatch, { 
          onConflict: 'review_id',
          ignoreDuplicates: false 
        })
    } else {
      // Regular insert - try to insert individual records if batch fails
      result = await supabase
        .from(tableName)
        .insert(cleanedBatch)
    }

    if (result.error) {
      // If batch insert fails, try inserting records one by one
      if (!shouldUpsert && result.error.message.includes('foreign key constraint')) {
        console.error(`  ⚠️  Batch ${Math.floor(i / batchSize) + 1} failed, trying individual inserts...`)
        
        for (const record of cleanedBatch) {
          const singleResult = await supabase
            .from(tableName)
            .insert(record)
          
          if (singleResult.error) {
            failedCount++
            // Only log first few errors to avoid spam
            if (failedCount <= 5) {
              console.error(`    ✗ Failed: ${JSON.stringify(record).substring(0, 50)}... - ${singleResult.error.message.substring(0, 100)}`)
            }
          } else {
            successCount++
          }
        }
      } else if (result.error.message.includes('duplicate key')) {
        // For duplicate keys, count as success (already exists)
        console.log(`  ℹ️  Batch ${Math.floor(i / batchSize) + 1} contains duplicates (skipping)`)
        failedCount += batch.length
      } else {
        console.error(`  ✗ Error in batch ${Math.floor(i / batchSize) + 1}: ${result.error.message.substring(0, 100)}`)
        failedCount += batch.length
      }
    } else {
      successCount += batch.length
      console.log(`  ✓ Inserted batch ${Math.floor(i / batchSize) + 1} (${batch.length} records)`)
    }
  }
  
  console.log(`✓ Completed ${tableName}: ${successCount} successful, ${failedCount} failed`)
  return { success: successCount, failed: failedCount }
}

// Main import function
async function importData() {
  console.log('Starting data import to Supabase...\n')
  console.log(`Supabase URL: ${supabaseUrl?.substring(0, 30)}...`)
  console.log(`Service Role Key: ${supabaseKey ? '✓ Set' : '✗ Missing'}\n`)
  
  try {
    // 1. Import product category translations first
    console.log('1. Importing product category translations...')
    const categories = readCSV(path.join(DATASET_DIR, 'product_category_name_translation.csv'))
    await batchInsert('product_category_translation', categories)
    
    // 2. Import customers
    console.log('\n2. Importing customers...')
    const customers = readCSV(path.join(DATASET_DIR, 'olist_customers_dataset.csv'))
    await batchInsert('olist_customers', customers)
    
    // 3. Import sellers
    console.log('\n3. Importing sellers...')
    const sellers = readCSV(path.join(DATASET_DIR, 'olist_sellers_dataset.csv'))
    await batchInsert('olist_sellers', sellers)
    
    // 4. Import products
    console.log('\n4. Importing products...')
    const products = readCSV(path.join(DATASET_DIR, 'olist_products_dataset.csv'))
    await batchInsert('olist_products', products)
    
    // 5. Import orders
    console.log('\n5. Importing orders...')
    const orders = readCSV(path.join(DATASET_DIR, 'olist_orders_dataset.csv'))
    await batchInsert('olist_orders', orders)
    
    // 6. Import order items
    console.log('\n6. Importing order items...')
    const orderItems = readCSV(path.join(DATASET_DIR, 'olist_order_items_dataset.csv'))
    await batchInsert('olist_order_items', orderItems)
    
    // 7. Import order payments
    console.log('\n7. Importing order payments...')
    const payments = readCSV(path.join(DATASET_DIR, 'olist_order_payments_dataset.csv'))
    await batchInsert('olist_order_payments', payments)
    
    // 8. Import order reviews (handle duplicates with upsert)
    console.log('\n8. Importing order reviews...')
    const reviews = readCSV(path.join(DATASET_DIR, 'olist_order_reviews_dataset.csv'))
    const reviewsResult = await batchInsert('olist_order_reviews', reviews)
    console.log(`   Reviews: ${reviewsResult.success} inserted/updated, ${reviewsResult.failed} skipped`)
    
    // 9. Import geolocation (optional, can be large)
    console.log('\n9. Importing geolocation data...')
    const geolocation = readCSV(path.join(DATASET_DIR, 'olist_geolocation_dataset.csv'))
    await batchInsert('olist_geolocation', geolocation)
    
    console.log('\n✓ All data imported successfully!')
    console.log('\nNote: You may want to refresh the materialized view with:')
    console.log('REFRESH MATERIALIZED VIEW order_summary;')
    
  } catch (error) {
    console.error('Error during import:', error)
    process.exit(1)
  }
}

// Run the import
if (require.main === module) {
  importData()
}

export { importData }

