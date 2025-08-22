import { useState, useEffect } from 'react';
import { API } from '../services/api';
import { supabase } from '../services/supabase';

export const useBookClub = () => {
  const [currentView, setCurrentView] = useState('home');
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Database-backed state
  const [books, setBooks] = useState([]);
  const [nominations, setNominations] = useState([]);
  const [members, setMembers] = useState([]);
  const [nominations_period, setNominationsPeriod] = useState({
    isOpen: true,
    startDate: '2024-12-01',
    endDate: '2024-12-15',
    title: 'January 2025 Book Selection'
  });
  const [recentPeriods, setRecentPeriods] = useState([]);
  const [periodNominations, setPeriodNominations] = useState({});
  const [userHasNominated, setUserHasNominated] = useState(false);
  const [votingRounds, setVotingRounds] = useState([]);
  const [votingResults, setVotingResults] = useState({});
  const [userVotes, setUserVotes] = useState({});
  const [selectedVotes, setSelectedVotes] = useState({});
  
  const [newNomination, setNewNomination] = useState({ title: '', author: '', description: '', why: '' });
  const [newMember, setNewMember] = useState({ name: '', email: '', points: 0 });
  const [pointsToAdd, setPointsToAdd] = useState({ memberId: '', points: 0, reason: '' });
  const [newNominationPeriod, setNewNominationPeriod] = useState({
    title: '',
    startDate: '',
    endDate: '',
    isOpen: true,
    nominationLimit: 10
  });

  // Check for existing auth on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Load data from database when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated]);

  const checkAuthStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const user = await API.getCurrentUser();
        setCurrentUser(user);
        setIsAdmin(user.is_admin);
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setError('Session expired. Please sign in again.');
    }
  };

  const signIn = async (email, password) => {
    setLoading(true);
    setError('');
    try {
      const response = await API.signIn(email, password);
      setCurrentUser(response.user);
      setIsAdmin(response.user.is_admin);
      setIsAuthenticated(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await API.signOut();
      setCurrentUser(null);
      setIsAdmin(false);
      setIsAuthenticated(false);
      setCurrentView('home');
      setBooks([]);
      setNominations([]);
      setMembers([]);
    } catch (err) {
      setError('Error signing out');
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [booksData, nominationsData, membersData, periodData, recentPeriodsData] = await Promise.all([
        API.getBooks(),
        API.getNominations(),
        API.getMembers(),
        API.getNominationPeriod(),
        API.getRecentNominationPeriods()
      ]);
      
      setBooks(booksData);
      setNominations(nominationsData);
      setMembers(membersData);
      setNominationsPeriod(periodData); // This can now be null
      setRecentPeriods(recentPeriodsData);

      // Load nominations for each recent period AND current period (if exists)
      const periodNomData = {};
      const allPeriods = [...recentPeriodsData];
      
      // Ensure current period is included if it exists and not already in recent periods
      if (periodData && !allPeriods.find(p => p.id === periodData.id)) {
        allPeriods.push(periodData);
      }
      
      for (const period of allPeriods) {
        try {
          const periodNoms = await API.getNominationsByPeriod(period.id);
          periodNomData[period.id] = periodNoms;
          console.log(`Loaded ${periodNoms.length} nominations for period ${period.id}:`, periodNoms);
        } catch (error) {
          console.error(`Failed to load nominations for period ${period.id}:`, error);
          periodNomData[period.id] = [];
        }
      }
      setPeriodNominations(periodNomData);

      // Check if current user has nominated in the current period
      if (periodData && periodData.isOpen) {
        const hasNominated = await API.checkUserNomination(periodData.id);
        setUserHasNominated(hasNominated);
      }

      // Load voting rounds for current period
      if (periodData) {
        const rounds = await API.getVotingRounds(periodData.id);
        setVotingRounds(rounds);

        // Load results and user votes for each round
        const resultsData = {};
        const votesData = {};
        for (const round of rounds) {
          const results = await API.getVotingRoundResults(round.id);
          const userVoteIds = await API.getUserVotes(round.id);
          resultsData[round.id] = results;
          votesData[round.id] = userVoteIds;
        }
        setVotingResults(resultsData);
        setUserVotes(votesData);
      }
      
    } catch (err) {
      setError('Failed to load data from database');
      console.error('Database error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const addNomination = async () => {
    if (newNomination.title && newNomination.author && newNomination.description && newNomination.why) {
      setLoading(true);
      try {
        // Check if user has already nominated in this period
        const hasAlreadyNominated = await API.checkUserNomination(nominations_period.id);
        if (hasAlreadyNominated) {
          setError('You have already submitted a nomination for this period.');
          setLoading(false);
          return;
        }

        const nominationData = {
          title: newNomination.title,
          author: newNomination.author,
          description: newNomination.description,
          why_nominate: newNomination.why
        };
        
        const newNom = await API.addNomination(nominationData);
        setNominations(prev => [...prev, newNom]);
        setNewNomination({ title: '', author: '', description: '', why: '' });
        setUserHasNominated(true);
        
        // Award points for nomination
        await API.updateMemberPoints(currentUser.id, 10, 'Book nomination');
        
        // Refresh member data to get updated points
        const updatedMembers = await API.getMembers();
        setMembers(updatedMembers);

        // Refresh nominations for current period
        if (nominations_period.id) {
          const updatedPeriodNoms = await API.getNominationsByPeriod(nominations_period.id);
          setPeriodNominations(prev => ({
            ...prev,
            [nominations_period.id]: updatedPeriodNoms
          }));
        }
        
      } catch (err) {
        setError('Failed to add nomination');
        console.error('Error adding nomination:', err);
      } finally {
        setLoading(false);
      }
    }
  };
  
  const addMember = async () => {
    if (newMember.name && newMember.email) {
      setLoading(true);
      try {
        const memberData = {
          name: newMember.name,
          email: newMember.email,
          points: parseInt(newMember.points) || 0
        };
        
        const newMem = await API.addMember(memberData);
        setMembers(prev => [...prev, newMem]);
        setNewMember({ name: '', email: '', points: 0 });
        
      } catch (err) {
        setError('Failed to add member');
        console.error('Error adding member:', err);
      } finally {
        setLoading(false);
      }
    }
  };
  
  const addPoints = async () => {
    if (pointsToAdd.memberId && pointsToAdd.points) {
      setLoading(true);
      try {
        await API.updateMemberPoints(
          pointsToAdd.memberId, 
          parseInt(pointsToAdd.points), 
          pointsToAdd.reason
        );
        
        // Refresh members to get updated points from database
        const updatedMembers = await API.getMembers();
        setMembers(updatedMembers);
        
        setPointsToAdd({ memberId: '', points: 0, reason: '' });
        
      } catch (err) {
        setError('Failed to add points');
        console.error('Error adding points:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const updateNominationPeriod = async (newStatus) => {
    setLoading(true);
    try {
      const updatedPeriod = { ...nominations_period, isOpen: newStatus };
      await API.updateNominationPeriod(updatedPeriod);
      setNominationsPeriod(updatedPeriod);
    } catch (err) {
      setError('Failed to update nomination period');
      console.error('Error updating nomination period:', err);
    } finally {
      setLoading(false);
    }
  };

  const createNominationPeriod = async () => {
    setLoading(true);
    try {
      const periodData = {
        title: newNominationPeriod.title,
        start_date: newNominationPeriod.startDate,
        end_date: newNominationPeriod.endDate,
        is_open: newNominationPeriod.isOpen,
        nomination_limit: newNominationPeriod.nominationLimit
      };
      
      const period = await API.createNominationPeriod(periodData);
      setNominationsPeriod(period);
      setNewNominationPeriod({
        title: '',
        startDate: '',
        endDate: '',
        isOpen: true,
        nominationLimit: 10
      });
    } catch (err) {
      setError('Failed to create nomination period');
      console.error('Error creating nomination period:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateNominationPeriodDetails = async (periodData) => {
    setLoading(true);
    try {
      const updatedPeriod = await API.updateNominationPeriod(periodData);
      setNominationsPeriod(updatedPeriod);
    } catch (err) {
      setError('Failed to update nomination period');
      console.error('Error updating nomination period:', err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // VOTING ROUNDS FUNCTIONS
  // ============================================

  const createVotingRound = async (roundData) => {
    setLoading(true);
    try {
      const round = await API.createVotingRound(roundData);
      setVotingRounds(prev => [...prev, round]);
      return round;
    } catch (err) {
      setError('Failed to create voting round');
      console.error('Error creating voting round:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateVotingRound = async (roundId, updates) => {
    setLoading(true);
    try {
      const updatedRound = await API.updateVotingRound(roundId, updates);
      setVotingRounds(prev => prev.map(round => 
        round.id === roundId ? updatedRound : round
      ));

      // If we're opening/closing a round, refresh results
      if ('isOpen' in updates) {
        const results = await API.getVotingRoundResults(roundId);
        setVotingResults(prev => ({
          ...prev,
          [roundId]: results
        }));
      }
    } catch (err) {
      setError('Failed to update voting round');
      console.error('Error updating voting round:', err);
    } finally {
      setLoading(false);
    }
  };

  const submitVote = async (roundId, nominationIds) => {
    setLoading(true);
    try {
      await API.submitVote(roundId, nominationIds);
      
      // Update user votes state
      setUserVotes(prev => ({
        ...prev,
        [roundId]: nominationIds
      }));

      // Clear selected votes
      setSelectedVotes(prev => ({
        ...prev,
        [roundId]: []
      }));

      // Refresh results
      const results = await API.getVotingRoundResults(roundId);
      setVotingResults(prev => ({
        ...prev,
        [roundId]: results
      }));
    } catch (err) {
      setError('Failed to submit votes');
      console.error('Error submitting votes:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshVotingData = async (periodId) => {
    if (!periodId) return;
    
    try {
      const rounds = await API.getVotingRounds(periodId);
      setVotingRounds(rounds);

      const resultsData = {};
      const votesData = {};
      for (const round of rounds) {
        const results = await API.getVotingRoundResults(round.id);
        const userVoteIds = await API.getUserVotes(round.id);
        resultsData[round.id] = results;
        votesData[round.id] = userVoteIds;
      }
      setVotingResults(resultsData);
      setUserVotes(votesData);
    } catch (err) {
      console.error('Error refreshing voting data:', err);
    }
  };

  return {
    currentView,
    setCurrentView,
    isAdmin,
    setIsAdmin,
    currentUser,
    isAuthenticated,
    signIn,
    signOut,
    loading,
    error,
    setError,
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
  };
};