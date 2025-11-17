import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import userAPI from '../../../services/userAPI';
import ClassCard from '../../components/ui/ClassCard';
import RecentProjectsCarousel from '../../components/researcher/RecentProjectsCarousel';
import '../../assets/styles/pages/ResearcherDashboard.css';

export default function ResearcherHomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [recentProjects, setRecentProjects] = useState([]);

  // Fetch recent projects on mount
  useEffect(() => {
    const fetchRecentProjects = async () => {
      try {
        const response = await userAPI.getRecentProjects(10);
        if (response.success) {
          setRecentProjects(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch recent projects:', error);
      }
    };
    fetchRecentProjects();
  }, []);

  // Debounced search function
  const debouncedSearch = useMemo(
    () =>
      debounce(async (query, page = 1) => {
        if (!query.trim()) {
          setSearchResults([]);
          setHasSearched(false);
          return;
        }

        setLoading(true);
        setHasSearched(true);
        try {
          const response = await userAPI.searchProjects(query, page, 9);
          if (response.success) {
            setSearchResults(response.data);
            setPagination({
              page: response.pagination.page,
              totalPages: response.pagination.totalPages,
              total: response.pagination.total,
            });
          }
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } finally {
          setLoading(false);
        }
      }, 500),
    []
  );

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query, 1);
  };

  const handlePageChange = (newPage) => {
    debouncedSearch(searchQuery, newPage);
  };

  return (
    <div className="researcher-dashboard">
      <div className="dashboard-header">
        <div className="search-container-centered">
          <input
            type="text"
            placeholder="Search projects by title..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
          <i className="fa fa-search search-icon"></i>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <i className="fa fa-spinner fa-spin loading-spinner"></i>
          <p>Searching...</p>
        </div>
      )}

      {/* Search Results */}
      {!loading && hasSearched && (
        <>
          <div className="results-count">
            {searchResults.length > 0
              ? `Found ${pagination.total} project${pagination.total !== 1 ? 's' : ''}`
              : 'No projects found'}
          </div>

          {searchResults.length > 0 && (
            <>
              <div className="projects-grid">
                {searchResults.map((project) => (
                  <ClassCard
                    key={project.id}
                    title={project.title || 'Untitled'}
                    subtitle={project.owner?.full_name || 'Unknown'}
                    badge={project.status || 'ACTIVE'}
                    description={project.description}
                    onClick={() => navigate(`/researcher/projects/${project.id}/details`)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="pagination-btn"
                  >
                    Previous
                  </button>
                  {[...Array(pagination.totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => handlePageChange(i + 1)}
                      className={`pagination-page-btn ${pagination.page === i + 1 ? 'active' : ''}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="pagination-btn"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Initial State */}
      {!loading && !hasSearched && (
        <div className="empty-state">
          <i className="fa fa-search empty-state-icon"></i>
          <p className="empty-state-text">Start typing to search for projects</p>
        </div>
      )}

      {/* Recent Projects Carousel */}
      <RecentProjectsCarousel
        projects={recentProjects}
        onJoinClick={(projectId) => navigate(`/researcher/projects/${projectId}/details`)}
      />
    </div>
  );
}
