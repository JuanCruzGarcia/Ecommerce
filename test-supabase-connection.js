
const supabaseUrl = 'https://ohphconwnwhyksrtrjdn.supabase.co';

console.log('Testing connection to:', supabaseUrl);

fetch(supabaseUrl)
    .then(res => {
        console.log('Status:', res.status);
        console.log('Connection successful!');
    })
    .catch(err => {
        console.error('Connection failed:', err.message);
        if (err.cause) console.error('Cause:', err.cause);
    });
