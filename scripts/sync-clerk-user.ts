// Manually sync user from Clerk to database
import { db, users } from '../lib/db/index.js';

const clerkUser = {
    id: "user_38Sl2icvXxFgar2LLs50JGMzh1b",
    first_name: "Test",
    last_name: "User",
    email: "jojimoh148@noihse.com",
    image_url: "https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18zMXdPNmp5ZWo0blM0aGJqamhKM29IOFNBMWsiLCJyaWQiOiJ1c2VyXzM4U2wyaWN2WHhGZ2FyMkxMczUwSkdNemgxYiIsImluaXRpYWxzIjoiVFUifQ"
};

async function syncUser() {
    try {
        const result = await db.insert(users).values({
            clerkId: clerkUser.id,
            email: clerkUser.email,
            firstName: clerkUser.first_name,
            lastName: clerkUser.last_name,
            imageUrl: clerkUser.image_url,
        }).onConflictDoNothing().returning();

        console.log('User synced successfully:', result);
    } catch (error) {
        console.error('Error syncing user:', error);
    }
    process.exit(0);
}

syncUser();
