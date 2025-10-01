import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import styled, { keyframes } from 'styled-components';
import { FiMoreVertical, FiShare2, FiDownload } from 'react-icons/fi';

// Animation for the banner text
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

// Styled components for animations
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

const AnimatedButton = styled.button`
  background-color: #9E6E3C;
  color: #F2F0E6;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s;
  animation: ${floatUp} 1s ease-out forwards;
  animation-delay: 0.9s;
  opacity: 0;
  
  &:hover {
    background-color: #754A2D;
  }
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

const InsightsPage = () => {
  const navigate = useNavigate();
  // Color palette
  const colors = {
    brownDark: '#754A2D',
    grayLight: '#D3D2CE',
    brownBlack: '#372C27',
    brownMedium: '#9E6E3C',
    cream: '#F2F0E6',
    beige: '#BCAE9C'
  };

  // Blog post data with images
  const posts = [
    {
      id: 1,
      title: "The Power of Data-Driven Culture: Transforming Organizations into Innovators",
      excerpt: "In today's fast-moving business landscape, innovation has shifted from being a luxury to an absolute necessity. At the heart of this...",
      writer: "BIG Marketplace",
      date: "Oct 17, 2024",
      readTime: "3 min read",
      views: 1,
      comments: 0,
      liked: false,
      category: "Business Strategy & Growth",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      authorImage: "https://randomuser.me/api/portraits/women/44.jpg",
      articlePath: '/Article1'  // Added specific path for first article
    },
    {
      id: 2,
      title: "Predictive Maintenance in the Mining Industry: Game-Changer for Efficiency and Profitability.. or a cautionary tail?",
      excerpt: "The mining industry, known for its colossal machinery and rugged operational environments, has traditionally been challenged by unplanned...",
      writer: "BIG Marketplace",
      date: "Oct 17, 2024",
      readTime: "4 min read",
      views: 1,
      comments: 0,
      liked: false,
      category: "Market Access",
      image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      authorImage: "https://randomuser.me/api/portraits/men/32.jpg",
      articlePath: '/Article2'  // Added specific path for second article
    }
  ];

  // Categories for filtering
  const categories = [
    "All Posts",
    "Business Strategy & Growth",
    "Funding & Capital Access",
    "Market Access",
    "More"
  ];

  // State management
  const [activeCategory, setActiveCategory] = useState("All Posts");
  const [likedPosts, setLikedPosts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    setLoaded(true);
  }, []);

  // Toggle like status for posts
  const toggleLike = (postId) => {
    setLikedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId) 
        : [...prev, postId]
    );
  };

  // Toggle menu
  const toggleMenu = (postId) => {
    setOpenMenuId(openMenuId === postId ? null : postId);
  };

  // Handle read more navigation
  const handleReadMore = (articlePath) => {
    navigate(articlePath);
  };

  // Filter posts based on active category
  const filteredPosts = activeCategory === "All Posts" 
    ? posts 
    : posts.filter(post => post.category === activeCategory);

  return (
    <div style={styles.app}>
      {/* Header Component */}
      <Header />
      
      <main style={styles.mainContent}>
        {/* Full-width Banner Section */}
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
                <AnimatedButton>Explore Insights & Trends</AnimatedButton>
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
            
            <div style={styles.postsContainer}>
              {filteredPosts.map((post) => (
                <article key={post.id} style={styles.postCard}>
                  <div style={styles.postLayout}>
                    <div style={styles.postImageContainer}>
                      <img 
                        src={post.image} 
                        alt={post.title} 
                        style={styles.postImage}
                      />
                    </div>
                    <div style={styles.postContent}>
                      <div style={styles.postHeader}>
                        <div style={styles.authorInfo}>
                          <div style={styles.authorImageContainer}>
                            <img 
                              src={post.authorImage} 
                              alt="Author" 
                              style={styles.authorImage}
                            />
                          </div>
                          <div style={styles.authorText}>
                            <div style={styles.authorName}>{post.writer}</div>
                            <div style={styles.postMeta}>
                              <span style={styles.postMetaItem}>{post.date}</span>
                              <span style={styles.postMetaItem}>•</span>
                              <span style={styles.postMetaItem}>{post.readTime}</span>
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
                      
                      <ReadMoreButton onClick={() => handleReadMore(post.articlePath)}>
                        Read More
                      </ReadMoreButton>
                      
                      <div style={styles.postStats}>
                        <span style={styles.statItem}>
                          <span role="img" aria-label="views">👁️</span> {post.views} view{post.views !== 1 ? 's' : ''}
                        </span>
                        <span style={styles.statItem}>
                          <span role="img" aria-label="comments">💬</span> {post.comments} comment{post.comments !== 1 ? 's' : ''}
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
          </section>
        </div>
      </main>
      
      {/* Footer Component */}
      <Footer />
    </div>
  );
};

// Styles (remain exactly the same as previous version)
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
    border: '1px solid #BCAE9C',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '0.875rem',
    color: '#372C27',
    border: 'none',
    outline: 'none'
  },
  activeCategoryBtn: {
    backgroundColor: '#9E6E3C',
    color: '#F2F0E6',
    borderColor: '#9E6E3C'
  },
  postsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    width: '100%'
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
    color: '#754A2D'
  },
  postExcerpt: {
    color: '#372C27',
    marginBottom: '1rem',
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
    justifyContent: 'center',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: 'rgba(158, 110, 60, 0.1)'
    }
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
    fontSize: '0.875rem',
    '&:hover': {
      backgroundColor: 'rgba(158, 110, 60, 0.1)'
    }
  },
  menuIcon: {
    color: '#9E6E3C'
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
    }
  }
};

export default InsightsPage;