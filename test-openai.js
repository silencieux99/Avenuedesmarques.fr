const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

async function test() {
    try {
        console.log('--- TEST OPENAI KEY ---');
        // 1. Load env manually
        const envPath = path.resolve(__dirname, '.env.local');
        if (!fs.existsSync(envPath)) {
            console.error('❌ .env.local file not found!');
            return;
        }
        const envContent = fs.readFileSync(envPath, 'utf8');
        // Simple regex to find the key
        const match = envContent.match(/^OPENAI_API_KEY=["']?([^"'\n]+)["']?/m);
        const apiKey = match ? match[1].trim() : null;

        if (!apiKey) {
            console.error('❌ OPENAI_API_KEY not found in .env.local');
            console.log('Content of .env.local (hidden keys):');
            console.log(envContent.replace(/=(.*)/g, '= *****'));
            return;
        }
        console.log('✅ API Key found:', apiKey.slice(0, 7) + '...' + apiKey.slice(-4));

        // 2. Init OpenAI
        console.log('Initializing OpenAI client...');
        const openai = new OpenAI({ apiKey });

        // 3. Test call
        console.log('Sending test request to OpenAI (gpt-3.5-turbo)...');
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: "Réponds juste par 'OK, la clé fonctionne !'." }],
            model: "gpt-3.5-turbo",
            max_tokens: 20
        });

        console.log('✅ Réponse reçue :', completion.choices[0].message.content);
    } catch (error) {
        console.error('❌ Erreur :', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

test();
