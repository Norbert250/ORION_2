import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xogdrejbuuhkjxumccbm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvZ2RyZWpidXVoa2p4dW1jY2JtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5Nzg2MjMsImV4cCI6MjA3ODU1NDYyM30.TNlWn6_6aetc-MjzVHwW6ePUp-jsGl9_Y7-8T5wGq7c'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)