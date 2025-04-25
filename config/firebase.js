import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let auth;

// Initialize Firebase Admin
const initializeFirebase = async () => {
  if (!admin.apps.length) {
    // Look for the service account key in the todo-backend directory
    const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
    console.log('Looking for service account key at:', serviceAccountPath);
    
    try {
      const serviceAccount = JSON.parse(await readFile(serviceAccountPath, 'utf8'));
      console.log('Successfully loaded service account key');
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } catch (error) {
      console.error('Error loading service account key:', error);
      throw new Error('Failed to load Firebase service account key. Please make sure serviceAccountKey.json exists in the todo-backend directory.');
    }
  }
  
  auth = getAuth();
  return auth;
};

// Initialize Firebase and export
const firebaseAuth = initializeFirebase().catch(console.error);

export { auth, firebaseAuth };
export default admin; 