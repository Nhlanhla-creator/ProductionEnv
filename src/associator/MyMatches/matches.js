"use client";
import React, { useState } from 'react';
import { Search, Filter, Users, Handshake, Star } from 'lucide-react';

const AssociatorMatches = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const matches = [
    { id: 1, name: 'TechStars Africa', type: 'Accelerator', matchScore: 92, status: 'pending', industry: 'Technology' },
    { id: 2, name: 'Green Energy Fund', type: 'Investor', matchScore: 88, status: 'accepted', industry: 'Clean Energy' },
    { id: 3, name: 'Social Impact Lab', type: 'NGO', matchScore: 85, status: 'pending', industry: 'Social Enterprise' },
    { id: 4, name: 'Innovation Hub', type: 'Incubator', matchScore: 79, status: 'declined', industry: 'Startups' },
    { id: 5, name: 'Growth Partners', type: 'Consulting', matchScore: 94, status: 'accepted', industry: 'Business Services' },
  ];

  const filteredMatches = matches.filter(match => {
    if (filter !== 'all' && match.status !== filter) return false;
    if (searchTerm && !match.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getStatusBadge = (status) => {
    const badges = {
      pending: <span className="badge pending">Pending</span>,
      accepted: <span className="badge accepted">Connected</span>,
      declined: <span className="badge declined">Declined</span>,
    };
    return badges[status] || badges.pending;
  };

  return (
    <div className="associator-matches">
      <div className="matches-header">
        <h1>My Matches</h1>
        <p>Discover and connect with potential partners in the ecosystem.</p>
      </div>

      <div className="matches-controls">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search matches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
          <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>Pending</button>
          <button className={filter === 'accepted' ? 'active' : ''} onClick={() => setFilter('accepted')}>Connected</button>
        </div>
      </div>

      <div className="matches-grid">
        {filteredMatches.map((match) => (
          <div key={match.id} className="match-card">
            <div className="match-card-header">
              <div className="match-avatar">
                <Handshake size={24} />
              </div>
              <div className="match-info">
                <h3>{match.name}</h3>
                <p className="match-type">{match.type}</p>
                <p className="match-industry">{match.industry}</p>
              </div>
              <div className="match-score">
                <Star size={16} />
                <span>{match.matchScore}%</span>
              </div>
            </div>
            <div className="match-card-footer">
              {getStatusBadge(match.status)}
              <button className="view-profile-btn">View Profile</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssociatorMatches;