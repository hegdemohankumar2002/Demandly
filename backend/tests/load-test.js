import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = 'http://localhost:5000/api/v1';

export const errorRate = new Rate('errors');
export const landingPageTrend = new Trend('landing_page_duration');
export const loginTrend = new Trend('login_duration');
export const authVerifyTrend = new Trend('auth_verify_duration');

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '30s', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.05'],
    errors: ['rate<0.05'],
    landing_page_duration: ['p(95)<500'],
    login_duration: ['p(95)<1000'],
  },
};

const MASTER_API_KEY = 'your-super-secret-master-api-key';

const headers = {
  'Content-Type': 'application/json',
  'x-api-key': MASTER_API_KEY,
};

const adminCredentials = {
  email: 'admin@demandly.com',
  password: 'admin123',
};

const consumerCredentials = {
  email: 'aarav@example.com',
  password: 'test123',
};

export function setup() {
  console.log('Starting load test for Demandly API');
  console.log(`Base URL: ${BASE_URL}`);
}

export default function () {
  testLandingPage();
  sleep(1);
  
  const token = testLogin();
  sleep(1);
  
  if (token) {
    testAuthVerify(token);
    sleep(1);
    testConsumerProducts(token);
    sleep(1);
    testNotifications(token);
  }
}

function testLandingPage() {
  const res = http.get(`${BASE_URL}/../../lb-health`, { headers });
  
  const success = check(res, {
    'landing page status is 200': (r) => r.status === 200,
    'landing page has products': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.products) && body.products.length > 0;
      } catch {
        return false;
      }
    },
  });
  
  errorRate.add(!success);
  landingPageTrend.add(res.timings.duration);
  
  if (!success) {
    console.log(`Landing page failed: ${res.status} - ${res.body}`);
  }
}

function testLogin() {
  const payload = JSON.stringify(adminCredentials);
  const res = http.post(`${BASE_URL}/auth/login`, payload, { headers });
  
  const success = check(res, {
    'login status is 200': (r) => r.status === 200,
    'login returns token or 2fa required': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.token || body.twoFactorRequired;
      } catch {
        return false;
      }
    },
  });
  
  errorRate.add(!success);
  loginTrend.add(res.timings.duration);
  
  if (!success) {
    console.log(`Login failed: ${res.status} - ${res.body}`);
    return null;
  }
  
  try {
    const body = JSON.parse(res.body);
    if (body.token) {
      return body.token;
    } else if (body.twoFactorRequired) {
      const verifyRes = http.post(
        `${BASE_URL}/auth/login/verify`,
        JSON.stringify({ email: adminCredentials.email, code: '888888' }),
        { headers }
      );
      
      const verifySuccess = check(verifyRes, {
        '2fa verify status is 200': (r) => r.status === 200,
        '2fa verify returns token': (r) => {
          try { return JSON.parse(r.body).token; } catch { return false; }
        },
      });
      
      errorRate.add(!verifySuccess);
      authVerifyTrend.add(verifyRes.timings.duration);
      
      if (verifySuccess) {
        return JSON.parse(verifyRes.body).token;
      }
    }
  } catch (e) {
    console.log(`Login parsing error: ${e}`);
  }
  
  return null;
}

function testAuthVerify(token) {
  const headersWithAuth = { ...headers, Authorization: `Bearer ${token}` };
  const res = http.get(`${BASE_URL}/admin/stats`, { headers: headersWithAuth });
  
  check(res, {
    'admin stats status is 200': (r) => r.status === 200,
  });
}

function testConsumerProducts(token) {
  const headersWithAuth = { ...headers, Authorization: `Bearer ${token}` };
  const res = http.get(`${BASE_URL}/consumer/products`, { headers: headersWithAuth });
  
  check(res, {
    'consumer products status is 200': (r) => r.status === 200,
    'consumer products returns array': (r) => {
      try { return Array.isArray(JSON.parse(r.body)); } catch { return false; }
    },
  });
}

function testNotifications(token) {
  const headersWithAuth = { ...headers, Authorization: `Bearer ${token}` };
  const res = http.get(`${BASE_URL}/notifications`, { headers: headersWithAuth });
  
  check(res, {
    'notifications status is 200': (r) => r.status === 200,
    'notifications returns array': (r) => {
      try { return Array.isArray(JSON.parse(r.body)); } catch { return false; }
    },
  });
}

export function teardown(data) {
  console.log('Load test completed');
}