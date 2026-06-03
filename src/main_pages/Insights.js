// src/main_pages/InsightsPage.js
import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import styled, { keyframes } from 'styled-components';
import { FiMoreVertical, FiShare2, FiDownload } from 'react-icons/fi';
import { fetchArticles } from '../services/articleService';
import { db } from '../../src/firebaseConfig'; // For testing

const floatUp = keyframes`
  from {
    transform: translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const AnimatedHeroTitle = styled.h1`
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  line-height: 1.2;
  color: #F2F0E6;
  animation: ${floatUp} 1s ease-out forwards;
  animation-delay: 0.3s;
  opacity: 0;
`;

const AnimatedHeroSubtitle = styled.p`
  font-size: 1.5rem;
  color: #BCAE9C;
  margin-bottom: 2rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  animation: ${floatUp} 1s ease-out forwards;
  animation-delay: 0.6s;
  opacity: 0;
`;

const ReadMoreButton = styled.button`
  background-color: transparent;
  color: #9E6E3C;
  border: 1px solid #9E6E3C;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 1rem;
  align-self: flex-start;
  
  &:hover {
    background-color: rgba(158, 110, 60, 0.1);
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #9E6E3C;
  position: absolute;
  right: 20px;
  top: 20px;
  z-index: 10;
  
  &:hover {
    color: #754A2D;
  }
`;

const InsightsPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All Posts");
  const [likedPosts, setLikedPosts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [error, setError] = useState(null);

  const categories = [
    "All Posts",
    "Business Strategy & Growth",
    "Funding & Capital Access",
    "Market Access",
    "Technology & Innovation",
    "Industry Trends"
  ];

  useEffect(() => {
    setLoaded(true);
    loadArticles();
  }, []);

  // Test Firebase connection directly
  useEffect(() => {
    const testFirebase = async () => {
      try {
        console.log('Testing Firebase connection...');
        const testSnapshot = await db.collection('articles').get();
        console.log('Firebase test - articles collection size:', testSnapshot.size);
        testSnapshot.forEach(doc => {
          console.log('Article found - ID:', doc.id);
          console.log('Article data:', doc.data());
        });
        if (testSnapshot.size === 0) {
          console.log('No articles found in Firebase. Please add some articles manually.');
        }
      } catch (error) {
        console.error('Firebase test error:', error);
        setError('Failed to connect to database');
      }
    };
    testFirebase();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading articles from service...');
      const articles = await fetchArticles();
      console.log('Articles loaded:', articles);
      console.log('Number of articles:', articles.length);
      
      if (articles.length === 0) {
        console.log('No articles returned from fetchArticles');
        setError('No articles found. Please add some articles in the admin panel.');
      } else {
        setPosts(articles);
      }
    } catch (error) {
      console.error('Error loading articles:', error);
      setError('Failed to load articles. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = (postId) => {
    setLikedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId) 
        : [...prev, postId]
    );
  };

  const toggleMenu = (postId) => {
    setOpenMenuId(openMenuId === postId ? null : postId);
  };

  const handleReadMore = (article) => {
    setSelectedArticle(article);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedArticle(null);
    document.body.style.overflow = 'auto';
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'Recent';
    
    // If it's a string
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
      }
    }
    
    // If it's a Firebase timestamp
    if (dateValue && typeof dateValue.toDate === 'function') {
      const date = dateValue.toDate();
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
    
    // If it has displayDate property
    if (dateValue && dateValue.displayDate) {
      const date = new Date(dateValue.displayDate);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
      }
    }
    
    return 'Recent';
  };

  const filteredPosts = activeCategory === "All Posts" 
    ? posts 
    : posts.filter(post => post.category === activeCategory);

  return (
    <div style={styles.app}>
      <Header />
      
      <main style={styles.mainContent}>
        {/* Hero Banner */}
        <div style={styles.fullWidthBanner}>
          <div style={styles.heroOverlay}></div>
          <div style={styles.heroContent}>
            {loaded && (
              <>
                <AnimatedHeroTitle>From Data to Decisions,<br />From Trends to Triumph</AnimatedHeroTitle>
                <AnimatedHeroSubtitle>
                  Actionable insights, expert analysis, and data-driven perspectives to help high-impact 
                  enterprises navigate challenges, seize opportunities, and lead with confidence.
                </AnimatedHeroSubtitle>
              </>
            )}
          </div>
        </div>
        
        {/* Blog Posts Section */}
        <div style={styles.contentContainer}>
          <section style={styles.blogSection} id="main-content">
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Insights & Trends</h2>
              <div style={styles.categoryFilters}>
                {categories.map((category) => (
                  <button 
                    key={category}
                    style={{
                      ...styles.categoryBtn,
                      ...(activeCategory === category ? styles.activeCategoryBtn : {})
                    }}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            
            {error && (
              <div style={styles.errorContainer}>
                <p>{error}</p>
                <button onClick={loadArticles} style={styles.retryButton}>
                  Retry
                </button>
              </div>
            )}
            
            {loading ? (
              <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p>Loading insights...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div style={styles.emptyContainer}>
                <p>No articles found in this category.</p>
                <p style={styles.emptySubtext}>Please add articles in the admin panel at /admin/articles</p>
              </div>
            ) : (
              <div style={styles.postsContainer}>
                {filteredPosts.map((post) => (
                  <article key={post.id} style={styles.postCard}>
                    <div style={styles.postLayout}>
                      <div style={styles.postImageContainer}>
                        <img 
                          src={post.imageUrl || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=1352&q=80'} 
                          alt={post.title} 
                          style={styles.postImage}
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=1352&q=80';
                          }}
                        />
                      </div>
                      <div style={styles.postContent}>
                        <div style={styles.postHeader}>
                          <div style={styles.authorInfo}>
                            <div style={styles.authorImageContainer}>
                              <img 
                                src={post.authorImageUrl || "https://randomuser.me/api/portraits/women/44.jpg"} 
                                alt="Author" 
                                style={styles.authorImage}
                                onError={(e) => {
                                  e.target.src = "https://randomuser.me/api/portraits/women/44.jpg";
                                }}
                              />
                            </div>
                            <div style={styles.authorText}>
                              <div style={styles.authorName}>{post.writer || 'BIG Marketplace'}</div>
                              <div style={styles.postMeta}>
                                <span style={styles.postMetaItem}>{formatDate(post)}</span>
                                <span style={styles.postMetaItem}>•</span>
                                <span style={styles.postMetaItem}>{post.readTime || '3 min read'}</span>
                              </div>
                            </div>
                          </div>
                          <div style={styles.menuContainer}>
                            <button 
                              style={styles.menuButton}
                              onClick={() => toggleMenu(post.id)}
                            >
                              <FiMoreVertical size={20} />
                            </button>
                            {openMenuId === post.id && (
                              <div style={styles.dropdownMenu}>
                                <button style={styles.menuItem}>
                                  <FiShare2 style={styles.menuIcon} />
                                  Share
                                </button>
                                <button style={styles.menuItem}>
                                  <FiDownload style={styles.menuIcon} />
                                  Download
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <h3 style={styles.postTitle}>{post.title}</h3>
                        <p style={styles.postExcerpt}>{post.excerpt}</p>
                        
                        <ReadMoreButton onClick={() => handleReadMore(post)}>
                          Read More
                        </ReadMoreButton>
                        
                        <div style={styles.postStats}>
                          <span style={styles.statItem}>
                            <span role="img" aria-label="views">👁️</span> {post.views || 0} view{post.views !== 1 ? 's' : ''}
                          </span>
                          <span style={styles.statItem}>
                            <span role="img" aria-label="comments">💬</span> {post.comments || 0} comment{post.comments !== 1 ? 's' : ''}
                          </span>
                          <button 
                            style={{
                              ...styles.likeBtn,
                              ...(likedPosts.includes(post.id) ? styles.likedBtn : {})
                            }}
                            onClick={() => toggleLike(post.id)}
                          >
                            <span role="img" aria-label="like">❤️</span> {likedPosts.includes(post.id) ? 'Liked' : 'Like'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Article Modal */}
      {selectedArticle && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={closeModal}>×</CloseButton>
            
            <div style={styles.modalImageContainer}>
              <img 
                src={selectedArticle.imageUrl || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=1352&q=80'} 
                alt={selectedArticle.title} 
                style={styles.modalImage}
              />
              <div style={styles.modalImageOverlay}>
                <h1 style={styles.modalTitle}>{selectedArticle.title}</h1>
                <div style={styles.modalMeta}>
                  <span>{selectedArticle.writer || 'BIG Marketplace'}</span>
                  <span>•</span>
                  <span>{formatDate(selectedArticle)}</span>
                  <span>•</span>
                  <span>{selectedArticle.readTime || '3 min read'}</span>
                </div>
              </div>
            </div>
            
            <div style={styles.modalBody}>
              <div dangerouslySetInnerHTML={{ __html: selectedArticle.content || selectedArticle.excerpt }} />
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

const styles = {
  app: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    fontFamily: "'Inter', sans-serif",
    color: '#372C27',
    lineHeight: 1.5,
    backgroundColor: '#F2F0E6',
    overflowX: 'hidden',
    margin: 0,
    padding: 0
  },
  mainContent: {
    flex: 1,
    width: '100%',
    margin: 0,
    padding: 0
  },
  fullWidthBanner: {
    width: '100vw',
    minHeight: '500px',
    position: 'relative',
    left: '50%',
    right: '50%',
    marginLeft: '-50vw',
    marginRight: '-50vw',
    backgroundImage: 'url("https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=1352&q=80")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '4rem'
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(55, 44, 39, 0.7)',
  },
  heroContent: {
    maxWidth: '1200px',
    width: '100%',
    padding: '0 20px',
    position: 'relative',
    zIndex: 2,
    color: '#F2F0E6',
    textAlign: 'center'
  },
  contentContainer: {
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    padding: '0 20px'
  },
  blogSection: {
    width: '100%',
    marginBottom: '4rem'
  },
  sectionHeader: {
    marginBottom: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  sectionTitle: {
    fontSize: '2.25rem',
    fontWeight: 700,
    color: '#372C27'
  },
  categoryFilters: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  categoryBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: '#D3D2CE',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: '#372C27',
    border: 'none',
    outline: 'none',
    transition: 'all 0.2s'
  },
  activeCategoryBtn: {
    backgroundColor: '#9E6E3C',
    color: '#F2F0E6',
  },
  postsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    width: '100%'
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '60px',
    color: '#9E6E3C',
    fontSize: '1.2rem'
  },
  errorContainer: {
    textAlign: 'center',
    padding: '60px',
    color: '#754A2D',
    fontSize: '1.1rem',
    backgroundColor: '#F2F0E6',
    border: '1px solid #BCAE9C',
    borderRadius: '8px',
    margin: '20px 0'
  },
  emptyContainer: {
    textAlign: 'center',
    padding: '60px',
    color: '#9E6E3C',
    fontSize: '1.1rem',
    backgroundColor: '#F2F0E6',
    border: '1px solid #BCAE9C',
    borderRadius: '8px',
    margin: '20px 0'
  },
  emptySubtext: {
    fontSize: '0.9rem',
    marginTop: '10px',
    color: '#BCAE9C'
  },
  retryButton: {
    marginTop: '15px',
    padding: '8px 20px',
    backgroundColor: '#9E6E3C',
    color: '#F2F0E6',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  spinner: {
    width: '40px',
    height: '40px',
    margin: '0 auto 20px',
    border: '3px solid #D3D2CE',
    borderTop: '3px solid #9E6E3C',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  postCard: {
    border: '1px solid #BCAE9C',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    backgroundColor: '#F2F0E6',
    width: '100%'
  },
  postLayout: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: '300px'
  },
  postImageContainer: {
    width: '40%',
    overflow: 'hidden'
  },
  postImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  postContent: {
    width: '60%',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative'
  },
  postHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem'
  },
  authorInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  authorImageContainer: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '2px solid #9E6E3C'
  },
  authorImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  authorText: {
    display: 'flex',
    flexDirection: 'column'
  },
  authorName: {
    fontWeight: 600,
    color: '#754A2D',
    fontSize: '1rem'
  },
  postTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: '1rem',
    color: '#754A2D',
    lineHeight: 1.3
  },
  postExcerpt: {
    color: '#372C27',
    marginBottom: '1rem',
    lineHeight: 1.6
  },
  postMeta: {
    display: 'flex',
    gap: '0.5rem',
    fontSize: '0.875rem',
    color: '#9E6E3C',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  postMetaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  },
  postStats: {
    display: 'flex',
    gap: '1.5rem',
    paddingTop: '1rem',
    borderTop: '1px solid #BCAE9C',
    marginTop: '1rem'
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontSize: '0.875rem',
    color: '#9E6E3C',
  },
  likeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    background: 'none',
    border: 'none',
    color: '#9E6E3C',
    cursor: 'pointer',
    fontSize: '0.875rem',
    padding: 0,
  },
  likedBtn: {
    color: '#754A2D',
    fontWeight: 600
  },
  menuContainer: {
    position: 'relative'
  },
  menuButton: {
    background: 'none',
    border: 'none',
    color: '#9E6E3C',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  dropdownMenu: {
    position: 'absolute',
    right: 0,
    top: '100%',
    backgroundColor: '#F2F0E6',
    border: '1px solid #BCAE9C',
    borderRadius: '0.375rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    zIndex: 10,
    minWidth: '150px'
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    width: '100%',
    background: 'none',
    border: 'none',
    textAlign: 'left',
    color: '#372C27',
    cursor: 'pointer',
    fontSize: '0.875rem'
  },
  menuIcon: {
    color: '#9E6E3C'
  },
  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(55, 44, 39, 0.95)',
    zIndex: 2000,
    overflowY: 'auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#F2F0E6',
    width: '90%',
    maxWidth: '1000px',
    maxHeight: '90vh',
    borderRadius: '12px',
    overflowY: 'auto',
    position: 'relative',
    margin: '20px'
  },
  modalImageContainer: {
    position: 'relative',
    height: '400px',
    overflow: 'hidden'
  },
  modalImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  modalImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(to top, rgba(55,44,39,0.9), transparent)',
    padding: '40px',
    color: '#F2F0E6'
  },
  modalTitle: {
    fontSize: '2rem',
    fontWeight: 800,
    marginBottom: '1rem',
    lineHeight: 1.2
  },
  modalMeta: {
    display: 'flex',
    gap: '0.75rem',
    fontSize: '0.9rem',
    color: '#BCAE9C'
  },
  modalBody: {
    padding: '40px',
    fontSize: '1.1rem',
    lineHeight: 1.8,
    color: '#372C27'
  },
  '@media (max-width: 768px)': {
    fullWidthBanner: {
      minHeight: '400px',
    },
    sectionTitle: {
      fontSize: '1.75rem',
    },
    postTitle: {
      fontSize: '1.25rem',
    },
    contentContainer: {
      padding: '0 15px'
    },
    postLayout: {
      flexDirection: 'column',
      minHeight: 'auto'
    },
    postImageContainer: {
      width: '100%',
      height: '200px'
    },
    postContent: {
      width: '100%'
    },
    authorImageContainer: {
      width: '40px',
      height: '40px'
    },
    modalTitle: {
      fontSize: '1.5rem'
    },
    modalBody: {
      padding: '20px'
    },
    modalImageContainer: {
      height: '250px'
    }
  }
};

// Add keyframe animation for spinner
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default InsightsPage;