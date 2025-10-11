// Quick test script to verify database connection
// Run with: node test-db-query.js

const { createClient } = require('@supabase/supabase-js');

// Get your project ID from localStorage or set it here
const PROJECT_ID = process.argv[2] || 'YOUR_PROJECT_ID_HERE';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';

async function testQuery() {
  console.log('🔍 Testing Supabase query...');
  console.log('📊 Project ID:', PROJECT_ID);
  console.log('🌐 Supabase URL:', supabaseUrl?.substring(0, 30) + '...');

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data, error } = await supabase
      .from('analysis_snapshots')
      .select('*')
      .eq('project_id', PROJECT_ID)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Query error:', error);
      return;
    }

    console.log('✅ Query successful!');
    console.log('📊 Data length:', data?.length || 0);

    if (data && data.length > 0) {
      const snapshot = data[0];
      console.log('📊 Snapshot keys:', Object.keys(snapshot));
      console.log('📊 snapshot_data keys:', snapshot.snapshot_data ? Object.keys(snapshot.snapshot_data) : 'NO DATA');
      console.log('📊 Has features:', !!snapshot.snapshot_data?.features);
      console.log('📊 Has insights:', !!snapshot.snapshot_data?.insights);

      if (snapshot.snapshot_data?.insights) {
        console.log('📊 Insights structure:', Object.keys(snapshot.snapshot_data.insights));
        console.log('📊 Insights count:', snapshot.snapshot_data.insights.insights?.length || 0);
      }

      console.log('\n📄 Full snapshot_data:');
      console.log(JSON.stringify(snapshot.snapshot_data, null, 2));
    } else {
      console.log('⚠️ No data found for project:', PROJECT_ID);
    }
  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

testQuery();
