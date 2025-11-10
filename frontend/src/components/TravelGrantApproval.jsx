import React, { useState } from 'react'
import api from '../services/api'

const TravelGrantApproval = ({ grant, onApprovalComplete }) => {
  const [decision, setDecision] = useState('')
  const [comments, setComments] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!decision) {
      alert('Please select a decision (Approve or Reject)')
      return
    }

    if (decision === 'rejected' && !comments.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    setLoading(true)

    try {
      await api.post(`/travel-grants/${grant.id}/approve`, {
        decision,
        comments
      })

      alert(`Travel grant ${decision} successfully!`)
      onApprovalComplete()
    } catch (error) {
      console.error('Error processing approval:', error)
      alert(error.response?.data?.error || 'Failed to process approval. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStageLabel = (stage) => {
    const labels = {
      'supervisor': 'Supervisor',
      'dc': 'Doctoral Committee',
      'school_chair': 'School Chair',
      'ad_research': 'AD Research',
      'dean_academics': 'Dean Academics'
    }
    return labels[stage] || stage
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">Review Travel Grant Application</h3>
      
      {/* Grant Details Summary */}
      <div className="bg-gray-50 p-4 rounded-md mb-6 space-y-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-medium">Grant Type:</span>
            <span className="ml-2 text-gray-700">{grant.grant_type}</span>
          </div>
          <div>
            <span className="font-medium">Event Name:</span>
            <span className="ml-2 text-gray-700">{grant.event_name}</span>
          </div>
          <div>
            <span className="font-medium">Venue:</span>
            <span className="ml-2 text-gray-700">{grant.venue_country}</span>
          </div>
          <div>
            <span className="font-medium">Anticipated Expenses:</span>
            <span className="ml-2 text-gray-700">₹{grant.anticipated_expenses?.toLocaleString()}</span>
          </div>
        </div>
        <div className="pt-2">
          <span className="font-medium">Current Stage:</span>
          <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            {getStageLabel(grant.current_stage)}
          </span>
        </div>
      </div>

      {/* Approval Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Decision <span className="text-red-500">*</span>
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="decision"
                value="approved"
                checked={decision === 'approved'}
                onChange={(e) => setDecision(e.target.value)}
                className="mr-2"
              />
              <span className="text-green-600 font-medium">Approve</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="decision"
                value="rejected"
                checked={decision === 'rejected'}
                onChange={(e) => setDecision(e.target.value)}
                className="mr-2"
              />
              <span className="text-red-600 font-medium">Reject</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Comments {decision === 'rejected' && <span className="text-red-500">*</span>}
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows="4"
            placeholder={decision === 'rejected' ? 'Please provide reason for rejection' : 'Optional comments'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 rounded-md text-white font-medium ${
              decision === 'approved' 
                ? 'bg-green-600 hover:bg-green-700' 
                : decision === 'rejected'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gray-400 cursor-not-allowed'
            } disabled:opacity-50`}
          >
            {loading ? 'Processing...' : 'Submit Decision'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default TravelGrantApproval
