import { supabase } from './supabase';

const API = {
  // Authentication API
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Get the user profile data
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      return {
        user: userProfile,
        token: data.session.access_token
      };
    } catch (error) {
      throw new Error(error.message);
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(error.message);
    }
  },

  async getCurrentUser() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!user) throw new Error('No authenticated user');

      // Get the user profile data
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      return userProfile;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // Books API
  async getBooks() {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('selected_date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch books: ${error.message}`);
    }
  },

  async addBook(book) {
    try {
      const { data, error } = await supabase
        .from('books')
        .insert([book])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to add book: ${error.message}`);
    }
  },

  async updateBookRating(bookId, rating) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Insert or update the rating
      const { error } = await supabase
        .from('book_ratings')
        .upsert({
          book_id: bookId,
          user_id: user.id,
          rating: rating
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to update rating: ${error.message}`);
    }
  },

  // Nominations API
  async getNominations() {
    try {
      const { data, error } = await supabase
        .from('nominations')
        .select(`
          *,
          nominator:users!nominator_id(name),
          nomination_period:nomination_periods(*)
        `)
        .order('vote_count', { ascending: false });

      if (error) throw error;

      // Format the data to match the expected structure
      return data.map(nomination => ({
        ...nomination,
        nominator: nomination.nominator.name,
        votes: nomination.vote_count
      }));
    } catch (error) {
      throw new Error(`Failed to fetch nominations: ${error.message}`);
    }
  },

  async getNominationsByPeriod(periodId) {
    try {
      console.log('API: getNominationsByPeriod called with periodId:', periodId);
      
      const { data, error } = await supabase
        .from('nominations')
        .select(`
          *,
          nominator:users!nominator_id(name)
        `)
        .eq('nomination_period_id', periodId)
        .order('vote_count', { ascending: false });

      if (error) {
        console.error('API: getNominationsByPeriod error:', error);
        throw error;
      }

      console.log('API: getNominationsByPeriod raw data:', data);

      const mappedData = data.map(nomination => ({
        ...nomination,
        nominator: nomination.nominator?.name || 'Unknown',
        votes: nomination.vote_count
      }));

      console.log('API: getNominationsByPeriod mapped data:', mappedData);
      return mappedData;
    } catch (error) {
      console.error('API: getNominationsByPeriod failed:', error);
      throw new Error(`Failed to fetch nominations for period: ${error.message}`);
    }
  },

  async getRecentNominationPeriods(limit = 4) {
    try {
      const { data, error } = await supabase
        .from('nomination_periods')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(period => ({
        id: period.id,
        title: period.title,
        startDate: period.start_date,
        endDate: period.end_date,
        isOpen: period.is_open,
        isCurrent: period.is_current,
        nominationLimit: period.nomination_limit || 10,
        createdAt: period.created_at
      }));
    } catch (error) {
      throw new Error(`Failed to fetch recent periods: ${error.message}`);
    }
  },

  async checkUserNomination(periodId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('nominations')
        .select('id')
        .eq('nomination_period_id', periodId)
        .eq('nominator_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      
      return data ? true : false;
    } catch (error) {
      if (error.message.includes('no rows')) return false;
      throw new Error(`Failed to check user nomination: ${error.message}`);
    }
  },

  async addNomination(nomination) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get current nomination period
      const { data: period } = await supabase
        .from('nomination_periods')
        .select('id')
        .eq('is_current', true)
        .single();

      const { data, error } = await supabase
        .from('nominations')
        .insert([{
          ...nomination,
          nominator_id: user.id,
          nomination_period_id: period?.id
        }])
        .select()
        .single();

      if (error) throw error;
      return { ...data, votes: 0 };
    } catch (error) {
      throw new Error(`Failed to add nomination: ${error.message}`);
    }
  },

  async voteForNomination(nominationId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('nomination_votes')
        .insert([{
          nomination_id: nominationId,
          user_id: user.id
        }]);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to vote: ${error.message}`);
    }
  },

  // Members API
  async getMembers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, points, email')
        .eq('is_admin', false)
        .order('points', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch members: ${error.message}`);
    }
  },

  async addMember(member) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{
          ...member,
          password_hash: 'temp_password_hash' // In production, this should be handled differently
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to add member: ${error.message}`);
    }
  },

  async updateMemberPoints(memberId, points, reason) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Add point transaction
      const { error } = await supabase
        .from('point_transactions')
        .insert([{
          user_id: memberId,
          points_change: points,
          reason: reason,
          admin_id: user.id
        }]);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to update points: ${error.message}`);
    }
  },

  // Nomination Periods API
  async getNominationPeriod() {
    try {
      const { data, error } = await supabase
        .from('nomination_periods')
        .select('*')
        .eq('is_current', true)
        .single();

      if (error) {
        // If no current period exists, return null instead of throwing an error
        if (error.code === 'PGRST116') { // No rows found
          return null;
        }
        throw error;
      }

      // Format to match expected structure
      return {
        id: data.id,
        isOpen: data.is_open,
        startDate: data.start_date,
        endDate: data.end_date,
        title: data.title,
        nominationLimit: data.nomination_limit || 10,
        isCurrent: data.is_current
      };
    } catch (error) {
      throw new Error(`Failed to fetch nomination period: ${error.message}`);
    }
  },

  async updateNominationPeriod(period) {
    try {
      // First, set all periods to not current
      await supabase
        .from('nomination_periods')
        .update({ is_current: false })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

      // Then update or insert the new period
      const { error } = await supabase
        .from('nomination_periods')
        .upsert({
          title: period.title,
          start_date: period.startDate,
          end_date: period.endDate,
          is_open: period.isOpen,
          is_current: true,
          nomination_limit: period.nominationLimit || 10
        }, { onConflict: 'title' }); // Use the unique column or primary key, e.g., 'id' or 'title'

      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to update nomination period: ${error.message}`);
    }
  },

  async createNominationPeriod(periodData) {
    try {
      // First, set all periods to not current
      await supabase
        .from('nomination_periods')
        .update({ is_current: false })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

      // Create new period
      const { data, error } = await supabase
        .from('nomination_periods')
        .insert([{
          title: periodData.title,
          start_date: periodData.start_date,
          end_date: periodData.end_date,
          is_open: periodData.is_open,
          is_current: true,
          nomination_limit: periodData.nomination_limit || 10
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        title: data.title,
        startDate: data.start_date,
        endDate: data.end_date,
        isOpen: data.is_open,
        isCurrent: data.is_current,
        nominationLimit: data.nomination_limit
      };
    } catch (error) {
      throw new Error(`Failed to create nomination period: ${error.message}`);
    }
  },

  // ============================================
  // VOTING ROUNDS API
  // ============================================

  async getVotingRounds(periodId) {
    try {
      const { data, error } = await supabase
        .from('voting_rounds')
        .select('*')
        .eq('nomination_period_id', periodId)
        .order('round_number');

      if (error) throw error;

      return data.map(round => ({
        id: round.id,
        roundNumber: round.round_number,
        title: round.title,
        description: round.description,
        isOpen: round.is_open,
        startDate: round.start_date,
        endDate: round.end_date,
        maxSelections: round.max_selections,
        nominationPeriodId: round.nomination_period_id
      }));
    } catch (error) {
      throw new Error(`Failed to fetch voting rounds: ${error.message}`);
    }
  },

  async createVotingRound(roundData) {
    try {
      const { data, error } = await supabase
        .from('voting_rounds')
        .insert([{
          nomination_period_id: roundData.periodId,
          round_number: roundData.roundNumber,
          title: roundData.title,
          description: roundData.description,
          max_selections: roundData.maxSelections,
          is_open: roundData.isOpen || false
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        roundNumber: data.round_number,
        title: data.title,
        description: data.description,
        isOpen: data.is_open,
        maxSelections: data.max_selections,
        nominationPeriodId: data.nomination_period_id
      };
    } catch (error) {
      throw new Error(`Failed to create voting round: ${error.message}`);
    }
  },

  async updateVotingRound(roundId, updates) {
    try {
      const { data, error } = await supabase
        .from('voting_rounds')
        .update({
          title: updates.title,
          description: updates.description,
          is_open: updates.isOpen,
          start_date: updates.startDate,
          end_date: updates.endDate
        })
        .eq('id', roundId)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        roundNumber: data.round_number,
        title: data.title,
        description: data.description,
        isOpen: data.is_open,
        startDate: data.start_date,
        endDate: data.end_date,
        maxSelections: data.max_selections,
        nominationPeriodId: data.nomination_period_id
      };
    } catch (error) {
      throw new Error(`Failed to update voting round: ${error.message}`);
    }
  },

  async getVotingRoundResults(roundId) {
    try {
      const { data, error } = await supabase
        .from('voting_round_results')
        .select('*')
        .eq('voting_round_id', roundId);

      if (error) throw error;

      return data.map(result => ({
        nominationId: result.nomination_id,
        bookTitle: result.book_title,
        author: result.author,
        description: result.description,
        voteCount: result.vote_count,
        rank: result.rank
      }));
    } catch (error) {
      throw new Error(`Failed to fetch voting results: ${error.message}`);
    }
  },

  async getUserVotes(roundId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('voting_round_votes')
        .select('nomination_id')
        .eq('voting_round_id', roundId)
        .eq('user_id', user.id);

      if (error) throw error;

      return data.map(vote => vote.nomination_id);
    } catch (error) {
      throw new Error(`Failed to fetch user votes: ${error.message}`);
    }
  },

  async submitVote(roundId, nominationIds) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Delete existing votes for this user in this round
      await supabase
        .from('voting_round_votes')
        .delete()
        .eq('voting_round_id', roundId)
        .eq('user_id', user.id);

      // Insert new votes
      const votes = nominationIds.map(nominationId => ({
        voting_round_id: roundId,
        user_id: user.id,
        nomination_id: nominationId
      }));

      const { error } = await supabase
        .from('voting_round_votes')
        .insert(votes);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to submit votes: ${error.message}`);
    }
  },

  async getTopNominations(periodId, limit = 2) {
    try {
      // Get the first voting round for this period
      const { data: round1 } = await supabase
        .from('voting_rounds')
        .select('id')
        .eq('nomination_period_id', periodId)
        .eq('round_number', 1)
        .single();

      if (!round1) return [];

      // Get top nominations from round 1
      const { data, error } = await supabase
        .from('voting_round_results')
        .select('*')
        .eq('voting_round_id', round1.id)
        .order('vote_count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(result => ({
        nominationId: result.nomination_id,
        bookTitle: result.book_title,
        author: result.author,
        description: result.description,
        voteCount: result.vote_count
      }));
    } catch (error) {
      throw new Error(`Failed to fetch top nominations: ${error.message}`);
    }
  }
};

export { API };