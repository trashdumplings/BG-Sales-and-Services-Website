import React, { useState, useEffect } from 'react';
import { getSettings, updateSetting } from '../../../utils/api';
import { useAuth } from '../../../stores/AuthProvider';
import { LuSettings, LuSave, LuRefreshCw, LuInfo } from 'react-icons/lu';
import './SystemSettings.css';

const SystemSettings = () => {
  const { token } = useAuth();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(null); // Key being saved

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings(token);
      setSettings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchSettings();
  }, [token]);

  const handleUpdate = async (key, value) => {
    setSaving(key);
    try {
      await updateSetting(token, key, value);
      await fetchSettings();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(null);
    }
  };

  const handleValueChange = (key, newValue) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value: newValue } : s));
  };

  if (loading) return <div className="loading-state">Loading settings...</div>;

  const categories = [...new Set(settings.map(s => s.category))];

  return (
    <div className="system-settings-container">
      <div className="settings-header">
        <p>Manage global system parameters and application behavior.</p>
        <button className="refresh-btn" onClick={fetchSettings}><LuRefreshCw /> Refresh</button>
      </div>

      <div className="settings-grid">
        {categories.map(cat => (
          <div key={cat} className="settings-section">
            <h3 className="section-title">{cat}</h3>
            <div className="settings-list">
              {settings.filter(s => s.category === cat).map(setting => (
                <div key={setting.key} className="setting-item">
                  <div className="setting-info">
                    <label className="setting-key">{setting.key.replace(/_/g, ' ')}</label>
                    <p className="setting-desc">{setting.description}</p>
                  </div>
                  <div className="setting-action">
                    <input 
                      type="text" 
                      value={setting.value} 
                      onChange={(e) => handleValueChange(setting.key, e.target.value)}
                      className="setting-input"
                    />
                    <button 
                      className={`save-setting-btn ${saving === setting.key ? 'saving' : ''}`}
                      onClick={() => handleUpdate(setting.key, setting.value)}
                      disabled={saving === setting.key}
                    >
                      {saving === setting.key ? <LuRefreshCw className="spin" /> : <LuSave />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="settings-footer-info">
        <LuInfo />
        <p>Changes to system settings take effect immediately for all users.</p>
      </div>
    </div>
  );
};

export default SystemSettings;
