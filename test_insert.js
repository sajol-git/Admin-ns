const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('profiles').insert([{ id: '123e4567-e89b-12d3-a456-426614174000', name: 'Test User', role: 'user' }]);
  console.log(error);
}
run();
