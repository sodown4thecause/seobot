// Direct insert to Neon database using neon SDK
const { neon } = require('@neondatabase/serverless');

// Use the connection string directly
const sql = neon(process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_VW9cQ1rhuGYD@ep-soft-credit-a4y8tmov-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require');

const clerkUser = {
    clerk_id: "user_38Sl2icvXxFgar2LLs50JGMzh1b",
    first_name: "Test",
    last_name: "User",
    email: "jojimoh148@noihse.com",
    image_url: "https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18zMXdPNmp5ZWo0blM0aGJqamhKM29IOFNBMWsiLCJyaWQiOiJ1c2VyXzM4U2wyaWN2WHhGZ2FyMkxMczUwSkdNemgxYiIsImluaXRpYWxzIjoiVFUifQ"
};

async function syncUser() {
    try {
        const result = await sql`
      INSERT INTO users (clerk_id, email, first_name, last_name, image_url)
      VALUES (${clerkUser.clerk_id}, ${clerkUser.email}, ${clerkUser.first_name}, ${clerkUser.last_name}, ${clerkUser.image_url})
      ON CONFLICT (clerk_id) DO NOTHING
      RETURNING *
    `;

        console.log('User synced successfully:', result);
    } catch (error) {
        console.error('Error syncing user:', error.message);
    }
}

syncUser();
