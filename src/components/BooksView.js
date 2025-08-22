import React from 'react';
import StarRating from './StarRating';

const BooksView = ({ books }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">Previous Books</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {books.map(book => (
        <div key={book.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h3 className="font-semibold text-lg mb-2">{book.title}</h3>
          <p className="text-gray-600 mb-2">by {book.author}</p>
          <p className="text-sm text-gray-500 mb-3">
            Read: {new Date(book.selectedDate).toLocaleDateString()}
          </p>
          <StarRating rating={book.rating} readonly />
          <p className="text-sm text-gray-500 mt-2">{book.votes} members voted</p>
          
          <div className="mt-4 pt-4 border-t">
            <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">
              View Discussion Notes
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default BooksView;