// src/components/appointments/AppointmentCalendar.jsx
import React, { useState, useEffect, useContext } from 'react';
// import FullCalendar from '@fullcalendar/react'; // Example library
// import dayGridPlugin from '@fullcalendar/daygrid'; // Example plugin
// import timeGridPlugin from '@fullcalendar/timegrid'; // Example plugin
// import interactionPlugin from '@fullcalendar/interaction'; // Example plugin for clickable dates/events
import { listAppointments } from '../../api/appointments';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { Link } from 'react-router-dom';

// This is a placeholder. A full calendar implementation requires a library like FullCalendar,
// react-big-calendar, or a custom build.
// For FullCalendar, you'd need to install:
// npm install --save @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction

const AppointmentCalendar = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user: currentUser } = useContext(AuthContext);

  useEffect(() => {
    if (!currentUser) return;
    setIsLoading(true);
    const fetchAppointmentsForCalendar = async () => {
      try {
        let params = {};
        if (currentUser.role === 'PATIENT') {
          params.patient__user__id = currentUser.id;
        } else if (currentUser.role === 'DOCTOR') {
          params.doctor__id = currentUser.id;
        }
        // Admin/Receptionist/Nurse might see all or a filtered set
        
        const appointmentsData = await listAppointments(params);
        const calendarEvents = (appointmentsData || []).map(appt => ({
          id: appt.id,
          title: `Appt with Dr. ${appt.doctor_details?.last_name || 'N/A'} for ${appt.patient_details?.user?.last_name || 'N/A'} (${appt.appointment_type_display || appt.appointment_type})`,
          start: new Date(appt.appointment_date_time),
          end: new Date(new Date(appt.appointment_date_time).getTime() + (appt.estimated_duration_minutes || 30) * 60000),
          allDay: false, // Assuming appointments have specific times
          extendedProps: {
            status: appt.status,
            reason: appt.reason,
            patientName: `${appt.patient_details?.user?.first_name || ''} ${appt.patient_details?.user?.last_name || ''}`,
            doctorName: `Dr. ${appt.doctor_details?.first_name || ''} ${appt.doctor_details?.last_name || ''}`,
          }
          // Add more properties as needed by the calendar library
        }));
        setEvents(calendarEvents);
      } catch (err) {
        setError('Failed to load appointments for calendar.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAppointmentsForCalendar();
  }, [currentUser]);

  // Placeholder rendering
  if (isLoading) {
    return <LoadingSpinner message="Loading calendar events..." />;
  }
  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="card shadow-sm">
      <div className="card-header">
        <h5 className="mb-0">Appointment Calendar (Placeholder)</h5>
      </div>
      <div className="card-body">
        <p className="text-muted">
          A full interactive calendar (e.g., using FullCalendar or react-big-calendar) would be implemented here.
          It would display fetched appointments and allow for interactions like clicking on events or dates.
        </p>
        {events.length > 0 ? (
          <ul className="list-group">
            {events.slice(0, 5).map(event => ( // Display first 5 events as a simple list for now
              <li key={event.id} className="list-group-item">
                <strong>{event.title}</strong><br />
                <small>{event.start.toLocaleString()} - {event.end.toLocaleString()}</small><br/>
                <small>Status: {event.extendedProps.status}</small><br/>
                <Link to={`/appointments/${event.id}`} className="btn btn-link btn-sm p-0">View Details</Link>
              </li>
            ))}
            {events.length > 5 && <li className="list-group-item text-center">...and {events.length - 5} more.</li>}
          </ul>
        ) : (
          <p>No appointments to display in the calendar view for your current filter.</p>
        )}
        <div className="mt-3">
            <Link to="/appointments" className="btn btn-outline-primary">View Full List</Link>
        </div>
        {/* Example of FullCalendar integration (requires installation and setup):
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek" // or 'dayGridMonth'
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={events}
          eventClick={(clickInfo) => {
            // Handle event click, e.g., navigate to appointment details
            // navigate(`/appointments/${clickInfo.event.id}`);
            alert('Event clicked: ' + clickInfo.event.title + ' ID: ' + clickInfo.event.id);
          }}
          dateClick={(arg) => {
            // Handle date click, e.g., open new appointment form for that date
            // navigate(`/appointments/new?date=${arg.dateStr}`);
            alert('Date clicked: ' + arg.dateStr);
          }}
          editable={true} // If you want drag-and-drop, resizing (requires backend update logic)
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
        /> 
        */}
      </div>
    </div>
  );
};

export default AppointmentCalendar;
