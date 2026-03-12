// Global Frontend Configuration
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

window.API_BASE_URL = isLocal ? 'http://localhost:5005' : 'https://backend-chi-eight-58.vercel.app';

window.SUPABASE_URL = 'https://vqodcsheoqakhlygduvh.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxb2Rjc2hlb3Fha2hseWdkdXZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjAxMjksImV4cCI6MjA4ODc5NjEyOX0.Cas2EsoQh7NIbGJgPczYCFx30o8n_1Mb_DkqJWI85as';

if (window.supabase) {
    window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
}
