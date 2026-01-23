// Create test user via Clerk Backend API
const CLERK_SECRET_KEY = 'sk_test_mjI1ojL7AeoSbbowErJOz9jBb8d8sEX6GGLttpc8xy';

async function createTestUser() {
  const response = await fetch('https://api.clerk.com/v1/users', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email_address: ['jojimoh148@noihse.com'],
      password: 'TestPassword123!',
      first_name: 'Test',
      last_name: 'User',
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error('Error creating user:', JSON.stringify(data, null, 2));
  } else {
    console.log('User created successfully!');
    console.log(JSON.stringify(data, null, 2));
  }
}

createTestUser();
