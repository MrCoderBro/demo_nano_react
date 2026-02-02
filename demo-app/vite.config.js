import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      // Proxy API requests to backend server
      '/login': 'http://localhost:4000',
      '/logout': 'http://localhost:4000',
      '/check-auth': 'http://localhost:4000',
      '/create-user': 'http://localhost:4000',
      '/users': 'http://localhost:4000',
      '/update-user': 'http://localhost:4000',
      '/delete-user': 'http://localhost:4000',
      '/approve-user': 'http://localhost:4000',
      '/reject-user': 'http://localhost:4000',
      '/roles': 'http://localhost:4000',
      '/create-role': 'http://localhost:4000',
      '/update-role': 'http://localhost:4000',
      '/delete-role': 'http://localhost:4000',
      '/events': 'http://localhost:4000',
    }
  }
});
