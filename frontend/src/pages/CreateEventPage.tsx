/**
 * CreateEventPage - Page for creating new events
 * Protected by OrganizerRoute (organizer and admin roles only)
 */

import { useNavigate } from 'react-router-dom';
import { EventFormData } from '../types';
import { EventService } from '../services/eventService';
import EventForm from '../components/EventForm';

const CreateEventPage = () => {
  const navigate = useNavigate();

  const handleSubmit = async (data: EventFormData) => {
    try {
      await EventService.createEvent(data);
      alert('Event created successfully!');
      navigate('/organizer/dashboard');
    } catch (error) {
      console.error('Failed to create event:', error);
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || 'Failed to create event. Please try again.';
      alert(message);
      throw error; // Re-throw to prevent form from resetting
    }
  };

  const handleCancel = () => {
    navigate('/organizer/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleCancel}
            className="mb-4 text-sm font-medium text-gray-700 hover:text-blue-600 flex items-center transition-colors"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Dashboard
          </button>

          <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
          <p className="mt-2 text-sm text-gray-600">
            Fill out the form below to create a new event. All fields marked with * are required.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <EventForm onSubmit={handleSubmit} onCancel={handleCancel} isEdit={false} />
        </div>
      </div>
    </div>
  );
};

export default CreateEventPage;
