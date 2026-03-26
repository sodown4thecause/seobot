import { registerOTel } from '@vercel/otel';
import { DrizzleInstrumentation } from '@kubiks/otel-drizzle';

export function register() {
  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME || 'seo-platform',
    instrumentations: [
      new DrizzleInstrumentation({
        // Capture SQL queries
        captureQuery: true,
        // Maximum length of SQL query text to capture (0 = unlimited)
        maxQueryLength: 1000,
      }),
    ],
  });
}
