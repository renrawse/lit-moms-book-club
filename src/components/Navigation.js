import React from 'react';
import { Home, Book, Vote, Settings, LogOut, User } from 'lucide-react';

const Navigation = ({ currentView, setCurrentView, isAdmin, setIsAdmin, currentUser, onSignOut }) => (
  <nav className="bg-white shadow-sm mb-6">
    <div className="flex justify-between items-center p-4">
      <h1 className="text-xl font-bold text-purple-600">📚 Lit Moms Book Club</h1>
      <div className="flex items-center gap-4">
        <button
          onClick={() => setCurrentView('home')}
          className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
            currentView === 'home' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Home className="w-4 h-4" />
          Home
        </button>
        <button
          onClick={() => setCurrentView('books')}
          className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
            currentView === 'books' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Book className="w-4 h-4" />
          Books
        </button>
        <button
          onClick={() => setCurrentView('nominations')}
          className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
            currentView === 'nominations' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Vote className="w-4 h-4" />
          Nominations
        </button>
        <button
          onClick={() => setIsAdmin(!isAdmin)}
          className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
            isAdmin ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          {isAdmin ? 'Exit Admin' : 'Admin'}
        </button>
        
        <div className="border-l border-gray-200 pl-4 flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span className="font-medium">{currentUser?.name}</span>
            {currentUser?.points !== undefined && (
              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                {currentUser.points} pts
              </span>
            )}
          </div>
          <button
            onClick={onSignOut}
            className="flex items-center gap-2 px-3 py-2 rounded text-gray-600 hover:bg-gray-100 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  </nav>
);

export default Navigation;