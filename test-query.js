const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zddfiafxfbuoznwtdcdq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZGZpYWZ4ZmJ1b3pud3RkY2RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTYwMjk1MSwiZXhwIjoyMDkxMTc4OTUxfQ.F-E7064D1d-l5--abZLmWplCUq63iK0sRugUxYOUOF8'
);

async function test() {
  const { data, error } = await supabase
    .from('trips')
    .select(`
      id, slug,
      boats (
        id, boat_name, boat_type,
        marina_name, marina_address, slip_number,
        parking_instructions, operating_area, lat, lng,
        captain_name, captain_photo_url, captain_bio,
        captain_license, captain_license_type,
        captain_languages, captain_years_exp,
        captain_trip_count, captain_rating,
        captain_certifications,
        what_to_bring, what_not_to_bring,
        house_rules, prohibited_items,
        custom_dos, custom_donts, custom_rule_sections,
        safety_points, waiver_text, cancellation_policy,
        selected_equipment, selected_amenities,
        specific_field_values, onboard_info,
        boat_photos (
          id, public_url, display_order, is_cover
        ),
        addons (
          id, name, description, emoji,
          price_cents, max_quantity, is_available, sort_order
        )
      )
    `)
    .eq('slug', 'f307cbac5bfb4b54817c14')
    .order('display_order', {
      referencedTable: 'boats.boat_photos',
      ascending: true,
    })
    .order('sort_order', {
      referencedTable: 'boats.addons',
      ascending: true,
    })
    .single();
    
    console.log(JSON.stringify(error, null, 2));
}
test();
