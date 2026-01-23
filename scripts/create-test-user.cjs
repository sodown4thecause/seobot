// Create test user via Clerk Backend API
const fs = require('fs');
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
            password: 'Xk9mP$2vB#nQrT5wL@z!2026',
            first_name: 'Test',
            last_name: 'User',
        }),
    });

    const data = await response.json();

    // Write response to file
    fs.writeFileSync('clerk-response.json', JSON.stringify(data, null, 2));

    if (!response.ok) {
        console.log('Error - check clerk-response.json');
    } else {
        console.log('SUCCESS - User ID: ' + data.id);
    }
}

createTestUser();
