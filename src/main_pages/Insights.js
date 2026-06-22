// src/main_pages/InsightsPage.js
import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import styled, { keyframes } from 'styled-components';
import { 
  FiMoreVertical, 
  FiShare2, 
  FiDownload, 
  FiEye, 
  FiMessageCircle, 
  FiHeart,
  FiClock,
  FiCalendar,
  FiUser,
  FiBookOpen,
  FiTrendingUp,
  FiZap,
  FiBriefcase,
  FiGlobe,
  FiCpu,
  FiBarChart2
} from 'react-icons/fi';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { fetchArticles } from '../services/articleService';
import { db } from '../../src/firebaseConfig';

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
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  margin-bottom: 1.5rem;
  line-height: 1.2;
  color: #F2F0E6;
  animation: ${floatUp} 1s ease-out forwards;
  animation-delay: 0.3s;
  opacity: 0;
`;

const AnimatedHeroSubtitle = styled.p`
  font-size: clamp(1rem, 1.5vw, 1.5rem);
  color: #BCAE9C;
  margin-bottom: 2rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  animation: ${floatUp} 1s ease-out forwards;
  animation-delay: 0.6s;
  opacity: 0;
  line-height: 1.7;
`;

const CategoryIconMap = {
  "Business Strategy & Growth": <FiTrendingUp size={16} />,
  "Funding & Capital Access": <FiZap size={16} />,
  "Market Access": <FiGlobe size={16} />,
  "Technology & Innovation": <FiCpu size={16} />,
  "Industry Trends": <FiBarChart2 size={16} />,
};

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
    
    if (dateValue && typeof dateValue.toDate === 'function') {
      const date = dateValue.toDate();
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
    
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
                    {category !== "All Posts" && CategoryIconMap[category]}
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
                <FiBookOpen size={48} color="#BCAE9C" />
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
                        {post.category && post.category !== "All Posts" && (
                          <div style={styles.postCategoryBadge}>
                            {CategoryIconMap[post.category]} {post.category}
                          </div>
                        )}
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
                              <div style={styles.authorName}>
                                <FiUser size={14} style={styles.iconInline} />
                                {post.writer || 'BIG Marketplace'}
                              </div>
                              <div style={styles.postMeta}>
                                <span style={styles.postMetaItem}>
                                  <FiCalendar size={12} style={styles.iconInline} />
                                  {formatDate(post)}
                                </span>
                                <span style={styles.postMetaItem}>•</span>
                                <span style={styles.postMetaItem}>
                                  <FiClock size={12} style={styles.iconInline} />
                                  {post.readTime || '3 min read'}
                                </span>
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
                        
                        <button 
                          style={styles.readMoreButton}
                          onClick={() => handleReadMore(post)}
                        >
                          Read More →
                        </button>
                        
                        <div style={styles.postStats}>
                          <span style={styles.statItem}>
                            <FiEye size={14} style={styles.iconInline} />
                            {post.views || 0} view{post.views !== 1 ? 's' : ''}
                          </span>
                          <span style={styles.statItem}>
                            <FiMessageCircle size={14} style={styles.iconInline} />
                            {post.comments || 0} comment{post.comments !== 1 ? 's' : ''}
                          </span>
                          <button 
                            style={{
                              ...styles.likeBtn,
                              ...(likedPosts.includes(post.id) ? styles.likedBtn : {})
                            }}
                            onClick={() => toggleLike(post.id)}
                          >
                            {likedPosts.includes(post.id) ? (
                              <FaHeart size={14} style={styles.iconInline} color="#754A2D" />
                            ) : (
                              <FiHeart size={14} style={styles.iconInline} />
                            )}
                            {likedPosts.includes(post.id) ? 'Liked' : 'Like'}
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
            <button onClick={closeModal} style={styles.modalCloseButton}>×</button>
            
            <div style={styles.modalImageContainer}>
              <img 
                src={selectedArticle.imageUrl || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=1352&q=80'} 
                alt={selectedArticle.title} 
                style={styles.modalImage}
              />
              <div style={styles.modalImageOverlay}>
                <h1 style={styles.modalTitle}>{selectedArticle.title}</h1>
                <div style={styles.modalMeta}>
                  <span><FiUser size={14} style={styles.iconInline} /> {selectedArticle.writer || 'BIG Marketplace'}</span>
                  <span>•</span>
                  <span><FiCalendar size={14} style={styles.iconInline} /> {formatDate(selectedArticle)}</span>
                  <span>•</span>
                  <span><FiClock size={14} style={styles.iconInline} /> {selectedArticle.readTime || '3 min read'}</span>
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
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    color: '#372C27',
    lineHeight: 1.5,
    backgroundColor: '#F5F0E8',
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
    backgroundColor: 'rgba(28, 20, 16, 0.75)',
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
    fontSize: 'clamp(1.5rem, 2.5vw, 2.25rem)',
    fontWeight: 800,
    color: '#1C1410',
    letterSpacing: '-0.01em',
  },
  categoryFilters: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  categoryBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: '#EAE2D8',
    borderRadius: '50px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#7A6A5E',
    border: 'none',
    outline: 'none',
    transition: 'all 0.25s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  activeCategoryBtn: {
    backgroundColor: '#7C4D2A',
    color: '#FFFFFF',
    boxShadow: '0 4px 15px rgba(124, 77, 42, 0.25)',
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
    color: '#7C4D2A',
    fontSize: '1.2rem'
  },
  errorContainer: {
    textAlign: 'center',
    padding: '60px',
    color: '#7C4D2A',
    fontSize: '1.1rem',
    backgroundColor: '#FAF7F2',
    border: '1px solid #EAE2D8',
    borderRadius: '12px',
    margin: '20px 0'
  },
  emptyContainer: {
    textAlign: 'center',
    padding: '60px',
    color: '#7A6A5E',
    fontSize: '1.1rem',
    backgroundColor: '#FAF7F2',
    border: '1px solid #EAE2D8',
    borderRadius: '12px',
    margin: '20px 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  emptySubtext: {
    fontSize: '0.9rem',
    marginTop: '10px',
    color: '#BCAE9C'
  },
  retryButton: {
    marginTop: '15px',
    padding: '8px 24px',
    backgroundColor: '#7C4D2A',
    color: '#F2F0E6',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
    transition: 'all 0.3s ease',
  },
  spinner: {
    width: '40px',
    height: '40px',
    margin: '0 auto 20px',
    border: '3px solid #EAE2D8',
    borderTop: '3px solid #7C4D2A',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  postCard: {
    border: '1px solid #EAE2D8',
    borderRadius: '16px',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    width: '100%',
    boxShadow: '0 4px 20px rgba(28,20,16,0.05)',
    transition: 'box-shadow 0.3s ease, transform 0.3s ease',
  },
  postLayout: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: '300px'
  },
  postImageContainer: {
    width: '40%',
    overflow: 'hidden',
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.5s ease',
  },
  postCategoryBadge: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    backgroundColor: 'rgba(28, 20, 16, 0.85)',
    color: '#F2F0E6',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '0.7rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backdropFilter: 'blur(4px)',
  },
  postContent: {
    width: '60%',
    padding: '1.5rem 2rem',
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
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '2px solid #7C4D2A',
    flexShrink: 0,
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
    fontWeight: 700,
    color: '#1C1410',
    fontSize: '0.95rem',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  postTitle: {
    fontSize: 'clamp(1.1rem, 1.5vw, 1.5rem)',
    fontWeight: 700,
    marginBottom: '0.75rem',
    color: '#1C1410',
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
  },
  postExcerpt: {
    color: '#7A6A5E',
    marginBottom: '1rem',
    lineHeight: 1.7,
    fontSize: '0.95rem',
    flex: 1,
  },
  readMoreButton: {
    backgroundColor: 'transparent',
    color: '#7C4D2A',
    border: 'none',
    padding: '0',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    alignSelf: 'flex-start',
    marginBottom: '1rem',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  postMeta: {
    display: 'flex',
    gap: '0.5rem',
    fontSize: '0.8rem',
    color: '#7A6A5E',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  postMetaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  postStats: {
    display: 'flex',
    gap: '1.5rem',
    paddingTop: '1rem',
    borderTop: '1px solid #EAE2D8',
    marginTop: '0.5rem'
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.85rem',
    color: '#7A6A5E',
  },
  likeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: 'none',
    color: '#7A6A5E',
    cursor: 'pointer',
    fontSize: '0.85rem',
    padding: 0,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    transition: 'all 0.25s ease',
  },
  likedBtn: {
    color: '#7C4D2A',
    fontWeight: 600,
  },
  menuContainer: {
    position: 'relative'
  },
  menuButton: {
    background: 'none',
    border: 'none',
    color: '#7A6A5E',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s ease',
  },
  dropdownMenu: {
    position: 'absolute',
    right: 0,
    top: '100%',
    backgroundColor: '#FFFFFF',
    border: '1px solid #EAE2D8',
    borderRadius: '8px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
    zIndex: 10,
    minWidth: '150px',
    overflow: 'hidden',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.6rem 1rem',
    width: '100%',
    background: 'none',
    border: 'none',
    textAlign: 'left',
    color: '#1C1410',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    transition: 'background 0.2s ease',
  },
  menuIcon: {
    color: '#7A6A5E'
  },
  iconInline: {
    verticalAlign: 'middle',
  },
  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(28, 20, 16, 0.92)',
    zIndex: 2000,
    overflowY: 'auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    backdropFilter: 'blur(4px)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    width: '90%',
    maxWidth: '900px',
    maxHeight: '90vh',
    borderRadius: '16px',
    overflowY: 'auto',
    position: 'relative',
    margin: '20px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  modalCloseButton: {
    position: 'absolute',
    top: '16px',
    right: '20px',
    background: 'none',
    border: 'none',
    fontSize: '2rem',
    cursor: 'pointer',
    color: '#FFFFFF',
    zIndex: 10,
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transition: 'all 0.3s ease',
    backgroundColor: 'rgba(0,0,0,0.3)',
    backdropFilter: 'blur(4px)',
  },
  modalImageContainer: {
    position: 'relative',
    height: '400px',
    overflow: 'hidden',
  },
  modalImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  modalImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(to top, rgba(28,20,16,0.9), transparent)',
    padding: '40px',
    color: '#F2F0E6',
  },
  modalTitle: {
    fontSize: 'clamp(1.5rem, 2.5vw, 2.2rem)',
    fontWeight: 800,
    marginBottom: '0.75rem',
    lineHeight: 1.2,
    letterSpacing: '-0.01em',
  },
  modalMeta: {
    display: 'flex',
    gap: '0.75rem',
    fontSize: '0.9rem',
    color: '#BCAE9C',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  modalBody: {
    padding: '40px',
    fontSize: '1.05rem',
    lineHeight: 1.8,
    color: '#1C1410',
  },
};

// Add keyframe animation for spinner
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .post-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(28,20,16,0.1);
  }
  .post-card:hover .post-image {
    transform: scale(1.03);
  }
`;
document.head.appendChild(styleSheet);

export default InsightsPage;