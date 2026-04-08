const { createClient } = require('@supabase/supabase-js');

// We can read directly from the user's .env.local file
require('dotenv').config({ path: '/Users/farabibinimran/dockpass/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data: guests, error } = await supabase
    .from('guests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);
    
  if (error) {
    console.error('Error fetching guests:', error);
    return;
  }
  
  console.log("=== Recent Guests in DB ===");
  guests.forEach((g, i) => {
    console.log(`\nGuest ${i+1}:`);
    console.log(`- ID: ${g.id}`);
    console.log(`- Name: ${g.full_name}`);
    console.log(`- Trip ID: ${g.trip_id}`);
    console.log(`- Waiver Signed: ${g.waiver_signed}`);
    console.log(`- Signature: ${g.waiver_signature_text}`);
    console.log(`- Approval Status: ${g.approval_status}`);
    console.log(`- Created At: ${g.created_at}`);
  });
}

check();
