import { useEffect } from "react";
import { Button } from "@heroui/react";

export default function NotFound() {
  useEffect(() => {
    document.title = "404 Not Found";
  }, []);

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="w-full max-w-md text-center">
        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-7xl font-extrabold tracking-tight bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-2xl font-bold text-foreground">Page Not Found</h2>
          <p className="text-sm text-default-500 max-w-xs mx-auto">
            Sorry, we couldn’t find the page you’re looking for. It might have
            been moved or deleted.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center mt-4">
          <Button
            color="primary"
            radius="md"
            className="font-medium shadow-lg shadow-primary/20"
            onPress={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
