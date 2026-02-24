/**
 * Seed script — creates test accounts for all 4 roles
 * Run: node scripts/seed-test-users.js
 */
const bcrypt = require('bcryptjs')
const { createClient } = require('@supabase/supabase-js')

// Uses your actual Supabase credentials
const SUPABASE_URL = 'https://vhufyubdpsvkdbjpqetb.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZodWZ5dWJkcHN2a2RianBxZXRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODcxOTI3NiwiZXhwIjoyMDg0Mjk1Mjc2fQ.hbmV3DiQz1-9DCiK_hbPaP6r4kLCUWKT33xwM6p4feU'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const TEST_USERS = [
  {
    email: 'admin@curryhouse.test',
    password: 'Admin@1234',
    fullName: 'Admin User',
    role: 'admin',
    phone: '080-0000-0001',
  },
  {
    email: 'staff@curryhouse.test',
    password: 'Staff@1234',
    fullName: 'Delivery Staff',
    role: 'staff',
    phone: '080-0000-0002',
  },
  {
    email: 'reception@curryhouse.test',
    password: 'Reception@1234',
    fullName: 'Reception Staff',
    role: 'reception',
    phone: '080-0000-0003',
  },
  {
    email: 'kitchen@curryhouse.test',
    password: 'Kitchen@1234',
    fullName: 'Kitchen Staff',
    role: 'kitchen',
    phone: '080-0000-0004',
  },
  {
    email: 'customer@curryhouse.test',
    password: 'Customer@1234',
    fullName: 'Test Customer',
    role: 'customer',
    phone: '080-0000-0005',
  },
]

async function seedUsers() {
  console.log('🌱 Seeding test users...\n')

  for (const user of TEST_USERS) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('email', user.email)
      .maybeSingle()

    if (existing) {
      console.log(`⚠️  Already exists: ${user.email} (role: ${existing.role}) — skipping`)
      continue
    }

    const passwordHash = await bcrypt.hash(user.password, 12)

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        email: user.email,
        full_name: user.fullName,
        password_hash: passwordHash,
        role: user.role,
        phone: user.phone,
        is_active: true,
      })
      .select('id, email, role')
      .single()

    if (error) {
      console.error(`❌ Failed ${user.email}:`, error.message)
    } else {
      console.log(
        `✅ Created: ${user.email.padEnd(32)} role: ${user.role.padEnd(12)} pass: ${user.password}`
      )
    }
  }

  console.log('\n🎉 Done! Here are your test credentials:\n')
  console.log('┌──────────────────────────────────────┬───────────────┬──────────────────┐')
  console.log('│ Email                                │ Role          │ Password         │')
  console.log('├──────────────────────────────────────┼───────────────┼──────────────────┤')
  for (const u of TEST_USERS) {
    console.log(
      `│ ${u.email.padEnd(36)} │ ${u.role.padEnd(13)} │ ${u.password.padEnd(16)} │`
    )
  }
  console.log('└──────────────────────────────────────┴───────────────┴──────────────────┘')
  console.log('\n📍 Login URLs:')
  console.log('  Admin/Staff/Reception/Kitchen → http://localhost:3000/admin/login')
  console.log('  Customer                      → http://localhost:3000/auth/login')
}

seedUsers().catch(console.error)
