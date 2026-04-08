require('dotenv').config({ path: 'apps/web/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase
    .from('trips')
    .select(`
      id, slug,
      boats (
        id, boat_name,
        boat_photos (
          id, public_url, display_order
        )
      )
    `)
    .eq('slug', 'f307cbac5bfb4b54817c14')
    .order('display_order', {
      referencedTable: 'boats.boat_photos',
      ascending: true,
    })
    .single();
    
    console.log("Error:", error);
    console.log("Data:", data);
}
test();
