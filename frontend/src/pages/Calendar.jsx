import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // month, week, list
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchEvents();
  }, [currentDate, viewMode]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();

      // Calculate date range based on view mode
      const { startDate, endDate } = getDateRange();

      const response = await fetch(
        `http://localhost:5000/api/calendar/events?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEvents(data);
        setError(null);
      } else {
        throw new Error('Failed to fetch calendar events');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const visibleEvents = useMemo(() => {
    if (typeFilter === 'all') {
      return events;
    }
    return events.filter(event => event.type === typeFilter);
  }, [events, typeFilter]);

  const getAuthToken = () => {
    return localStorage.getItem('access_token');
  };

  const getDateRange = () => {
    let startDate, endDate;

    if (viewMode === 'month') {
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    } else if (viewMode === 'week') {
      const dayOfWeek = currentDate.getDay();
      startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - dayOfWeek);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
    } else {
      // List view - show 90 days
      startDate = new Date(currentDate);
      endDate = new Date(currentDate);
      endDate.setDate(currentDate.getDate() + 90);
    }

    return { startDate, endDate };
  };

  const getMonthName = (date) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return months[date.getMonth()];
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getEventsForDate = (date) => {
    if (!date) return [];

    return visibleEvents.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEventTypeColor = (type) => {
    const colors = {
      'exam': 'bg-red-100 text-red-800 border-red-300',
      'seminar': 'bg-violet-100 text-violet-800 border-violet-300',
      'thesis_defense': 'bg-purple-100 text-purple-800 border-purple-300',
      'meeting': 'bg-green-100 text-green-800 border-green-300'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getEventTypeLabel = (type) => {
    const labels = {
      'exam': 'Exam',
      'seminar': 'Seminar',
      'thesis_defense': 'Thesis Defense',
      'meeting': 'Meeting'
    };
    return labels[type] || type;
  };

  const openEventModal = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const closeEventModal = () => {
    setSelectedEvent(null);
    setShowEventModal(false);
  };

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Week day headers */}
        <div className="grid grid-cols-7 bg-gray-100 border-b">
          {weekDays.map(day => (
            <div key={day} className="p-2 text-center font-semibold text-gray-700">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 auto-rows-fr">
          {days.map((day, index) => {
            const dayEvents = day ? getEventsForDate(day) : [];
            const isToday = day && day.toDateString() === new Date().toDateString();

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border-r border-b ${
                  !day ? 'bg-gray-50' : ''
                } ${isToday ? 'bg-violet-50' : ''}`}
              >
                {day && (
                  <>
                    <div className={`text-sm font-semibold mb-1 ${
                      isToday ? 'text-violet-600' : 'text-gray-700'
                    }`}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(event => (
                        <div
                          key={event.id}
                          onClick={() => openEventModal(event)}
                          className={`text-xs p-1 rounded cursor-pointer border ${getEventTypeColor(event.type)} hover:opacity-80`}
                        >
                          <div className="font-semibold truncate">{event.title}</div>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-600 pl-1">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const { startDate } = getDateRange();
    const weekDays = [];

    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      weekDays.push(day);
    }

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-7 gap-2 p-4">
          {weekDays.map((day, index) => {
            const dayEvents = getEventsForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div key={index} className={`border rounded p-3 ${isToday ? 'bg-violet-50 border-violet-300' : ''}`}>
                <div className={`text-center mb-3 ${isToday ? 'text-violet-600' : 'text-gray-700'}`}>
                  <div className="text-xs font-semibold">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-2xl font-bold">{day.getDate()}</div>
                  <div className="text-xs">{getMonthName(day)}</div>
                </div>
                <div className="space-y-2">
                  {dayEvents.map(event => (
                    <div
                      key={event.id}
                      onClick={() => openEventModal(event)}
                      className={`text-xs p-2 rounded cursor-pointer border ${getEventTypeColor(event.type)} hover:opacity-80`}
                    >
                      <div className="font-semibold">{event.title}</div>
                      {event.venue && (
                        <div className="mt-1 opacity-75">{event.venue}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderListView = () => {
    // Group events by date
    const eventsByDate = {};
    visibleEvents.forEach(event => {
      const date = new Date(event.start).toDateString();
      if (!eventsByDate[date]) {
        eventsByDate[date] = [];
      }
      eventsByDate[date].push(event);
    });

    const sortedDates = Object.keys(eventsByDate).sort((a, b) => new Date(a) - new Date(b));

    return (
      <div className="bg-white rounded-lg shadow">
        {sortedDates.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            No upcoming events in the next 90 days
          </div>
        ) : (
          <div className="divide-y">
            {sortedDates.map(dateString => {
              const date = new Date(dateString);
              const dayEvents = eventsByDate[dateString];

              return (
                <div key={dateString} className="p-4">
                  <div className="font-semibold text-gray-700 mb-3">
                    {date.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="space-y-2">
                    {dayEvents.map(event => (
                      <div
                        key={event.id}
                        onClick={() => openEventModal(event)}
                        className={`p-3 rounded border cursor-pointer ${getEventTypeColor(event.type)} hover:opacity-80`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-semibold">{event.title}</div>
                            <div className="text-sm mt-1 opacity-75">
                              Type: {getEventTypeLabel(event.type)}
                            </div>
                            {event.scholar?.name && (
                              <div className="text-sm mt-1 opacity-75">
                                Scholar: {event.scholar.name}
                              </div>
                            )}
                            {event.venue && (
                              <div className="text-sm mt-1 opacity-75">
                                Venue: {event.venue}
                              </div>
                            )}
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-semibold ${
                            event.status === 'completed' ? 'bg-green-200' :
                            event.status === 'cancelled' ? 'bg-red-200' :
                            'bg-yellow-200'
                          }`}>
                            {event.status?.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="card">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Calendar</h1>
        <p className="text-gray-600 mt-2">
          View all your scheduled events including exams, seminars, meetings, and thesis defenses
        </p>
      </div>

      {/* Calendar Controls */}
      <div className="card mb-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          {/* View Mode Selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 rounded ${
                viewMode === 'month'
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded ${
                viewMode === 'week'
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded ${
                viewMode === 'list'
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              List
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => viewMode === 'week' ? navigateWeek(-1) : navigateMonth(-1)}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Previous
            </button>

            <button
              onClick={goToToday}
              className="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700"
            >
              Today
            </button>

            <button
              onClick={() => viewMode === 'week' ? navigateWeek(1) : navigateMonth(1)}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Next
            </button>
          </div>

          {/* Current Period Display */}
          <div className="text-xl font-semibold text-gray-800">
            {viewMode === 'list' ? 'Upcoming Events' : `${getMonthName(currentDate)} ${currentDate.getFullYear()}`}
          </div>
        </div>

        {/* Event Type Legend */}
        <div className="mt-4 pt-4 border-t flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-100 border border-red-300"></div>
            <button
              onClick={() => setTypeFilter(typeFilter === 'exam' ? 'all' : 'exam')}
              className={`text-sm ${typeFilter === 'exam' ? 'text-red-700 font-semibold' : 'text-gray-700'}`}
            >
              Exam
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-violet-100 border border-violet-300"></div>
            <button
              onClick={() => setTypeFilter(typeFilter === 'seminar' ? 'all' : 'seminar')}
              className={`text-sm ${typeFilter === 'seminar' ? 'text-violet-700 font-semibold' : 'text-gray-700'}`}
            >
              Seminar
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-100 border border-purple-300"></div>
            <button
              onClick={() => setTypeFilter(typeFilter === 'thesis_defense' ? 'all' : 'thesis_defense')}
              className={`text-sm ${typeFilter === 'thesis_defense' ? 'text-purple-700 font-semibold' : 'text-gray-700'}`}
            >
              Thesis Defense
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
            <button
              onClick={() => setTypeFilter(typeFilter === 'meeting' ? 'all' : 'meeting')}
              className={`text-sm ${typeFilter === 'meeting' ? 'text-green-700 font-semibold' : 'text-gray-700'}`}
            >
              Meeting
            </button>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'list' && renderListView()}

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">{selectedEvent.title}</h3>
              <button
                onClick={closeEventModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Type</p>
                <span className={`inline-block px-3 py-1 rounded border text-sm font-semibold ${getEventTypeColor(selectedEvent.type)}`}>
                  {getEventTypeLabel(selectedEvent.type)}
                </span>
              </div>

              <div>
                <p className="text-sm text-gray-600">Date & Time</p>
                <p className="font-semibold">
                  {new Date(selectedEvent.start).toLocaleString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              {selectedEvent.venue && (
                <div>
                  <p className="text-sm text-gray-600">Venue</p>
                  <p className="font-semibold">{selectedEvent.venue}</p>
                </div>
              )}

              {selectedEvent.online_link && (
                <div>
                  <p className="text-sm text-gray-600">Online Link</p>
                  <a
                    href={selectedEvent.online_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-600 hover:underline break-all"
                  >
                    {selectedEvent.online_link}
                  </a>
                </div>
              )}

              {selectedEvent.status && (
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                    selectedEvent.status === 'completed' ? 'bg-green-100 text-green-800' :
                    selectedEvent.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedEvent.status?.toUpperCase()}
                  </span>
                </div>
              )}

              {selectedEvent.scholar && (
                <div>
                  <p className="text-sm text-gray-600">Scholar</p>
                  <div className="font-semibold">
                    {selectedEvent.scholar.name || 'Scholar'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {selectedEvent.scholar.enrollment_number}
                  </div>
                  {selectedEvent.scholar.school_code && (
                    <div className="text-sm text-gray-600">
                      School: {selectedEvent.scholar.school_code}
                    </div>
                  )}
                </div>
              )}

              {selectedEvent.details && Object.entries(selectedEvent.details)
                .filter(([, value]) => value !== null && value !== undefined && value !== '')
                .length > 0 && (
                <div>
                  <p className="text-sm text-gray-600">Details</p>
                  <div className="mt-1 space-y-1">
                    {Object.entries(selectedEvent.details)
                      .filter(([, value]) => value !== null && value !== undefined && value !== '')
                      .map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                          <span className="text-gray-700">{value}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={closeEventModal}
                className="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Calendar;
