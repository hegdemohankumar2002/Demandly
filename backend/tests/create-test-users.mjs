import fetch from 'node-fetch';

const BASE = 'http://localhost:5000/api/v1';
const MASTER_API_KEY = 'your-super-secret-master-api-key';

async function request(method, path, body = null) {
  const url = `${BASE}${path}`;
  const headers = { 
    'Content-Type': 'application/json',
    'x-api-key': MASTER_API_KEY,
  };

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    return { status: res.status, data, ok: res.ok };
  } catch (err) {
    return { status: 0, data: null, ok: false, error: err.message };
  }
}

async function createUsers() {
  console.log('Creating test users...');
  
  // Create consumer user
  const consumerRes = await request('POST', '/auth/register', { 
    name: 'Aarav Consumer', 
    email: 'aarav@example.com', 
    password: 'test123', 
    role: 'consumer' 
  });
  console.log('Consumer:', consumerRes.ok ? '✅ Created' : '❌ Failed', consumerRes.data);
  
  // Create manufacturer user
  const mfgRes = await request('POST', '/auth/register', { 
    name: 'Rajesh Manufacturer', 
    email: 'rajesh@keralanaturals.com', 
    password: 'test123', 
    role: 'manufacturer' 
  });
  console.log('Manufacturer:', mfgRes.ok ? '✅ Created' : '❌ Failed', mfgRes.data);
  
  // Create admin user
  const adminRes = await request('POST', '/auth/register', { 
    name: 'Platform Admin', 
    email: 'admin@demandly.com', 
    password: 'admin123', 
    role: 'admin' 
  });
  console.log('Admin:', adminRes.ok ? '✅ Created' : '❌ Failed', adminRes.data);
}

createUsers();