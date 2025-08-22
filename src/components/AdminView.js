import React, { useState, useEffect } from 'react';
import { Settings, Users, Calendar, Plus, Edit, X, Check, Vote, Trophy, Play, Square } from 'lucide-react';

const AdminView = ({
  members,
  nominations_period,
  periodNominations,
  votingRounds,
  votingResults,
  userVotes,
  newMember,
  setNewMember,
  addMember,
  pointsToAdd,
  setPointsToAdd,
  addPoints,
  nominations,
  setNominations,
  updateNominationPeriod,
  newNominationPeriod,
  setNewNominationPeriod,
  createNominationPeriod,
  updateNominationPeriodDetails,
  createVotingRound,
  updateVotingRound,
  refreshVotingData,
  recentPeriods,
  loading
}) => {
  const [showCreatePeriod, setShowCreatePeriod] = useState(false);
  const [showEditPeriod, setShowEditPeriod] = useState(false);
  const [editPeriodData, setEditPeriodData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    isOpen: true,
    nominationLimit: 10
  });
  const [showCreateVotingRound, setShowCreateVotingRound] = useState(false);
  const [newVotingRound, setNewVotingRound] = useState({
    roundNumber: 1,
    title: '',
    description: '',
    maxSelections: 3,
    selectedPeriodId: null
  });
  const [availableNominations, setAvailableNominations] = useState([]);

  // Get available nomination periods (including current and recent)
  const allAvailablePeriods = [
    ...(nominations_period ? [nominations_period] : []),
    ...(recentPeriods || [])
  ].filter((period, index, arr) => 
    // Remove duplicates based on ID
    arr.findIndex(p => p.id === period.id) === index
  );

  // Handle nomination period selection for voting round
  useEffect(() => {
    const handlePeriodChange = async () => {
      if (!newVotingRound.selectedPeriodId) {
        setAvailableNominations([]);
        return;
      }

      const selectedPeriodNominations = periodNominations[newVotingRound.selectedPeriodId] || [];
      
      if (newVotingRound.roundNumber === 1) {
        // Round 1: Show all nominations for the period
        setAvailableNominations(selectedPeriodNominations);
      } else if (newVotingRound.roundNumber === 2) {
        // Round 2: Show only top books from previous round
        try {
          // Find the previous round 1 for this period
          const previousRound = votingRounds?.find(round => 
            round.nominationPeriodId === newVotingRound.selectedPeriodId && 
            round.roundNumber === 1
          );
          
          if (previousRound && votingResults[previousRound.id]) {
            // Get top 2 books from round 1 results (for Round 2 final selection)
            const topBooks = votingResults[previousRound.id]
              .sort((a, b) => b.voteCount - a.voteCount)
              .slice(0, 2);
            
            console.log('Round 2 filtering - Previous round results:', votingResults[previousRound.id]);
            console.log('Round 2 filtering - Top 2 books:', topBooks);
            
            // Filter nominations to only include the top voted books
            const filteredNominations = selectedPeriodNominations.filter(nom => 
              topBooks.some(book => book.nominationId === nom.id)
            );
            
            console.log('Round 2 filtering - Filtered nominations:', filteredNominations);
            setAvailableNominations(filteredNominations);
          } else {
            console.log('Round 2 filtering - No previous round found or no results:', { 
              previousRound, 
              hasResults: !!votingResults[previousRound?.id] 
            });
            // No previous round found, show all nominations
            setAvailableNominations(selectedPeriodNominations);
          }
        } catch (error) {
          console.error('Error filtering nominations for round 2:', error);
          setAvailableNominations(selectedPeriodNominations);
        }
      }
    };

    handlePeriodChange();
  }, [newVotingRound.selectedPeriodId, newVotingRound.roundNumber, periodNominations, votingRounds, votingResults]);

  // Initialize edit data when editing is triggered
  useEffect(() => {
    if (showEditPeriod && nominations_period) {
      setEditPeriodData({
        title: nominations_period.title || '',
        startDate: nominations_period.startDate || '',
        endDate: nominations_period.endDate || '',
        isOpen: nominations_period.isOpen || false,
        nominationLimit: nominations_period.nominationLimit || 10
      });
    }
  }, [showEditPeriod, nominations_period]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-6 h-6 text-red-500" />
        <h2 className="text-2xl font-bold text-red-700">Admin Dashboard</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Member Points Management
          </h3>
          <div className="space-y-3 mb-6">
            {members.map(member => (
              <div key={member.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium">{member.name}</span>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
                <span className="font-bold text-purple-600">{member.points} pts</span>
              </div>
            ))}
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium mb-3 text-blue-800">Add Points to Member</h4>
            <div className="space-y-3">
              <select
                value={pointsToAdd.memberId}
                onChange={(e) => setPointsToAdd({...pointsToAdd, memberId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select member</option>
                {members.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Points to add"
                value={pointsToAdd.points}
                onChange={(e) => setPointsToAdd({...pointsToAdd, points: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Reason (e.g., 'Meeting attendance', 'Book review')"
                value={pointsToAdd.reason}
                onChange={(e) => setPointsToAdd({...pointsToAdd, reason: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addPoints}
                disabled={loading}
                className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding Points...' : 'Add Points'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Nomination Period Management
            </div>
            <button
              onClick={() => setShowCreatePeriod(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Period
            </button>
          </h3>

          {/* Current Period Display */}
          {nominations_period && !showEditPeriod && (
            <div className="p-4 bg-gray-50 rounded-lg mb-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium text-lg">{nominations_period.title}</h4>
                  <p className="text-gray-600 mt-1">
                    {new Date(nominations_period.startDate).toLocaleDateString()} - {new Date(nominations_period.endDate).toLocaleDateString()}
                  </p>
                  <div className="mt-2 space-y-1">
                    <div>
                      <span className="text-sm">Status: </span>
                      <span className={`font-medium ${nominations_period.isOpen ? "text-green-600" : "text-red-600"}`}>
                        {nominations_period.isOpen ? "Open for Nominations" : "Closed - Voting Phase"}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm">Nomination Limit: </span>
                      <span className="font-medium">{nominations_period.nominationLimit || 10}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditPeriod(true)}
                  className="text-blue-500 hover:text-blue-700 p-2"
                >
                  <Edit className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => updateNominationPeriod(!nominations_period.isOpen)}
                  disabled={loading}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                    nominations_period.isOpen 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {loading ? 'Updating...' : (nominations_period.isOpen ? 'Close Period' : 'Open Period')}
                </button>
              </div>
            </div>
          )}

          {/* No Current Period */}
          {!nominations_period && !showCreatePeriod && (
            <div className="p-4 bg-yellow-50 rounded-lg mb-4 border border-yellow-200">
              <div className="text-center py-4">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
                <h4 className="font-medium text-yellow-800 mb-2">No Active Nomination Period</h4>
                <p className="text-yellow-700 text-sm mb-4">
                  Create a new nomination period to start accepting book nominations from members.
                </p>
                <button
                  onClick={() => setShowCreatePeriod(true)}
                  className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Create First Period
                </button>
              </div>
            </div>
          )}

          {/* Edit Period Form */}
          {showEditPeriod && nominations_period && (
            <div className="p-4 bg-blue-50 rounded-lg mb-4 border border-blue-200">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-blue-800">Edit Nomination Period</h4>
                <button
                  onClick={() => setShowEditPeriod(false)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Period title"
                  value={editPeriodData.title}
                  onChange={(e) => setEditPeriodData({...editPeriodData, title: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Nomination limit"
                  value={editPeriodData.nominationLimit}
                  onChange={(e) => setEditPeriodData({...editPeriodData, nominationLimit: parseInt(e.target.value)})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={editPeriodData.startDate}
                  onChange={(e) => setEditPeriodData({...editPeriodData, startDate: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={editPeriodData.endDate}
                  onChange={(e) => setEditPeriodData({...editPeriodData, endDate: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mt-4 flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editPeriodData.isOpen}
                    onChange={(e) => setEditPeriodData({...editPeriodData, isOpen: e.target.checked})}
                    className="mr-2"
                  />
                  Open for nominations
                </label>
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={async () => {
                    await updateNominationPeriodDetails({
                      ...nominations_period,
                      title: editPeriodData.title,
                      startDate: editPeriodData.startDate,
                      endDate: editPeriodData.endDate,
                      isOpen: editPeriodData.isOpen,
                      nominationLimit: editPeriodData.nominationLimit
                    });
                    setShowEditPeriod(false);
                  }}
                  disabled={loading}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setShowEditPeriod(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Create New Period Form */}
          {showCreatePeriod && (
            <div className="p-4 bg-green-50 rounded-lg mb-4 border border-green-200">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-green-800">Create New Nomination Period</h4>
                <button
                  onClick={() => setShowCreatePeriod(false)}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Period title"
                  value={newNominationPeriod.title}
                  onChange={(e) => setNewNominationPeriod({...newNominationPeriod, title: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="number"
                  placeholder="Nomination limit (default: 10)"
                  value={newNominationPeriod.nominationLimit}
                  onChange={(e) => setNewNominationPeriod({...newNominationPeriod, nominationLimit: parseInt(e.target.value)})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="date"
                  value={newNominationPeriod.startDate}
                  onChange={(e) => setNewNominationPeriod({...newNominationPeriod, startDate: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="date"
                  value={newNominationPeriod.endDate}
                  onChange={(e) => setNewNominationPeriod({...newNominationPeriod, endDate: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div className="mt-4 flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newNominationPeriod.isOpen}
                    onChange={(e) => setNewNominationPeriod({...newNominationPeriod, isOpen: e.target.checked})}
                    className="mr-2"
                  />
                  Open for nominations immediately
                </label>
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={async () => {
                    await createNominationPeriod();
                    setShowCreatePeriod(false);
                  }}
                  disabled={loading || !newNominationPeriod.title || !newNominationPeriod.startDate || !newNominationPeriod.endDate}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {loading ? 'Creating...' : 'Create Period'}
                </button>
                <button
                  onClick={() => setShowCreatePeriod(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Period Summary */}
          {nominations_period && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-800 mb-2">Current Period Summary</h4>
              <div className="text-sm text-yellow-700 space-y-1">
                <p>Active nominations: {nominations?.length || 0} / {nominations_period.nominationLimit || 10}</p>
                <p>Period: {nominations_period.title}</p>
                <p>Status: {nominations_period.isOpen ? 'Accepting nominations' : 'Voting phase'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Voting Rounds Management */}
      {nominations_period && !nominations_period.isOpen && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
            <div className="flex items-center">
              <Vote className="w-5 h-5 mr-2" />
              Voting Rounds Management
            </div>
            <button
              onClick={() => setShowCreateVotingRound(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Round
            </button>
          </h3>

          {/* Create Voting Round Form */}
          {showCreateVotingRound && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-green-800">Create Voting Round</h4>
                <button
                  onClick={() => {
                    setShowCreateVotingRound(false);
                    setNewVotingRound({
                      roundNumber: 1,
                      title: '',
                      description: '',
                      maxSelections: 3,
                      selectedPeriodId: null
                    });
                    setAvailableNominations([]);
                  }}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Nomination Period Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Nomination Period
                </label>
                <select
                  value={newVotingRound.selectedPeriodId || ''}
                  onChange={(e) => {
                    const periodId = e.target.value || null;
                    setNewVotingRound({
                      ...newVotingRound, 
                      selectedPeriodId: periodId
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">-- Select a nomination period --</option>
                  {allAvailablePeriods.map(period => (
                    <option key={period.id} value={period.id}>
                      {period.title} ({period.isOpen ? 'Open' : 'Closed'}) - {period.id === nominations_period?.id ? 'Current' : 'Past'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Show preview of available nominations */}
              {newVotingRound.selectedPeriodId && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h5 className="text-sm font-medium text-blue-800 mb-2">
                    Available Books for Voting ({availableNominations.length})
                  </h5>
                  {availableNominations.length === 0 ? (
                    <p className="text-sm text-blue-600">No nominations found for this period.</p>
                  ) : (
                    <div className="space-y-1">
                      {availableNominations.slice(0, 3).map(nomination => (
                        <div key={nomination.id} className="text-sm text-blue-700">
                          • {nomination.title} by {nomination.author}
                        </div>
                      ))}
                      {availableNominations.length > 3 && (
                        <div className="text-sm text-blue-600 italic">
                          ... and {availableNominations.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                  {newVotingRound.roundNumber === 2 && availableNominations.length > 0 && (
                    <p className="text-xs text-blue-600 mt-2 italic">
                      * Round 2 shows only the top 2 books from Round 1 voting
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <select
                  value={newVotingRound.roundNumber}
                  onChange={(e) => {
                    const roundNum = parseInt(e.target.value);
                    setNewVotingRound({
                      ...newVotingRound, 
                      roundNumber: roundNum,
                      maxSelections: roundNum === 1 ? 3 : 1,
                      title: roundNum === 1 ? 'Round 1 - Select Top 3' : 'Round 2 - Final Selection'
                    });
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value={1}>Round 1 (Top 3 Selection)</option>
                  <option value={2}>Round 2 (Final Selection)</option>
                </select>
                
                <input
                  type="number"
                  placeholder="Max selections"
                  value={newVotingRound.maxSelections}
                  onChange={(e) => setNewVotingRound({...newVotingRound, maxSelections: parseInt(e.target.value)})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <input
                type="text"
                placeholder="Round title"
                value={newVotingRound.title}
                onChange={(e) => setNewVotingRound({...newVotingRound, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"
              />

              <textarea
                placeholder="Round description (optional)"
                value={newVotingRound.description}
                onChange={(e) => setNewVotingRound({...newVotingRound, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"
                rows="2"
              />

              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (!newVotingRound.selectedPeriodId) {
                      alert('Please select a nomination period');
                      return;
                    }
                    
                    await createVotingRound({
                      periodId: newVotingRound.selectedPeriodId,
                      roundNumber: newVotingRound.roundNumber,
                      title: newVotingRound.title,
                      description: newVotingRound.description,
                      maxSelections: newVotingRound.maxSelections
                    });
                    
                    setShowCreateVotingRound(false);
                    setNewVotingRound({
                      roundNumber: 1,
                      title: '',
                      description: '',
                      maxSelections: 3,
                      selectedPeriodId: null
                    });
                    setAvailableNominations([]);
                    await refreshVotingData(newVotingRound.selectedPeriodId);
                  }}
                  disabled={loading || !newVotingRound.title || !newVotingRound.selectedPeriodId || availableNominations.length === 0}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {loading ? 'Creating...' : 'Create Round'}
                </button>
                
                {(!newVotingRound.selectedPeriodId || availableNominations.length === 0) && (
                  <div className="flex items-center text-sm text-gray-600">
                    {!newVotingRound.selectedPeriodId ? 'Select a nomination period' : 'No books available for voting'}
                  </div>
                )}
                
                <button
                  onClick={() => {
                    setShowCreateVotingRound(false);
                    setNewVotingRound({
                      roundNumber: 1,
                      title: '',
                      description: '',
                      maxSelections: 3,
                      selectedPeriodId: null
                    });
                    setAvailableNominations([]);
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Existing Voting Rounds */}
          <div className="space-y-4">
            {votingRounds && votingRounds.length > 0 ? (
              votingRounds.map(round => {
                // const roundNominations = periodNominations[nominations_period.id] || [];
                const results = votingResults[round.id] || [];
                const totalVotes = results.reduce((sum, result) => sum + result.voteCount, 0);

                return (
                  <div key={round.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-lg">{round.title}</h4>
                        <p className="text-gray-600 text-sm">{round.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            round.isOpen ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {round.isOpen ? (
                              <>
                                <Play className="w-3 h-3" />
                                Open
                              </>
                            ) : (
                              <>
                                <Square className="w-3 h-3" />
                                Closed
                              </>
                            )}
                          </span>
                          <span className="text-xs text-gray-500">
                            Max selections: {round.maxSelections} | Total votes: {totalVotes}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={async () => {
                          await updateVotingRound(round.id, { isOpen: !round.isOpen });
                          await refreshVotingData(nominations_period.id);
                        }}
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                          round.isOpen 
                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        {loading ? 'Updating...' : (round.isOpen ? 'Close Round' : 'Open Round')}
                      </button>
                    </div>

                    {/* Voting Results */}
                    {results.length > 0 && (
                      <div className="mt-4">
                        <h5 className="font-medium mb-3 flex items-center gap-2">
                          <Trophy className="w-4 h-4" />
                          Current Results
                        </h5>
                        <div className="space-y-2">
                          {results
                            .sort((a, b) => b.voteCount - a.voteCount)
                            .map((result, index) => (
                              <div key={result.nominationId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mr-3 ${
                                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                    index === 1 ? 'bg-gray-100 text-gray-800' :
                                    index === 2 ? 'bg-orange-100 text-orange-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {index + 1}
                                  </span>
                                  <span className="font-medium">{result.bookTitle}</span>
                                  <span className="text-gray-600 text-sm ml-2">by {result.author}</span>
                                </div>
                                <span className="font-semibold text-blue-600">{result.voteCount} votes</span>
                              </div>
                            ))}
                        </div>

                        {/* Auto-generate Round 2 suggestion */}
                        {round.roundNumber === 1 && !round.isOpen && results.length >= 2 && 
                         !votingRounds.some(r => r.roundNumber === 2) && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-blue-800 text-sm mb-2">
                              Round 1 is complete! Create Round 2 with the top 2 books:
                            </p>
                            <div className="text-xs text-blue-600">
                              1. {results[0]?.bookTitle} ({results[0]?.voteCount} votes)<br/>
                              2. {results[1]?.bookTitle} ({results[1]?.voteCount} votes)
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Vote className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No voting rounds created yet.</p>
                <p className="text-sm">Create a voting round to let members vote on nominations.</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Add New Member
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Member name"
            value={newMember.name}
            onChange={(e) => setNewMember({...newMember, name: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="email"
            placeholder="Email address"
            value={newMember.email}
            onChange={(e) => setNewMember({...newMember, email: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="number"
            placeholder="Initial points (optional)"
            value={newMember.points}
            onChange={(e) => setNewMember({...newMember, points: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <button
          onClick={addMember}
          disabled={loading}
          className="mt-4 bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding Member...' : 'Add Member'}
        </button>
      </div>
    </div>
  );
};

export default AdminView;