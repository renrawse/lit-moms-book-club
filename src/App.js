import React from 'react';
import { useBookClub } from './hooks/useBookClub';
import Navigation from './components/Navigation';
import HomeView from './components/HomeView';
import BooksView from './components/BooksView';
import NominationsView from './components/NominationsView';
import AdminView from './components/AdminView';
import SignIn from './components/SignIn';

function App() {
  const {
    currentView,
    setCurrentView,
    isAdmin,
    setIsAdmin,
    loading,
    error,
    setError,
    currentUser,
    isAuthenticated,
    signIn,
    signOut,
    books,
    nominations,
    members,
    nominations_period,
    recentPeriods,
    periodNominations,
    userHasNominated,
    votingRounds,
    votingResults,
    userVotes,
    selectedVotes,
    setSelectedVotes,
    newNomination,
    setNewNomination,
    newMember,
    setNewMember,
    pointsToAdd,
    setPointsToAdd,
    newNominationPeriod,
    setNewNominationPeriod,
    addNomination,
    addMember,
    addPoints,
    updateNominationPeriod,
    createNominationPeriod,
    updateNominationPeriodDetails,
    createVotingRound,
    updateVotingRound,
    submitVote,
    refreshVotingData
  } = useBookClub();

  // Show sign-in page if not authenticated
  if (!isAuthenticated) {
    return (
      <SignIn 
        onSignIn={signIn}
        loading={loading}
        error={error}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        currentView={currentView}
        setCurrentView={setCurrentView}
        isAdmin={isAdmin}
        setIsAdmin={setIsAdmin}
        currentUser={currentUser}
        onSignOut={signOut}
      />
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
            <button 
              onClick={() => setError('')}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}
        
        {isAdmin ? (
          <AdminView
            members={members}
            nominations_period={nominations_period}
            nominations={nominations}
            periodNominations={periodNominations}
            votingRounds={votingRounds}
            votingResults={votingResults}
            userVotes={userVotes}
            newMember={newMember}
            setNewMember={setNewMember}
            pointsToAdd={pointsToAdd}
            setPointsToAdd={setPointsToAdd}
            newNominationPeriod={newNominationPeriod}
            setNewNominationPeriod={setNewNominationPeriod}
            addMember={addMember}
            addPoints={addPoints}
            updateNominationPeriod={updateNominationPeriod}
            createNominationPeriod={createNominationPeriod}
            updateNominationPeriodDetails={updateNominationPeriodDetails}
            createVotingRound={createVotingRound}
            updateVotingRound={updateVotingRound}
            refreshVotingData={refreshVotingData}
            recentPeriods={recentPeriods}
            loading={loading}
          />
        ) : (
          <>
            {currentView === 'home' && (
              <HomeView
                currentUser={currentUser}
                books={books}
                nominations_period={nominations_period}
                members={members}
                votingRounds={votingRounds}
                votingResults={votingResults}
                userVotes={userVotes}
                selectedVotes={selectedVotes}
                setSelectedVotes={setSelectedVotes}
                submitVote={submitVote}
                periodNominations={periodNominations}
                loading={loading}
              />
            )}
            {currentView === 'books' && <BooksView books={books} />}
            {currentView === 'nominations' && (
              <NominationsView
                nominations_period={nominations_period}
                recentPeriods={recentPeriods}
                periodNominations={periodNominations}
                userHasNominated={userHasNominated}
                newNomination={newNomination}
                setNewNomination={setNewNomination}
                addNomination={addNomination}
                currentUser={currentUser}
                loading={loading}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;