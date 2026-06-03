// src/admin/pages/ArticleManagement.js
import React, { useState, useEffect } from 'react';
import { 
  fetchArticles, 
  createArticle, 
  updateArticle, 
  deleteArticle 
} from '../../services/articleService';
import './ArticleManagement.css';

const ArticleManagement = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    writer: 'BIG Marketplace',
    readTime: '3 min read',
    imageUrl: '',
    authorImageUrl: 'https://randomuser.me/api/portraits/women/44.jpg'
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState('');

  const categories = [
    'Business Strategy & Growth',
    'Funding & Capital Access',
    'Market Access',
    'Technology & Innovation',
    'Industry Trends'
  ];

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const fetchedArticles = await fetchArticles();
      setArticles(fetchedArticles);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingArticle) {
        await updateArticle(editingArticle.id, formData, imageFile);
      } else {
        await createArticle(formData, imageFile);
      }
      resetForm();
      await loadArticles();
    } catch (error) {
      console.error('Error saving article:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      category: article.category,
      writer: article.writer,
      readTime: article.readTime,
      imageUrl: article.imageUrl,
      authorImageUrl: article.authorImageUrl
    });
    setPreviewImage(article.imageUrl);
    setShowForm(true);
  };

  const handleDelete = async (articleId) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      try {
        await deleteArticle(articleId);
        await loadArticles();
      } catch (error) {
        console.error('Error deleting article:', error);
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingArticle(null);
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      category: '',
      writer: 'BIG Marketplace',
      readTime: '3 min read',
      imageUrl: '',
      authorImageUrl: 'https://randomuser.me/api/portraits/women/44.jpg'
    });
    setImageFile(null);
    setPreviewImage('');
  };

  return (
    <div className="article-management">
      <div className="article-management-header">
        <h1>Article Management</h1>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(true)}
        >
          + Create New Article
        </button>
      </div>

      {showForm && (
        <div className="article-form-modal">
          <div className="article-form-container">
            <div className="form-header">
              <h2>{editingArticle ? 'Edit Article' : 'Create New Article'}</h2>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="article-form">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Excerpt *</label>
                <textarea
                  name="excerpt"
                  rows="3"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Full Content (HTML supported) *</label>
                <textarea
                  name="content"
                  rows="10"
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                />
                <small>You can use HTML tags for formatting</small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Read Time</label>
                  <input
                    type="text"
                    name="readTime"
                    value={formData.readTime}
                    onChange={handleInputChange}
                    placeholder="e.g., 3 min read"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Featured Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {previewImage && (
                  <div className="image-preview">
                    <img src={previewImage} alt="Preview" />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Author Image URL (optional)</label>
                <input
                  type="text"
                  name="authorImageUrl"
                  value={formData.authorImageUrl}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editingArticle ? 'Update' : 'Publish')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="articles-list">
        <h2>All Articles</h2>
        {loading && <div className="loading">Loading articles...</div>}
        
        <div className="articles-table">
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Category</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map(article => (
                <tr key={article.id}>
                  <td>
                    <img src={article.imageUrl} alt={article.title} className="table-image" />
                  </td>
                  <td className="title-cell">{article.title}</td>
                  <td>{article.category}</td>
                  <td>{new Date(article.date).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className="btn-edit"
                      onClick={() => handleEdit(article)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDelete(article.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ArticleManagement;