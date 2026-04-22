'use strict';

const bcrypt = require('bcryptjs');

function addDays(base, d) {
  const x = new Date(base);
  x.setDate(x.getDate() + d);
  return x;
}
function atTime(base, h, m = 0) {
  const x = new Date(base);
  x.setHours(h, m, 0, 0);
  return x;
}

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const hash = await bcrypt.hash('password123', 10);

    // Users - explicit ids to match expectations used elsewhere
    const users = [
      { id: 1, email: 'admin@wsu.edu', password_hash: hash, first_name: 'Admin', last_name: 'Cougar', role: 'admin', is_banned: false, email_verified_at: now, created_at: now, updated_at: now },
      { id: 2, email: 'advisor@wsu.edu', password_hash: hash, first_name: 'Maya', last_name: 'Chen', role: 'staff', is_banned: false, email_verified_at: now, created_at: now, updated_at: now },
      { id: 3, email: 'librarian@wsu.edu', password_hash: hash, first_name: 'Daniel', last_name: 'Kim', role: 'staff', is_banned: false, email_verified_at: now, created_at: now, updated_at: now },
      { id: 4, email: 'counselor@wsu.edu', password_hash: hash, first_name: 'Rosa', last_name: 'Martinez', role: 'staff', is_banned: false, email_verified_at: now, created_at: now, updated_at: now },
      { id: 5, email: 'career@wsu.edu', password_hash: hash, first_name: 'Jordan', last_name: 'Patel', role: 'staff', is_banned: false, email_verified_at: now, created_at: now, updated_at: now },
      { id: 10, email: 'alex@wsu.edu', password_hash: hash, first_name: 'Alex', last_name: 'Johnson', role: 'student', is_banned: false, email_verified_at: now, created_at: now, updated_at: now },
      { id: 11, email: 'sam@wsu.edu', password_hash: hash, first_name: 'Sam', last_name: 'Riley', role: 'student', is_banned: false, email_verified_at: now, created_at: now, updated_at: now },
      { id: 12, email: 'banned@wsu.edu', password_hash: hash, first_name: 'Blake', last_name: 'Rivers', role: 'student', is_banned: true, email_verified_at: now, created_at: now, updated_at: now },
    ];
    await queryInterface.bulkInsert('users', users);

    const categories = [
      { id: 1, name: 'Advising', icon: '🎓' },
      { id: 2, name: 'Library', icon: '📚' },
      { id: 3, name: 'Counseling', icon: '💬' },
      { id: 4, name: 'Career', icon: '💼' },
      { id: 5, name: 'Tutoring', icon: '✏️' },
    ];
    await queryInterface.bulkInsert('service_categories', categories);

    const services = [
      { id: 1, category_id: 1, provider_id: 2, title: 'Academic Advising — CS Majors', description: 'One-on-one advising for computer science undergraduates. Bring your degree audit.', location: 'Sloan Hall 210', duration_minutes: 30, is_active: true, created_at: now, updated_at: now },
      { id: 2, category_id: 2, provider_id: 3, title: 'Research Consultation', description: 'Help finding academic sources, citation formatting, and database searches.', location: 'Terrell Library Rm 102', duration_minutes: 45, is_active: true, created_at: now, updated_at: now },
      { id: 3, category_id: 3, provider_id: 4, title: 'Wellness Check-in', description: 'Confidential 50-minute counseling session.', location: 'CCC 3rd Floor', duration_minutes: 50, is_active: true, created_at: now, updated_at: now },
      { id: 4, category_id: 4, provider_id: 5, title: 'Resume Review', description: 'Get targeted feedback on your resume from a career coach.', location: 'ASCC 110', duration_minutes: 30, is_active: true, created_at: now, updated_at: now },
      { id: 5, category_id: 4, provider_id: 5, title: 'Mock Interview', description: 'Practice interviewing with structured feedback.', location: 'ASCC 112', duration_minutes: 45, is_active: true, created_at: now, updated_at: now },
      { id: 6, category_id: 1, provider_id: 2, title: 'Graduation Planning', description: 'Review your remaining coursework and graduation timeline.', location: 'Sloan Hall 210', duration_minutes: 30, is_active: true, created_at: now, updated_at: now },
      { id: 7, category_id: 2, provider_id: 3, title: 'Library Equipment Loan', description: 'Check out cameras, mics, and laptops.', location: 'Terrell Circ Desk', duration_minutes: 15, is_active: true, created_at: now, updated_at: now },
      { id: 8, category_id: 5, provider_id: 2, title: 'Writing Support', description: 'Peer tutoring on essays and technical writing.', location: 'Avery 121', duration_minutes: 60, is_active: false, created_at: now, updated_at: now },
    ];
    await queryInterface.bulkInsert('services', services);

    const availability = [];
    for (const svc of services) {
      if (!svc.is_active) continue;
      for (let d = 1; d <= 14; d++) {
        const day = addDays(now, d);
        if (day.getDay() === 0 || day.getDay() === 6) continue;
        for (const hour of [9, 10, 11, 13, 14, 15]) {
          availability.push({
            service_id: svc.id,
            start_at: atTime(day, hour),
            end_at: atTime(day, hour, svc.duration_minutes),
            recurrence_rule: null,
            created_at: now,
            updated_at: now,
          });
        }
      }
    }
    await queryInterface.bulkInsert('availability_blocks', availability);

    const d = (n) => addDays(now, n);
    const bookings = [
      // original bookings
      { service_id: 1, student_id: 10, start_at: atTime(d(2), 10),  end_at: atTime(d(2), 10, 30), status: 'approved',   notes: 'Want to switch minors.',          rejection_reason: null, created_at: now,    updated_at: now },
      { service_id: 4, student_id: 10, start_at: atTime(d(4), 14),  end_at: atTime(d(4), 14, 30), status: 'pending',    notes: 'Applying to summer internships.', rejection_reason: null, created_at: now,    updated_at: now },
      { service_id: 2, student_id: 11, start_at: atTime(d(1), 11),  end_at: atTime(d(1), 11, 45), status: 'pending',    notes: 'Thesis sources needed.',          rejection_reason: null, created_at: now,    updated_at: now },
      { service_id: 1, student_id: 10, start_at: atTime(d(-3), 9),  end_at: atTime(d(-3), 9, 30), status: 'completed',  notes: null,                              rejection_reason: null, created_at: now,    updated_at: now },
      { service_id: 3, student_id: 10, start_at: atTime(d(-7), 13), end_at: atTime(d(-7), 13, 50),status: 'cancelled',  notes: null,                              rejection_reason: null, created_at: now,    updated_at: now },
      // demo bookings spread across last 14 days for graph population
      { service_id: 5, student_id: 11, start_at: atTime(d(3), 10),  end_at: atTime(d(3), 10, 45), status: 'approved',   notes: null, rejection_reason: null, created_at: d(-13), updated_at: d(-13) },
      { service_id: 2, student_id: 10, start_at: atTime(d(5), 11),  end_at: atTime(d(5), 11, 45), status: 'approved',   notes: null, rejection_reason: null, created_at: d(-13), updated_at: d(-13) },
      { service_id: 6, student_id: 11, start_at: atTime(d(6), 14),  end_at: atTime(d(6), 14, 30), status: 'completed',  notes: null, rejection_reason: null, created_at: d(-11), updated_at: d(-11) },
      { service_id: 3, student_id: 11, start_at: atTime(d(7), 9),   end_at: atTime(d(7), 9, 50),  status: 'completed',  notes: null, rejection_reason: null, created_at: d(-11), updated_at: d(-11) },
      { service_id: 4, student_id: 11, start_at: atTime(d(8), 15),  end_at: atTime(d(8), 15, 30), status: 'approved',   notes: null, rejection_reason: null, created_at: d(-9),  updated_at: d(-9)  },
      { service_id: 1, student_id: 11, start_at: atTime(d(9), 10),  end_at: atTime(d(9), 10, 30), status: 'cancelled',  notes: null, rejection_reason: null, created_at: d(-9),  updated_at: d(-9)  },
      { service_id: 7, student_id: 10, start_at: atTime(d(10), 13), end_at: atTime(d(10), 13, 15),status: 'approved',   notes: null, rejection_reason: null, created_at: d(-7),  updated_at: d(-7)  },
      { service_id: 5, student_id: 10, start_at: atTime(d(11), 11), end_at: atTime(d(11), 11, 45),status: 'approved',   notes: null, rejection_reason: null, created_at: d(-6),  updated_at: d(-6)  },
      { service_id: 2, student_id: 11, start_at: atTime(d(12), 14), end_at: atTime(d(12), 14, 45),status: 'pending',    notes: null, rejection_reason: null, created_at: d(-6),  updated_at: d(-6)  },
      { service_id: 6, student_id: 10, start_at: atTime(d(13), 9),  end_at: atTime(d(13), 9, 30), status: 'approved',   notes: null, rejection_reason: null, created_at: d(-4),  updated_at: d(-4)  },
      { service_id: 3, student_id: 11, start_at: atTime(d(14), 15), end_at: atTime(d(14), 15, 50),status: 'approved',   notes: null, rejection_reason: null, created_at: d(-4),  updated_at: d(-4)  },
      { service_id: 4, student_id: 10, start_at: atTime(d(15), 11), end_at: atTime(d(15), 11, 30),status: 'pending',    notes: null, rejection_reason: null, created_at: d(-2),  updated_at: d(-2)  },
      { service_id: 1, student_id: 11, start_at: atTime(d(16), 13), end_at: atTime(d(16), 13, 30),status: 'pending',    notes: null, rejection_reason: null, created_at: d(-2),  updated_at: d(-2)  },
      { service_id: 7, student_id: 11, start_at: atTime(d(17), 10), end_at: atTime(d(17), 10, 15),status: 'approved',   notes: null, rejection_reason: null, created_at: d(-2),  updated_at: d(-2)  },
      { service_id: 5, student_id: 10, start_at: atTime(d(18), 14), end_at: atTime(d(18), 14, 45),status: 'pending',    notes: null, rejection_reason: null, created_at: d(-1),  updated_at: d(-1)  },
    ];
    await queryInterface.bulkInsert('bookings', bookings);

    const notifications = [
      { user_id: 10, type: 'booking_approved', payload: JSON.stringify({ bookingId: 1, service: 'Academic Advising — CS Majors' }), read_at: null, created_at: now, updated_at: now },
      { user_id: 10, type: 'reminder', payload: JSON.stringify({ bookingId: 1, when: 'tomorrow at 10:00 AM' }), read_at: null, created_at: now, updated_at: now },
      { user_id: 10, type: 'booking_created', payload: JSON.stringify({ bookingId: 2, service: 'Resume Review' }), read_at: now, created_at: now, updated_at: now },
    ];
    await queryInterface.bulkInsert('notifications', notifications);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('notifications', null, {});
    await queryInterface.bulkDelete('bookings', null, {});
    await queryInterface.bulkDelete('availability_blocks', null, {});
    await queryInterface.bulkDelete('services', null, {});
    await queryInterface.bulkDelete('service_categories', null, {});
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('audit_log', null, {});
  },
};
