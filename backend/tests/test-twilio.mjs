import twilio from 'twilio';
import { readFileSync } from 'fs';

// Load .env manually
const envContent = readFileSync('.env', 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^(\w+)=["']?(.+?)["']?\s*$/);
  if (match) process.env[match[1]] = match[2];
}

const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_FROM_NUMBER;

console.log('Credentials loaded:');
console.log('Account SID:', sid);
console.log('From Number:', from);
console.log('Auth Token Length:', token ? token.length : 0);

if (!sid || !token) {
  console.error('Error: TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN missing in .env');
  process.exit(1);
}

const client = twilio(sid, token);

async function test() {
  try {
    console.log('\nFetching account details...');
    const account = await client.api.v2010.accounts(sid).fetch();
    console.log('Account Name:', account.friendlyName);
    console.log('Account Status:', account.status);

    console.log('\nFetching active phone numbers...');
    const numbers = await client.incomingPhoneNumbers.list({ limit: 10 });
    console.log(`Found ${numbers.length} active number(s):`);
    for (const num of numbers) {
      console.log(`- ${num.phoneNumber} (${num.friendlyName})`);
    }

    if (from) {
      console.log(`\nAttempting to send a test message to a placeholder (+919483197470) from ${from}...`);
      const message = await client.messages.create({
        body: 'Demandly Twilio credentials test',
        from: from,
        to: '+919483197470'
      });
      console.log('Success! Message SID:', message.sid);
    }
  } catch (error) {
    console.error('\n❌ Twilio API Error:');
    console.error(error);
  }
}

test();
