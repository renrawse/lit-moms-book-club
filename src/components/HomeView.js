import React, { useState, useEffect } from 'react';
import { Calendar, Vote, Award, Database, CheckCircle, BookOpen } from 'lucide-react';
import StarRating from './StarRating';

const HomeView = ({ 
  currentUser, 
  books, 
  nominations_period, 
  members, 
  votingRounds,
  votingResults,
  userVotes,
  selectedVotes,
  setSelectedVotes,
  submitVote,
  periodNominations,
  loading 
}) => {
  const [votingError, setVotingError] = useState('');

  // Find the current open voting round
  const openVotingRound = votingRounds && votingRounds.find(round => round.isOpen);
  
  // Get nominations for the voting round's nomination period (not necessarily the current period)
  const votingNominations = openVotingRound && periodNominations[openVotingRound.nominationPeriodId] 
    ? periodNominations[openVotingRound.nominationPeriodId] 
    : [];

  // Debug logging - temporarily add this to help troubleshoot
  console.log('🔍 HomeView Debug:', {
    hasVotingRounds: !!votingRounds,
    votingRoundsCount: votingRounds?.length || 0,
    votingRounds: votingRounds,
    openVotingRound: openVotingRound,
    hasOpenRound: !!openVotingRound,
    votingNominationsCount: votingNominations.length,
    periodNominations: Object.keys(periodNominations || {}),
    selectedVotingRoundPeriod: openVotingRound?.nominationPeriodId
  });

  // Get user's current votes for the open round, memoized to avoid unnecessary useEffect triggers
  const currentUserVotes = React.useMemo(() => {
    return openVotingRound && userVotes[openVotingRound.id]
      ? userVotes[openVotingRound.id]
      : [];
  }, [openVotingRound, userVotes]);

  // Initialize selected votes if not already done
  useEffect(() => {
    if (openVotingRound && !selectedVotes[openVotingRound.id]) {
      setSelectedVotes(prev => ({
        ...prev,
        [openVotingRound.id]: [...currentUserVotes]
      }));
    }
  }, [openVotingRound, currentUserVotes, selectedVotes, setSelectedVotes]);

  const handleVoteToggle = (nominationId) => {
    if (!openVotingRound) return;

    const roundId = openVotingRound.id;
    const currentSelections = selectedVotes[roundId] || [];
    
    if (currentSelections.includes(nominationId)) {
      // Remove vote
      setSelectedVotes(prev => ({
        ...prev,
        [roundId]: currentSelections.filter(id => id !== nominationId)
      }));
    } else {
      // Add vote if under limit
      if (currentSelections.length < openVotingRound.maxSelections) {
        setSelectedVotes(prev => ({
          ...prev,
          [roundId]: [...currentSelections, nominationId]
        }));
      } else {
        setVotingError(`You can only select up to ${openVotingRound.maxSelections} books`);
        setTimeout(() => setVotingError(''), 3000);
      }
    }
  };

  const handleSubmitVotes = async () => {
    if (!openVotingRound) return;
    
    const roundId = openVotingRound.id;
    const selections = selectedVotes[roundId] || [];
    
    if (selections.length === 0) {
      setVotingError('Please select at least one book');
      setTimeout(() => setVotingError(''), 3000);
      return;
    }

    try {
      await submitVote(roundId, selections);
      setVotingError('');
    } catch (error) {
      setVotingError('Failed to submit votes');
      setTimeout(() => setVotingError(''), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2 flex items-center">
          Welcome to Lit Moms Book Club! 📚
          {loading && <Database className="w-5 h-5 ml-2 animate-spin" />}
        </h2>
        <p className="text-purple-100">Your points: {currentUser.points}</p>
      </div>

      {/* Temporary Debug Section - Remove after fixing */}
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">🔧 Voting Debug Info:</h3>
        <div className="text-sm text-yellow-700 space-y-1">
          <div>Voting Rounds Available: {votingRounds?.length || 0}</div>
          <div>Open Voting Round: {openVotingRound ? '✅ YES' : '❌ NO'}</div>
          {openVotingRound && (
            <div>Open Round: {openVotingRound.title} (Period: {openVotingRound.nominationPeriodId})</div>
          )}
          <div>Period Nominations Available: {Object.keys(periodNominations || {}).join(', ')}</div>
          <div>Voting Nominations Count: {votingNominations.length}</div>
        </div>
      </div>

      {/* Voting Section */}
      {openVotingRound && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-blue-700 flex items-center gap-2">
              <Vote className="w-6 h-6" />
              {openVotingRound.title}
            </h3>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              Voting Open
            </span>
          </div>
          
          <p className="text-gray-600 text-sm mb-4">{openVotingRound.description}</p>
          
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-800">
                Select up to <strong>{openVotingRound.maxSelections}</strong> books
              </span>
              <span className="text-blue-600">
                {selectedVotes[openVotingRound.id]?.length || 0} / {openVotingRound.maxSelections} selected
              </span>
            </div>
          </div>

          {votingError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {votingError}
            </div>
          )}

          <div className="space-y-3 mb-6">
            {votingNominations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No nominations available for voting.</p>
                <p className="text-sm">Check if nominations have been loaded or if there's a data issue.</p>
              </div>
            ) : (
              votingNominations.map(nomination => {
                const isSelected = selectedVotes[openVotingRound.id]?.includes(nomination.id);
                const userAlreadyVoted = currentUserVotes.includes(nomination.id);
                
                return (
                  <div 
                    key={nomination.id} 
                    className={`p-4 rounded-lg border-2 transition-all ${
                      userAlreadyVoted
                        ? 'border-green-500 bg-green-50'
                        : isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 bg-gray-50'
                    } ${!userAlreadyVoted ? 'hover:border-gray-300' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Checkbox for voting */}
                        <div className="mt-1">
                          <input
                            type="checkbox"
                            id={`nomination-${nomination.id}`}
                            checked={isSelected || userAlreadyVoted}
                            disabled={userAlreadyVoted}
                            onChange={() => !userAlreadyVoted && handleVoteToggle(nomination.id)}
                            className={`w-5 h-5 rounded border-2 focus:ring-2 focus:ring-blue-500 ${
                              userAlreadyVoted
                                ? 'bg-green-500 border-green-500 cursor-not-allowed'
                                : isSelected
                                ? 'bg-blue-500 border-blue-500'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          />
                        </div>
                        
                        <div className="flex-1">
                          <label 
                            htmlFor={`nomination-${nomination.id}`}
                            className={`block ${!userAlreadyVoted ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                          >
                            <h4 className="font-semibold text-lg mb-1">{nomination.title}</h4>
                            <p className="text-gray-700 mb-1">
                              by <span className="font-medium">{nomination.author}</span>
                            </p>
                            <p className="text-gray-600 text-sm mb-2">{nomination.description}</p>
                            <p className="text-purple-600 text-sm italic mb-2">"{nomination.why_nominate}"</p>
                            <p className="text-xs text-gray-500">Nominated by: {nomination.nominator}</p>
                          </label>
                        </div>
                      </div>
                      
                      {userAlreadyVoted && currentUserVotes.includes(nomination.id) && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium ml-3">
                          Your Vote
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {currentUserVotes.length === 0 ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <button
                  onClick={handleSubmitVotes}
                  disabled={loading || !selectedVotes[openVotingRound.id]?.length}
                  className={`px-8 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                    selectedVotes[openVotingRound.id]?.length 
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Vote className="w-5 h-5" />
                  {loading 
                    ? 'Submitting...' 
                    : selectedVotes[openVotingRound.id]?.length 
                    ? `Submit ${selectedVotes[openVotingRound.id].length} Selection${selectedVotes[openVotingRound.id].length === 1 ? '' : 's'}`
                    : 'Select Books to Vote'
                  }
                </button>
              </div>
              
              {!selectedVotes[openVotingRound.id]?.length && (
                <div className="text-center">
                  <p className="text-gray-500 text-sm">
                    Please select up to {openVotingRound.maxSelections} books using the checkboxes above
                  </p>
                </div>
              )}
              
              {selectedVotes[openVotingRound.id]?.length > 0 && (
                <div className="text-center">
                  <p className="text-blue-600 text-sm">
                    {selectedVotes[openVotingRound.id].length} of {openVotingRound.maxSelections} books selected
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-green-800 font-medium">You have already voted in this round!</p>
              <p className="text-green-600 text-sm">You voted for {currentUserVotes.length} book(s)</p>
            </div>
          )}
        </div>
      )}
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Currently Reading
        </h3>
        {books.length > 0 && (
          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="font-medium">{books[0].title}</h4>
            <p className="text-gray-600">by {books[0].author}</p>
            <StarRating rating={books[0].rating} readonly />
          </div>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Vote className="w-5 h-5 mr-2" />
          Nomination Status
        </h3>
        {nominations_period ? (
          nominations_period.isOpen ? (
            <div className="text-green-600">
              <p>Nominations are open!</p>
              <p className="text-sm text-gray-600">
                Ends: {new Date(nominations_period.endDate).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <div className="text-blue-600">
              <p>Voting in progress</p>
              <p className="text-sm text-gray-600">Check back for results</p>
            </div>
          )
        ) : (
          <div className="text-gray-600">
            <p>No active nomination period</p>
            <p className="text-sm text-gray-500">An admin needs to create a new nomination period</p>
          </div>
        )}
      </div>
    </div>

    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Award className="w-5 h-5 mr-2" />
        Top Members This Month
      </h3>
      <div className="space-y-2">
        {members
          .sort((a, b) => b.points - a.points)
          .slice(0, 5)
          .map((member, index) => (
            <div key={member.id} className="flex justify-between items-center py-2">
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-yellow-100 text-yellow-800' :
                  index === 1 ? 'bg-gray-100 text-gray-800' :
                  index === 2 ? 'bg-orange-100 text-orange-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {index + 1}
                </span>
                <span className={member.id === currentUser.id ? 'font-bold text-purple-600' : ''}>
                  {member.name}
                </span>
              </div>
              <span className="font-semibold">{member.points} pts</span>
            </div>
          ))}
      </div>
    </div>
  </div>
  );
};

export default HomeView;