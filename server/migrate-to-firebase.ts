import { memoryStorage } from './storage';
import { FirebaseStorage } from './firebase-storage';
import { lessons as lessonsData } from './data/lessons';

async function migrateToFirebase() {
  console.log('🔄 Starting migration to Firebase...');
  
  try {
    // Initialize Firebase storage
    const firebaseStorage = new FirebaseStorage();
    
    // Load lessons data into memory storage first
    console.log('📚 Loading lesson data...');
    for (const lesson of lessonsData) {
      await memoryStorage.createLesson(lesson);
    }
    
    // Wait a moment for Firebase to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Migrate data to Firebase
    await firebaseStorage.migrateFromMemoryStorage(memoryStorage);
    
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('To switch to Firebase storage permanently:');
    console.log('1. Set environment variable USE_FIREBASE=true in your Replit Secrets');
    console.log('2. Restart your application');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateToFirebase();
}

export { migrateToFirebase };