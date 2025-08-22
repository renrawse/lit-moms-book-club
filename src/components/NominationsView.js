import React, { useState } from 'react';
import { Plus, Database, Calendar, Vote, Clock, CheckCircle, XCircle, BookOpen } from 'lucide-react';

const NominationsView = ({ 
  nominations_period,
  recentPeriods,
  periodNominations,
  userHasNominated,
  newNomination, 
  setNewNomination, 
  addNomination, 
  loading,
  currentUser 
}) => {
  const [showNominationForm, setShowNominationForm] = useState(false);

  // Get current period nominations
  const currentNominations = nominations_period && periodNominations[nominations_period.id] 
    ? periodNominations[nominations_period.id] 
    : [];

  // Get past periods (excluding current)
  const pastPeriods = recentPeriods.filter(period => !period.isCurrent).slice(0, 3);

  const handleSubmitNomination = async () => {
    await addNomination();
    setShowNominationForm(false);
  };

  const NominationCard = ({ nomination }) => (
    <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-purple-500">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-lg">{nomination.title}</h4>
        <span className="text-gray-500 text-sm flex items-center gap-1">
          <Vote className="w-4 h-4" />
          Nominated
        </span>
      </div>
      <p className="text-gray-700 mb-2">by <span className="font-medium">{nomination.author}</span></p>
      <p className="text-gray-600 text-sm mb-2">{nomination.description}</p>
      <p className="text-purple-600 text-sm italic">"{nomination.why_nominate}"</p>
      <p className="text-xs text-gray-500 mt-2">Nominated by: {nomination.nominator}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center">
          <BookOpen className="w-8 h-8 mr-3 text-purple-500" />
          Book Nominations
        </h2>
        {loading && <Database className="w-5 h-5 animate-spin text-gray-500" />}
      </div>

      {/* Current Nomination Period */}
      {nominations_period && (
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold text-purple-700 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {nominations_period.title}
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                {new Date(nominations_period.startDate).toLocaleDateString()} - {new Date(nominations_period.endDate).toLocaleDateString()}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {nominations_period.isOpen ? (
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    <CheckCircle className="w-3 h-3" />
                    Open for Nominations
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    <Clock className="w-3 h-3" />
                    Voting Phase
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  {currentNominations.length} / {nominations_period.nominationLimit || 10} nominations
                </span>
              </div>
            </div>
            
            {nominations_period.isOpen && !userHasNominated && (
              <button
                onClick={() => setShowNominationForm(true)}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nominate Book
              </button>
            )}
            
            {userHasNominated && nominations_period.isOpen && (
              <span className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Already Nominated
              </span>
            )}
          </div>

          {/* Nomination Form */}
          {showNominationForm && (
            <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-purple-800">Submit Your Nomination</h4>
                <button
                  onClick={() => setShowNominationForm(false)}
                  className="text-purple-600 hover:text-purple-800"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Book title"
                  value={newNomination.title}
                  onChange={(e) => setNewNomination({...newNomination, title: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="text"
                  placeholder="Author"
                  value={newNomination.author}
                  onChange={(e) => setNewNomination({...newNomination, author: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <textarea
                placeholder="Book description or summary"
                value={newNomination.description}
                onChange={(e) => setNewNomination({...newNomination, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                rows="3"
              />
              
              <textarea
                placeholder="Why do you want to nominate this book?"
                value={newNomination.why}
                onChange={(e) => setNewNomination({...newNomination, why: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                rows="3"
              />
              
              <div className="flex gap-2">
                <button
                  onClick={handleSubmitNomination}
                  disabled={loading || !newNomination.title || !newNomination.author || !newNomination.description || !newNomination.why}
                  className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {loading ? 'Submitting...' : 'Submit Nomination'}
                </button>
                <button
                  onClick={() => setShowNominationForm(false)}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Current Period Nominations */}
          <div className="space-y-4">
            {currentNominations.length > 0 ? (
              currentNominations.map(nomination => (
                <NominationCard 
                  key={nomination.id} 
                  nomination={nomination} 
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No nominations yet for this period.</p>
                {nominations_period.isOpen && (
                  <p className="text-sm">Be the first to nominate a book!</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Current Nomination Period */}
      {!nominations_period && (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Active Nomination Period</h3>
            <p className="text-gray-600">
              There is currently no active nomination period. An admin needs to create a new one to start accepting book nominations.
            </p>
          </div>
        </div>
      )}

      {/* Past Periods */}
      {pastPeriods.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Past Periods
          </h3>
          
          {pastPeriods.map(period => {
            const periodNoms = periodNominations[period.id] || [];
            return (
              <div key={period.id} className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-700">{period.title}</h4>
                    <p className="text-gray-600 text-sm">
                      {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                    </p>
                    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium mt-2">
                      <XCircle className="w-3 h-3" />
                      Closed
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {periodNoms.length} nominations
                  </span>
                </div>
                
                <div className="space-y-3">
                  {periodNoms.length > 0 ? (
                    periodNoms.map(nomination => (
                      <NominationCard 
                        key={nomination.id} 
                        nomination={nomination} 
                      />
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm italic">No nominations were submitted for this period.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NominationsView;