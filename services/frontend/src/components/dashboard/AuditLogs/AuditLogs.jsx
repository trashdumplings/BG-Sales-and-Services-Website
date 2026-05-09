import React, { useState, useEffect } from 'react';
import { getAuditLogs } from '../../../utils/api';
import { useAuth } from '../../../stores/AuthProvider';
import { LuHistory, LuSearch, LuUser, LuBox, LuActivity } from 'react-icons/lu';
import './AuditLogs.css';

const AuditLogs = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const data = await getAuditLogs(token);
        setLogs(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchLogs();
  }, [token]);

  const filteredLogs = logs.filter(log => 
    log.description.toLowerCase().includes(filter.toLowerCase()) ||
    log.action.toLowerCase().includes(filter.toLowerCase()) ||
    log.entity_type.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return <div className="loading-state">Loading audit logs...</div>;

  return (
    <div className="audit-logs-container">
      <div className="list-controls">
        <div className="search-box">
          <LuSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search logs..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="audit-timeline">
        {filteredLogs.map((log) => (
          <div key={log.id} className="log-item">
            <div className="log-icon-wrap">
              {log.action === 'login' ? <LuActivity /> : <LuHistory />}
            </div>
            <div className="log-content">
              <div className="log-header">
                <span className="log-action">{log.action}</span>
                <span className="log-date">{new Date(log.created_at).toLocaleString()}</span>
              </div>
              <p className="log-desc">{log.description}</p>
              <div className="log-meta">
                <span className="log-entity"><LuBox /> {log.entity_type}</span>
                {log.user_id && <span className="log-user"><LuUser /> User ID: {log.user_id}</span>}
              </div>
              {log.changes && (
                <div className="log-changes">
                  <pre>{JSON.stringify(JSON.parse(log.changes), null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        ))}
        {filteredLogs.length === 0 && <div className="no-data">No audit logs found.</div>}
      </div>
    </div>
  );
};

export default AuditLogs;
