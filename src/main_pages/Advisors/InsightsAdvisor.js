import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './HeaderAdvisor'
import Footer from '../SMEs/HomeFooter';
import Sidebar from '../../advisors/AdvisorSidebar/advisorSidebar';
import styled, { keyframes } from 'styled-components';
import { FiMoreVertical, FiShare2, FiDownload } from 'react-icons/fi';

// Animations
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

// Styled Components
const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: "'Inter', sans-serif";
  background-color: #F2F0E6;
  color: #372C27;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex: 1;
`;

const SidebarContainer = styled.div`
  width: 300px;
  min-width: 300px;
  background-color: #f5f5f5;
  border-right: 1px solid #D3D2CE;
  position: sticky;
  top: 80px;
  height: calc(100vh - 80px);
  overflow-y: auto;
  padding: 20px 0;

  @media (max-width: 768px) {
    display: none;
  }
`;

const MainContent = styled.main`
  flex: 1;
  padding: 0;
  margin: 0;
  width: calc(100% - 300px);
`;

// Banner Styling
const Banner = styled.div`
  position: relative;
  width: 100%;
  height: 500px;
  background: url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=1352&q=80') center/cover no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HeroOverlay = styled.div`
  position: absolute;
  inset: 0;
  background-color: rgba(55, 44, 39, 0.7);
  z-index: 1;
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 2;
  text-align: center;
  padding: 2rem;
  max-width: 1200px;
  width: 100%;
`;

const AnimatedHeroTitle = styled.h1`
  font-size: 3rem;
  font-weight: 800;
  line-height: 1.2;
  color: #F2F0E6;
  animation: ${floatUp} 1s ease-out forwards;
  animation-delay: 0.3s;
  opacity: 0;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const AnimatedHeroSubtitle = styled.p`
  font-size: 1.5rem;
  color: #BCAE9C;
  max-width: 800px;
  margin: 0 auto 2rem;
  animation: ${floatUp} 1s ease-out forwards;
  animation-delay: 0.6s;
  opacity: 0;

  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
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

const ContentContainer = styled.div`
  padding: 2rem 3rem;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  font-weight: bold;
  color: #372C27;

  @media (max-width: 768px) {
    font-size: 1.75rem;
  }
`;

const CategoryFilters = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const CategoryButton = styled.button`
  background: none;
  border: 1px solid #9E6E3C;
  padding: 0.5rem 1rem;
  color: ${props => (props.active ? '#F2F0E6' : '#9E6E3C')};
  background-color: ${props => (props.active ? '#9E6E3C' : 'transparent')};
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => (props.active ? '#9E6E3C' : 'rgba(158, 110, 60, 0.1)')};
  }
`;

const PostsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const PostCard = styled.article`
  background-color: #F2F0E6;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: 1px solid #BCAE9C;
`;

const PostImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
`;

const PostContent = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const PostHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const AuthorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const AuthorImage = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #9E6E3C;
`;

const AuthorDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const AuthorName = styled.div`
  font-weight: 600;
  color: #754A2D;
`;

const PostMeta = styled.div`
  display: flex;
  gap: 0.5rem;
  color: #9E6E3C;
  font-size: 0.875rem;
`;

const PostTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #754A2D;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const PostExcerpt = styled.p`
  color: #372C27;
  margin: 0;
`;

const PostStats = styled.div`
  display: flex;
  gap: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #BCAE9C;
  margin-top: 1rem;
  color: #9E6E3C;
  font-size: 0.875rem;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
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
  align-self: flex-start;
  margin-top: 0.5rem;
  
  &:hover {
    background-color: rgba(158, 110, 60, 0.1);
  }
`;

const InsightsAdvisor = () => {
  const navigate = useNavigate();

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
      articlePath: '/Article1'
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
      articlePath: '/Article2'
    }
  ];

  const categories = [
    "All Posts",
    "Business Strategy & Growth",
    "Funding & Capital Access",
    "Market Access",
    "More"
  ];

  const [activeCategory, setActiveCategory] = useState("All Posts");
  const [loaded, setLoaded] = useState(false);
  const [likedPosts, setLikedPosts] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    setLoaded(true);
  }, []);

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

  const handleReadMore = (path) => {
    navigate(path);
  };

  const filteredPosts = activeCategory === "All Posts" 
    ? posts 
    : posts.filter(post => post.category === activeCategory);

  return (
    <PageWrapper>
      <Header />
      <ContentWrapper>
        <SidebarContainer>
          <Sidebar />
        </SidebarContainer>

        <MainContent>
          <Banner>
            <HeroOverlay />
            <HeroContent>
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
            </HeroContent>
          </Banner>

          <ContentContainer>
            <SectionHeader>
              <SectionTitle>Insights & Trends</SectionTitle>
              <CategoryFilters>
                {categories.map(category => (
                  <CategoryButton
                    key={category}
                    active={category === activeCategory}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </CategoryButton>
                ))}
              </CategoryFilters>
            </SectionHeader>

            <PostsGrid>
              {filteredPosts.map(post => (
                <PostCard key={post.id}>
                  <PostImage src={post.image} alt={post.title} />
                  <PostContent>
                    <PostHeader>
                      <AuthorInfo>
                        <AuthorImage src={post.authorImage} alt="Author" />
                        <AuthorDetails>
                          <AuthorName>{post.writer}</AuthorName>
                          <PostMeta>
                            <span>{post.date}</span>
                            <span>•</span>
                            <span>{post.readTime}</span>
                          </PostMeta>
                        </AuthorDetails>
                      </AuthorInfo>
                      <button onClick={() => toggleMenu(post.id)}>
                        <FiMoreVertical color="#9E6E3C" />
                      </button>
                    </PostHeader>
                    
                    <PostTitle>{post.title}</PostTitle>
                    <PostExcerpt>{post.excerpt}</PostExcerpt>
                    
                    <ReadMoreButton onClick={() => handleReadMore(post.articlePath)}>
                      Read More
                    </ReadMoreButton>
                    
                    <PostStats>
                      <StatItem>
                        <span role="img" aria-label="views">👁️</span> {post.views} view{post.views !== 1 ? 's' : ''}
                      </StatItem>
                      <StatItem>
                        <span role="img" aria-label="comments">💬</span> {post.comments} comment{post.comments !== 1 ? 's' : ''}
                      </StatItem>
                      <StatItem 
                        onClick={() => toggleLike(post.id)}
                        style={{ 
                          color: likedPosts.includes(post.id) ? '#754A2D' : '#9E6E3C',
                          fontWeight: likedPosts.includes(post.id) ? '600' : 'normal',
                          cursor: 'pointer'
                        }}
                      >
                        <span role="img" aria-label="like">❤️</span> {likedPosts.includes(post.id) ? 'Liked' : 'Like'}
                      </StatItem>
                    </PostStats>
                  </PostContent>
                </PostCard>
              ))}
            </PostsGrid>
          </ContentContainer>
        </MainContent>
      </ContentWrapper>
      
      <Footer />
    </PageWrapper>
  );
};

export default InsightsAdvisor;