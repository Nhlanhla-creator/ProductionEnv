import { getFirestore } from 'firebase/firestore';
import { db as testingDb } from '../firebaseConfig';

// Import as named export
import { productionApp } from '../productionConfig';

class DatabaseService {
  constructor() {
    this.currentDatabase = localStorage.getItem('selectedDatabase') || 'testing';
  }

  getCurrentDatabase() {
    return this.currentDatabase;
  }

  setDatabase(databaseType) {
    if (databaseType === 'testing' || databaseType === 'production') {
      this.currentDatabase = databaseType;
      localStorage.setItem('selectedDatabase', databaseType);
      return true;
    }
    return false;
  }

  toggleDatabase() {
    const newDatabase = this.currentDatabase === 'testing' ? 'production' : 'testing';
    return this.setDatabase(newDatabase);
  }

  getFirestore() {
    if (this.currentDatabase === 'testing') {
      return testingDb;
    } else {
      // Use getFirestore with productionApp
      return getFirestore(productionApp);
    }
  }

  getDatabaseName() {
    return this.currentDatabase === 'testing' 
      ? 'Testing Database' 
      : 'Production Database';
  }
}

const databaseService = new DatabaseService();
export default databaseService;