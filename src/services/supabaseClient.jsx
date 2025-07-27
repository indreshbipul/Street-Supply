import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gnrgqpacesdzagrjekjn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducmdxcGFjZXNkemFncmpla2puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MTMwNDEsImV4cCI6MjA2OTA4OTA0MX0.hphHwx5N34ccHTp656mdQZzeHYRmxUYjsVeW1jSl34c';

export const supabase = createClient(supabaseUrl, supabaseKey);