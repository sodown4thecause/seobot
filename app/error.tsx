"use client";

import { useEffect } from "react";
import { captureClientException } from "@/components/providers/analytics-provider";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Error boundary caught:", error);
        captureClientException(error, {
            boundary: "app",
            digest: error.digest,
        });
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center p-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">Something went wrong!</h2>
                <p className="text-muted-foreground mb-6">
                    {error.message || "An unexpected error occurred"}
                </p>
                <button
                    onClick={() => reset()}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
