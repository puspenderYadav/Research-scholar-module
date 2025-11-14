import os

filepath = r"c:\Users\paridhi mittal\OneDrive\Desktop\publi\research\frontend\src\pages\MyCommitteeScholars.jsx"

# Read the existing file for backup
with open(filepath, 'r', encoding='utf-8') as f:
    backup = f.read()

# Save backup
with open(filepath + '.bak', 'w', encoding='utf-8') as f:
    f.write(backup)

#Write new content - I'll split this into chunks
part1 = """import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const MyCommitteeScholars = () => {
  const [scholars, setScholars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('scholars');
  const [filterType, setFilterType] = useState('all');
  const [pendingApprovals, setPendingApprovals] = useState({
    travel_grants: [],
    progress_reports: [],
    synopsis: [],
    thesis: []
  });
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCommitteeScholars();
  }, []);

  useEffect(() => {
    if (activeTab === 'approvals') {
      fetchPendingApprovals();
    }
  }, [activeTab]);

  const fetchCommitteeScholars = async () => {
    try {
      setLoading(true);
      const response = await api.get('/committees/my-committee-scholars');
      setScholars(response.data);
    } catch (err) {
      console.error('Error fetching committee scholars:', err);
      setError(err.response?.data?.error || 'Failed to load scholars');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      setApprovalsLoading(true);
      const travelGrantsResponse = await api.get('/travel-grants/pending');
      const progressReportsResponse = await api.get('/progress-reports/pending');
      const synopsisResponse = await api.get('/synopsis/pending');
      const thesisResponse = await api.get('/thesis/pending');

      setPendingApprovals({
        travel_grants: travelGrantsResponse.data || [],
        progress_reports: progressReportsResponse.data || [],
        synopsis: synopsisResponse.data || [],
        thesis: thesisResponse.data || []
      });
    } catch (err) {
      console.error('Error fetching pending approvals:', err);
    } finally {
      setApprovalsLoading(false);
    }
  };
"""

print("Writing file...")
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(part1)

print("File updated successfully - part 1 written")
