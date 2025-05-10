
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Admin key
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase URL or Service Role Key');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create demo users
    const demoUsers = [
      {
        email: 'admin@example.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin',
      },
      {
        email: 'staff@example.com',
        password: 'staff123',
        name: 'Staff Member',
        role: 'staff',
      },
      {
        email: 'student@example.com',
        password: 'student123',
        name: 'John Student',
        role: 'student',
      }
    ];
    
    const results = [];
    
    for (const user of demoUsers) {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('name', user.name)
        .single();
      
      if (existingUser) {
        results.push(`User ${user.name} already exists`);
        continue;
      }
      
      // Create the user with Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          role: user.role
        }
      });
      
      if (authError) {
        results.push(`Error creating ${user.name}: ${authError.message}`);
        continue;
      }
      
      results.push(`Created user ${user.name} with role ${user.role}`);
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        },
        status: 200 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        },
        status: 400 
      }
    );
  }
});
