const now = Date.now();
const day = 86400000;

// Daily revenue for last 7 days
export const dailyRevenue = [
  { day: 'Mon', amount: 8500, date: now - 6 * day },
  { day: 'Tue', amount: 6200, date: now - 5 * day },
  { day: 'Wed', amount: 9100, date: now - 4 * day },
  { day: 'Thu', amount: 7300, date: now - 3 * day },
  { day: 'Fri', amount: 5800, date: now - 2 * day },
  { day: 'Sat', amount: 3400, date: now - day },
  { day: 'Today', amount: 4500, date: now },
];

// Monthly summary stats
export const monthlyStats = {
  totalAppointments: 42,
  appointmentsTrend: 12, // +12% vs last month
  totalRevenue: 48500,
  revenueTrend: 8, // +8%
  patientsSeen: 38,
  patientsTrend: 5, // +5%
  noShows: 2,
  noShowsTrend: -50, // -50% (improvement)
};

// Weekly summary stats
export const weeklyStats = {
  totalAppointments: 11,
  appointmentsTrend: 10,
  totalRevenue: 12400,
  revenueTrend: 15,
  patientsSeen: 9,
  patientsTrend: 12,
  noShows: 0,
  noShowsTrend: -100,
};

// Appointment type breakdown (this month)
export const appointmentsByType = [
  { type: 'Dialysis', count: 19, percentage: 45, color: '#3B4B8A' },
  { type: 'Consultation', count: 11, percentage: 26, color: '#F0A882' },
  { type: 'Follow-up', count: 8, percentage: 19, color: '#2E7D5B' },
  { type: 'Other', count: 4, percentage: 10, color: '#8E8E9A' },
];

// Top providers by appointment count
export const topProviders = [
  { providerId: 'user-001', name: 'Dr. Sarah Mbewe', appointments: 18, revenue: 22500 },
  { providerId: 'user-003', name: 'Dr. Chisanga Banda', appointments: 12, revenue: 14200 },
  { providerId: 'user-005', name: 'Dr. Yusuf Patel', appointments: 8, revenue: 8800 },
  { providerId: 'user-004', name: 'Pharmacist Grace Mutale', appointments: 4, revenue: 3000 },
];

// Revenue by payment method
export const revenueByMethod = [
  { method: 'Insurance (NHIMA)', amount: 28500, percentage: 59 },
  { method: 'Mobile Money', amount: 11200, percentage: 23 },
  { method: 'Cash', amount: 6400, percentage: 13 },
  { method: 'Other Insurance', amount: 2400, percentage: 5 },
];

export function getStatsForPeriod(period) {
  if (period === 'week') return weeklyStats;
  return monthlyStats;
}

export function getMaxRevenue() {
  return Math.max(...dailyRevenue.map(d => d.amount));
}
