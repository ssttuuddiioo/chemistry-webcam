const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Setting up environment variables for the application...');
console.log('You will need a Replicate API token. Get one at: https://replicate.com/account/api-tokens');

rl.question('Please enter your Replicate API token: ', (token) => {
  if (!token || token.trim() === '') {
    console.log('No token entered. .env file not created.');
    rl.close();
    return;
  }

  const envContent = `# Replicate API token
REPLICATE_API_TOKEN=${token.trim()}

# Note: After modifying this file, restart the server for changes to take effect
`;

  try {
    fs.writeFileSync('.env', envContent);
    console.log('.env file created successfully!');
    console.log('You can now start the server with: npm run dev');
  } catch (err) {
    console.error('Error creating .env file:', err);
  }

  rl.close();
}); 