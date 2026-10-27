import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      usePolling: true,
    },
    proxy: {
      "/backend": {
<<<<<<< Updated upstream
<<<<<<< HEAD
        target: "http://localhost/Projects/IM2/SalesAndExpenseMgmtSystem",
=======
        target: "http://localhost/SalesAndExpenseMgmtSystem",
>>>>>>> 5544821 (staff Manager)
=======
        target: "http://localhost/Projects/SalesAndExpenseMgmtSystem",
>>>>>>> Stashed changes
        changeOrigin: true,
      },
    },
  },
});
