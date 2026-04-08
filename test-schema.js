const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zddfiafxfbuoznwtdcdq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZGZpYWZ4ZmJ1b3pud3RkY2RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTYwMjk1MSwiZXhwIjoyMDkxMTc4OTUxfQ.F-E7064D1d-l5--abZLmWplCUq63iK0sRugUxYOUOF8'
);

async function test() {
  const { data, error } = await supabase
    .from('boats')
    .select('*')
    .limit(1);
    
    if (error) console.error(error);
    else console.log(Object.keys(data[0] || {}));
}
test();
