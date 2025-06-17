document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = 'http://localhost:5000/api';

  // DOM Elements
  const authContainer = document.getElementById('auth-container');
  const appContainer = document.getElementById('app-container');
  const loginSection = document.getElementById('login-section');
  const registerSection = document.getElementById('register-section');
  const calendarEl = document.getElementById('calendar');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const showRegisterBtn = document.getElementById('show-register');
  const showLoginBtn = document.getElementById('show-login');
  const logoutBtn = document.getElementById('logout-btn');
  const eventModal = new bootstrap.Modal(document.getElementById('eventModal'));
  const eventForm = document.getElementById('eventForm');
  const saveEventBtn = document.getElementById('saveEventBtn');
  const deleteEventBtn = document.getElementById('deleteEventBtn');

  let token = localStorage.getItem('token');
  let calendar = null;

  // Function to show login form
  const showLogin = () => {
    loginSection.style.display = 'block';
    registerSection.style.display = 'none';
  };

  // Function to show register form
  const showRegister = () => {
    loginSection.style.display = 'none';
    registerSection.style.display = 'block';
  };

  // Initialize the FullCalendar instance
const initializeCalendar = () => {
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    editable: true,
    selectable: true,
    timeZone: 'local',
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },
    events: async (info, successCallback, failureCallback) => {
      try {
        const year = info.start.getFullYear();
        const month = info.start.getMonth() + 1; // FullCalendar uses 0-based months

        const response = await fetch(`${API_BASE_URL}/events/month/${year}/${month}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to fetch events');

        const events = await response.json();

        const formattedEvents = events.map(event => ({
          id: event._id,
          title: event.title,
          start: event.startDate,
          end: event.endDate || null,
          allDay: event.isAllDay,
          extendedProps: {
            description: event.description || '',
            location: event.location || '',
            calendarId: event.calendarId,
            ownerId: event.ownerId,
            recurrenceRule: event.recurrenceRule || '',
            recurrenceExceptions: event.recurrenceExceptions || [],
            status: event.status || 'confirmed',
            attendees: event.attendees || [],
          },
        }));

        successCallback(formattedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
        failureCallback(error);
      }
    },
    eventClick: (info) => {
      const { extendedProps, id, start, end } = info.event;
      const eventData = {
        id,
        title: info.event.title,
        startDate: start.toISOString().slice(0, 16),
        endDate: end ? end.toISOString().slice(0, 16) : '',
        description: extendedProps.description,
        location: extendedProps.location,
        calendarId: extendedProps.calendarId,
        ownerId: extendedProps.ownerId,
        isAllDay: info.event.allDay,
        recurrenceRule: extendedProps.recurrenceRule,
        recurrenceExceptions: extendedProps.recurrenceExceptions,
        status: extendedProps.status,
        attendees: extendedProps.attendees.join(', '),
      };
      showEventModal(eventData, id);
    },
    dateClick: (info) => {
      const newEventData = {
        title: '',
        startDate: info.dateStr,
        endDate: info.dateStr,
        description: '',
        location: '',
        calendarId: '',
        ownerId: '',
        isAllDay: false,
        recurrenceRule: '',
        recurrenceExceptions: '',
        status: 'confirmed',
        attendees: '',
      };
      showEventModal(newEventData, null);
    },
  });

  calendar.render();
};


  // Show the modal for creating or editing an event
  const showEventModal = (event = {}, eventId = null) => {
    eventForm.reset();
    Object.entries(event).forEach(([key, value]) => {
      const input = eventForm.querySelector(`[name="${key}"]`);
      if (input) {
        if (key === 'startDate' || key === 'endDate') {
          input.value = value ? new Date(value).toISOString().slice(0, 16) : '';
        } else if (input.type === 'checkbox') {
          input.checked = value;
        } else {
          input.value = value;
        }
      }
    });

    saveEventBtn.dataset.eventId = eventId || '';
    deleteEventBtn.style.display = eventId ? 'block' : 'none';
    eventModal.show();
  };

  // Handle saving an event
  const handleSaveEvent = async () => {
    const eventId = saveEventBtn.dataset.eventId;
    const formData = Object.fromEntries(new FormData(eventForm).entries());

    // Validate and parse date inputs
    const startDate = new Date(formData.startDate);
    const endDate = formData.endDate ? new Date(formData.endDate) : null;

    if (isNaN(startDate.getTime())) {
      alert('Invalid start date');
      return;
    }
    if (formData.endDate && isNaN(endDate.getTime())) {
      alert('Invalid end date');
      return;
    }

    if (formData.endDate && startDate >= endDate) {
      alert('Start date must be earlier than end date');
      return;
    }

    formData.startDate = startDate.toISOString();
    formData.endDate = endDate ? endDate.toISOString() : null;
    formData.isAllDay = formData.isAllDay === 'on';
    formData.attendees = formData.attendees.split(',').map(email => email.trim());

    try {
      const response = await fetch(
        `${API_BASE_URL}/events${eventId ? `/${eventId}` : ''}`,
        {
          method: eventId ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error('Failed to save event');
      calendar.refetchEvents();
      eventModal.hide(); // Close modal after saving
    } catch (error) {
      console.error('Event save error:', error);
    }
  };

  // Handle deleting an event
  const handleDeleteEvent = async () => {
    const eventId = saveEventBtn.dataset.eventId;
    if (!eventId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to delete event');
      calendar.refetchEvents();
      eventModal.hide();
    } catch (error) {
      console.error('Event delete error:', error);
    }
  };

  // Validate token
  const validateToken = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/validateToken`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  // Display the app or redirect to login
  const showApp = async () => {
    if (await validateToken()) {
      authContainer.style.display = 'none';
      appContainer.style.display = 'block';
      initializeCalendar();
    } else {
      localStorage.removeItem('token');
      token = null;
      authContainer.style.display = 'block';
      appContainer.style.display = 'none';
    }
  };

  const fetchEventsByMonth = async (year, month) => {
  try {
    const response = await fetch(`${apiBase}/events/month/${year}/${month}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error('Failed to fetch events');

    const events = await response.json();
    console.log('Events for the month:', events);
    // Use these events to update your calendar view
  } catch (error) {
    console.error('Error fetching events by month:', error.message);
  }
};


  // Handle login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = loginForm.querySelector('#login-username').value;
    const password = loginForm.querySelector('#login-password').value;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) throw new Error('Login failed');
      const { token: newToken } = await response.json();
      token = newToken;
      localStorage.setItem('token', token);

      showApp();
    } catch (error) {
      console.error('Login error:', error);
    }
  });

  // Handle registration
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(registerForm);
    const username = formData.get('username');
    const password = formData.get('password');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) throw new Error('Registration failed');
      alert('Registration successful! You can now log in.');
      showLogin();
    } catch (error) {
      console.error('Registration error:', error);
    }
  });

  // Handle logout
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    token = null;
    authContainer.style.display = 'block';
    appContainer.style.display = 'none';
  });

  // Initial setup
  if (token) showApp();
  else showLogin();

  showRegisterBtn.addEventListener('click', showRegister);
  showLoginBtn.addEventListener('click', showLogin);

  saveEventBtn.addEventListener('click', handleSaveEvent);
  deleteEventBtn.addEventListener('click', handleDeleteEvent);
});
