// src/services/articleService.js
import { db, storage, firebase } from '../../src/firebaseConfig';

const ARTICLES_COLLECTION = 'articles';

// Helper to convert Firebase doc to our format
const convertDoc = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    // Convert Firebase timestamp to string for display
    displayDate: data.displayDate || (data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString())
  };
};

// Fetch all articles - FIXED: remove orderBy for now
export const fetchArticles = async () => {
  try {
    // Simplified query without orderBy to avoid index issues
    const snapshot = await db.collection(ARTICLES_COLLECTION).get();
    
    if (snapshot.empty) {
      console.log('No articles found');
      return [];
    }
    
    let articles = snapshot.docs.map(convertDoc);
    
    // Sort manually by displayDate (newest first)
    articles.sort((a, b) => {
      const dateA = new Date(a.displayDate || a.createdAt?.toDate?.() || 0);
      const dateB = new Date(b.displayDate || b.createdAt?.toDate?.() || 0);
      return dateB - dateA;
    });
    
    console.log('Articles loaded:', articles.length);
    return articles;
  } catch (error) {
    console.error('Error fetching articles:', error);
    throw error;
  }
};

// Fetch single article by ID
export const fetchArticleById = async (articleId) => {
  try {
    const docRef = db.collection(ARTICLES_COLLECTION).doc(articleId);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      return convertDoc(docSnap);
    }
    return null;
  } catch (error) {
    console.error('Error fetching article:', error);
    throw error;
  }
};

// Create new article
export const createArticle = async (articleData, imageFile) => {
  try {
    let imageUrl = articleData.imageUrl || '';
    
    // Upload image if provided
    if (imageFile) {
      const storageRef = storage.ref(`articles/${Date.now()}_${imageFile.name}`);
      await storageRef.put(imageFile);
      imageUrl = await storageRef.getDownloadURL();
    }
    
    const now = new Date();
    const displayDateString = now.toISOString();
    
    const article = {
      title: articleData.title,
      excerpt: articleData.excerpt,
      content: articleData.content,
      category: articleData.category,
      writer: articleData.writer || 'BIG Marketplace',
      readTime: articleData.readTime || '3 min read',
      imageUrl: imageUrl,
      authorImageUrl: articleData.authorImageUrl || 'https://randomuser.me/api/portraits/women/44.jpg',
      displayDate: displayDateString,  // Store as string
      views: 0,
      comments: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection(ARTICLES_COLLECTION).add(article);
    console.log('Article created with ID:', docRef.id);
    return { id: docRef.id, ...article };
  } catch (error) {
    console.error('Error creating article:', error);
    throw error;
  }
};

// Update existing article
export const updateArticle = async (articleId, articleData, imageFile = null) => {
  try {
    let imageUrl = articleData.imageUrl;
    
    // Upload new image if provided
    if (imageFile) {
      const storageRef = storage.ref(`articles/${Date.now()}_${imageFile.name}`);
      await storageRef.put(imageFile);
      imageUrl = await storageRef.getDownloadURL();
    }
    
    const articleRef = db.collection(ARTICLES_COLLECTION).doc(articleId);
    await articleRef.update({
      title: articleData.title,
      excerpt: articleData.excerpt,
      content: articleData.content,
      category: articleData.category,
      writer: articleData.writer,
      readTime: articleData.readTime,
      imageUrl: imageUrl,
      authorImageUrl: articleData.authorImageUrl,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('Article updated:', articleId);
    return { id: articleId, ...articleData, imageUrl };
  } catch (error) {
    console.error('Error updating article:', error);
    throw error;
  }
};

// Delete article
export const deleteArticle = async (articleId) => {
  try {
    await db.collection(ARTICLES_COLLECTION).doc(articleId).delete();
    console.log('Article deleted:', articleId);
    return true;
  } catch (error) {
    console.error('Error deleting article:', error);
    throw error;
  }
};