import React, { useState, useEffect } from 'react';
import { BookOpen, Library, Tag, MapPin, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import SearchBar from '../components/ui/SearchBar';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import { getBooks, borrowBook, returnBook, seedCampusData } from '../services/campusUtilitiesService';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['All', 'Computer Science', 'Mathematics', 'Electronics', 'Mechanical', 'General'];

const CATEGORY_COLORS = {
  'Computer Science': 'from-blue-500 to-blue-700',
  'Mathematics':      'from-purple-500 to-purple-700',
  'Electronics':      'from-green-500 to-green-700',
  'Mechanical':       'from-orange-500 to-orange-700',
  'General':          'from-gray-500 to-gray-700',
  default:            'from-indigo-500 to-indigo-700',
};

function getCategoryGradient(category) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
}

function AvailabilityBar({ available, total }) {
  const pct = total > 0 ? Math.round((available / total) * 100) : 0;
  const color =
    pct > 50 ? 'bg-green-500' : pct > 0 ? 'bg-orange-400' : 'bg-red-500';
  const textColor =
    pct > 50 ? 'text-green-700' : pct > 0 ? 'text-orange-600' : 'text-red-600';

  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-1">
        <span className={`text-xs font-semibold ${textColor}`}>
          {available} / {total} copies
        </span>
        <span className={`text-xs ${textColor}`}>
          {available === 0 ? 'Unavailable' : `${pct}% free`}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function BookCard({ book, onBorrow, onReturn, borrowingId, returningId }) {
  const isBorrowing = borrowingId === book.id;
  const isReturning = returningId === book.id;
  const unavailable = book.availableCopies === 0;

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-md border border-white/50 overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-200">
      {/* Colored header */}
      <div className={`bg-gradient-to-br ${getCategoryGradient(book.category)} p-5 flex items-center justify-center`}>
        <BookOpen className="w-12 h-12 text-white opacity-90" />
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        {/* Title & author */}
        <div>
          <h3 className="font-bold text-gray-800 truncate leading-snug" title={book.title}>
            {book.title}
          </h3>
          <p className="text-sm text-gray-500 truncate">{book.author}</p>
        </div>

        {/* ISBN */}
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Tag className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">ISBN: {book.isbn}</span>
        </div>

        {/* Shelf Location */}
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3 text-yellow-600 flex-shrink-0" />
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium">
            {book.shelfLocation}
          </span>
        </div>

        {/* Category badge */}
        <span className="self-start text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
          {book.category}
        </span>

        {/* Availability bar */}
        <AvailabilityBar available={book.availableCopies} total={book.totalCopies} />

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-2">
          <Button
            size="sm"
            className="flex-1 text-xs"
            disabled={unavailable || isBorrowing}
            onClick={() => onBorrow(book)}
          >
            {isBorrowing ? (
              <span className="flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Borrowing…
              </span>
            ) : unavailable ? (
              'Unavailable'
            ) : (
              'Borrow'
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            disabled={isReturning}
            onClick={() => onReturn(book)}
          >
            {isReturning ? (
              <span className="flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Returning…
              </span>
            ) : (
              'Return'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function DigitalLibraryPage() {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [borrowingId, setBorrowingId] = useState(null);
  const [returningId, setReturningId] = useState(null);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const data = await getBooks();
      setBooks(data || []);
    } catch (err) {
      console.error('Failed to fetch books:', err);
      toast.error('Failed to load books.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedCampusData();
      toast.success('Demo data seeded!');
      await fetchBooks();
    } catch (err) {
      console.error('Seeding failed:', err);
      toast.error('Failed to seed demo data.');
    } finally {
      setSeeding(false);
    }
  };

  const handleBorrow = async (book) => {
    setBorrowingId(book.id);
    try {
      await borrowBook(book.id, user?.uid || user?.id);
      toast.success('Book borrowed!');
      await fetchBooks();
    } catch (err) {
      console.error('Borrow failed:', err);
      toast.error('Failed to borrow book.');
    } finally {
      setBorrowingId(null);
    }
  };

  const handleReturn = async (book) => {
    setReturningId(book.id);
    try {
      await returnBook(book.id, user?.uid || user?.id);
      toast.success('Book returned!');
      await fetchBooks();
    } catch (err) {
      console.error('Return failed:', err);
      toast.error('Failed to return book.');
    } finally {
      setReturningId(null);
    }
  };

  const filteredBooks = books.filter((book) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      book.title?.toLowerCase().includes(q) ||
      book.author?.toLowerCase().includes(q) ||
      book.isbn?.toLowerCase().includes(q);
    const matchesCategory =
      activeCategory === 'All' || book.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-6">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-md">
              <Library className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Digital Library</h1>
              <p className="text-sm text-gray-500">Browse, borrow, and return campus books</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSeed}
            disabled={seeding}
            className="self-start sm:self-auto"
          >
            {seeding ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Seeding…
              </span>
            ) : (
              '🌱 Seed Demo Data'
            )}
          </Button>
        </div>

        {/* Stats strip */}
        {!loading && books.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-lg px-4 py-2 shadow-sm text-sm">
              <span className="font-semibold text-indigo-700">{books.length}</span>
              <span className="text-gray-500 ml-1">Total Books</span>
            </div>
            <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-lg px-4 py-2 shadow-sm text-sm">
              <span className="font-semibold text-green-700">
                {books.filter((b) => b.availableCopies > 0).length}
              </span>
              <span className="text-gray-500 ml-1">Available</span>
            </div>
            <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-lg px-4 py-2 shadow-sm text-sm">
              <span className="font-semibold text-red-600">
                {books.filter((b) => b.availableCopies === 0).length}
              </span>
              <span className="text-gray-500 ml-1">Checked Out</span>
            </div>
          </div>
        )}
      </div>

      {/* Search & Filter */}
      <div className="mb-5 flex flex-col gap-3">
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(typeof e === 'string' ? e : e.target.value)}
          placeholder="Search by title, author, or ISBN…"
        />

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 border ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'bg-white/70 text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonLoader variant="grid" />
      ) : filteredBooks.length === 0 ? (
        books.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No Books Found"
            description="The library is empty. Seed some demo data to get started."
            action={
              <Button onClick={handleSeed} disabled={seeding}>
                {seeding ? 'Seeding…' : '🌱 Seed Demo Data'}
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={BookOpen}
            title="No Matching Books"
            description="Try adjusting your search or changing the category filter."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('All');
                }}
              >
                Clear Filters
              </Button>
            }
          />
        )
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Showing <span className="font-semibold text-gray-700">{filteredBooks.length}</span> book
            {filteredBooks.length !== 1 ? 's' : ''}
            {activeCategory !== 'All' && (
              <span> in <span className="font-semibold text-indigo-700">{activeCategory}</span></span>
            )}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onBorrow={handleBorrow}
                onReturn={handleReturn}
                borrowingId={borrowingId}
                returningId={returningId}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
