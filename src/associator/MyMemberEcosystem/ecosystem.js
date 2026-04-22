"use client";
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Building2, 
  GraduationCap, 
  Briefcase, 
  TrendingUp, 
  Award, 
  Handshake, 
  Globe,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import styles from './ecosystem.module.css';

const AssociatorEcosystem = () => {
  const navigate = useNavigate();

  const ecosystemStats = {
    totalMembers: 1247,
    activePartnerships: 89,
    industries: 24,
    countries: 15
  };

  const memberCategories = [
    { 
      name: 'SMSEs', 
      count: 456, 
      icon: <Briefcase size={24} />, 
      color: '#4CAF50',
      route: '/associator-ecosystem/smse',
      description: 'Small and Medium Enterprises'
    },
    { 
      name: 'Investors', 
      count: 234, 
      icon: <TrendingUp size={24} />, 
      color: '#2196F3',
      route: '/associator-ecosystem/investor',
      description: 'Funders & Investment Partners'
    },
    { 
      name: 'Advisors', 
      count: 189, 
      icon: <Users size={24} />, 
      color: '#9C27B0',
      route: '/associator-ecosystem/advisor',
      description: 'Mentors & Industry Experts'
    },
    { 
      name: 'Catalysts', 
      count: 167, 
      icon: <Building2 size={24} />, 
      color: '#FF9800',
      route: '/associator-ecosystem/catalyst',
      description: 'Accelerators & Incubators'
    },
    { 
      name: 'Interns', 
      count: 145, 
      icon: <GraduationCap size={24} />, 
      color: '#00BCD4',
      route: '/associator-ecosystem/intern',
      description: 'Future Leaders'
    },
    { 
      name: 'Program Sponsors', 
      count: 56, 
      icon: <Award size={24} />, 
      color: '#E91E63',
      route: '/associator-ecosystem/sponsor',
      description: 'Program Partners'
    },
  ];

  const handleNavigate = (route) => {
    navigate(route);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Member Ecosystem</h1>
          <p className={styles.subtitle}>Explore the diverse community of BIG Marketplace members.</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Users size={24} />
          </div>
          <div className={styles.statInfo}>
            <h3>{ecosystemStats.totalMembers.toLocaleString()}</h3>
            <p>Total Members</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Handshake size={24} />
          </div>
          <div className={styles.statInfo}>
            <h3>{ecosystemStats.activePartnerships}</h3>
            <p>Active Partnerships</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Building2 size={24} />
          </div>
          <div className={styles.statInfo}>
            <h3>{ecosystemStats.industries}</h3>
            <p>Industries</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Globe size={24} />
          </div>
          <div className={styles.statInfo}>
            <h3>{ecosystemStats.countries}</h3>
            <p>Countries</p>
          </div>
        </div>
      </div>

      <div className={styles.memberCategories}>
        <h2 className={styles.sectionTitle}>Member Categories</h2>
        <div className={styles.categoriesGrid}>
          {memberCategories.map((category, index) => (
            <div 
              key={index} 
              className={styles.categoryCard}
              onClick={() => handleNavigate(category.route)}
            >
              <div className={styles.categoryHeader}>
                <div className={styles.categoryIcon} style={{ backgroundColor: `${category.color}15`, color: category.color }}>
                  {category.icon}
                </div>
                <ChevronRight size={20} className={styles.categoryArrow} />
              </div>
              <div className={styles.categoryInfo}>
                <h3>{category.name}</h3>
                <p className={styles.categoryDescription}>{category.description}</p>
                <div className={styles.categoryFooter}>
                  <span className={styles.categoryCount}>{category.count.toLocaleString()} members</span>
                  <button className={styles.viewAllBtn}>
                    Browse <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.ecosystemMap}>
        <h2 className={styles.sectionTitle}>Geographic Distribution</h2>
        <div className={styles.mapPlaceholder}>
          <Globe size={48} />
          <p>🌍 Interactive map coming soon</p>
          <span>Visualize member locations across the globe</span>
        </div>
      </div>
    </div>
  );
};

export default AssociatorEcosystem;