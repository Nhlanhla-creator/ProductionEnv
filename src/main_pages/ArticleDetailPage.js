// src/main_pages/ArticleDetailPage.js
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiCalendar, FiClock, FiArrowLeft } from 'react-icons/fi';
import Header from './Header';
import Footer from './Footer';
import { fetchArticleById } from '../services/articleService';

const ArticleDetailPage = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;
    window.scrollTo(0, 0);
    const load = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const data = await fetchArticleById(id);
        if (!mounted) return;
        if (!data) setNotFound(true);
        else setArticle(data);
      } catch (err) {
        console.error('ArticleDetailPage load error:', err);
        if (mounted) setNotFound(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  // SEO / LinkedIn preview title
  useEffect(() => {
    if (article?.title) {
      const prev = document.title;
      document.title = `${article.title} | BIG Marketplace`;
      return () => {
        document.title = prev;
      };
    }
  }, [article]);

  // Handles Firestore Timestamp, ISO string, displayDate string, or plain date
  const formatDate = (articleObj) => {
    if (!articleObj) return '';
    const val = articleObj.displayDate || articleObj.createdAt || articleObj.date;
    if (!val) return '';
    const d = typeof val?.toDate === 'function' ? val.toDate() : new Date(val);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const shell = (children) => (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#F5F0E8',
      }}
    >
      <Header />
      <main style={{ flex: 1, padding: '40px 20px' }}>{children}</main>
      <Footer />
    </div>
  );

  if (loading) {
    return shell(
      <div
        style={{
          maxWidth: 820,
          margin: '0 auto',
          textAlign: 'center',
          color: '#7C4D2A',
          paddingTop: 60,
          fontSize: '1.1rem',
        }}
      >
        Loading article…
      </div>
    );
  }

  if (notFound) {
    return shell(
      <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', paddingTop: 60 }}>
        <h1 style={{ color: '#1C1410', marginBottom: 12 }}>Article not found</h1>
        <p style={{ color: '#7A6A5E', marginBottom: 24, lineHeight: 1.7 }}>
          This link may be broken, or the article was removed. Check the URL or browse all
          insights below.
        </p>
        <Link
          to="/InsightsPage"
          style={{
            display: 'inline-block',
            background: '#7C4D2A',
            color: '#FFF',
            padding: '10px 24px',
            borderRadius: 8,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          ← Back to Insights
        </Link>
      </div>
    );
  }

  return shell(
    <article
      style={{
        maxWidth: 820,
        margin: '0 auto',
        background: '#FFF',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(28,20,16,0.08)',
      }}
    >
      {article.imageUrl && (
        <img
          src={article.imageUrl}
          alt={article.title}
          style={{ width: '100%', maxHeight: 420, objectFit: 'cover', display: 'block' }}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}

      <div style={{ padding: '40px clamp(20px, 5vw, 56px)' }}>
        <Link
          to="/InsightsPage"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#7C4D2A',
            fontWeight: 600,
            fontSize: '0.9rem',
            textDecoration: 'none',
            marginBottom: 24,
          }}
        >
          <FiArrowLeft size={16} /> Back to Insights
        </Link>

        {article.category && (
          <span
            style={{
              display: 'inline-block',
              background: '#EAE2D8',
              color: '#7C4D2A',
              padding: '4px 14px',
              borderRadius: 50,
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            {article.category}
          </span>
        )}

        <h1
          style={{
            fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
            color: '#1C1410',
            fontWeight: 800,
            lineHeight: 1.2,
            marginBottom: 20,
            letterSpacing: '-0.01em',
          }}
        >
          {article.title}
        </h1>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 16,
            color: '#7A6A5E',
            fontSize: '0.9rem',
            paddingBottom: 24,
            borderBottom: '1px solid #EAE2D8',
            marginBottom: 32,
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <img
              src={article.authorImageUrl || '/BIGLogoBrown.jpg'}
              alt={article.writer || 'BIG Marketplace'}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1.5px solid #7C4D2A',
              }}
              onError={(e) => {
                e.target.src = '/BIGLogoBrown.jpg';
              }}
            />
            {article.writer || 'BIG Marketplace'}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <FiCalendar size={14} /> {formatDate(article)}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <FiClock size={14} /> {article.readTime || '3 min read'}
          </span>
        </div>

        {article.excerpt && (
          <p
            style={{
              fontSize: '1.15rem',
              lineHeight: 1.7,
              color: '#4a3f38',
              fontStyle: 'italic',
              marginBottom: 32,
              paddingLeft: 20,
              borderLeft: '4px solid #7C4D2A',
            }}
          >
            {article.excerpt}
          </p>
        )}

        <div
          style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#1C1410' }}
          dangerouslySetInnerHTML={{ __html: article.content || '' }}
        />
      </div>
    </article>
  );
};

export default ArticleDetailPage;