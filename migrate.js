#!/usr/bin/env node

// Simple migration script to transfer data from memory storage to Firebase
import('./server/migrate-to-firebase.js').then(module => {
  module.migrateToFirebase().catch(console.error);
}).catch(console.error);