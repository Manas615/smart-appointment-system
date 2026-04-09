/**
 * Seeds the database with sample providers, services, and time slots.
 * Run with: node seed.js
 */
const db = require("./db");

// Clear existing data
db.exec(`
  DELETE FROM appointments;
  DELETE FROM time_slots;
  DELETE FROM services;
  DELETE FROM providers;
`);

// Insert sample providers
const insertProvider = db.prepare(
  "INSERT INTO providers (name, specialty, email, phone, bio) VALUES (?, ?, ?, ?, ?)"
);

const providers = [
  {
    name: "Dr. Ananya Sharma",
    specialty: "General Medicine",
    email: "ananya.sharma@clinic.com",
    phone: "+91 98765 43210",
    bio: "15+ years of experience in general medicine and preventive healthcare.",
  },
  {
    name: "Dr. Rajesh Patel",
    specialty: "Dentistry",
    email: "rajesh.patel@clinic.com",
    phone: "+91 98765 43211",
    bio: "Specialist in cosmetic dentistry and orthodontics with modern techniques.",
  },
  {
    name: "Dr. Priya Nair",
    specialty: "Dermatology",
    email: "priya.nair@clinic.com",
    phone: "+91 98765 43212",
    bio: "Expert in skin care, laser treatments, and dermatological surgery.",
  },
  {
    name: "Dr. Vikram Singh",
    specialty: "Orthopedics",
    email: "vikram.singh@clinic.com",
    phone: "+91 98765 43213",
    bio: "Sports medicine specialist with experience in joint replacement surgery.",
  },
  {
    name: "Dr. Meera Krishnan",
    specialty: "Pediatrics",
    email: "meera.krishnan@clinic.com",
    phone: "+91 98765 43214",
    bio: "Compassionate pediatrician focused on child development and nutrition.",
  },
  {
    name: "Dr. Arjun Reddy",
    specialty: "Cardiology",
    email: "arjun.reddy@clinic.com",
    phone: "+91 98765 43215",
    bio: "Interventional cardiologist with expertise in minimally invasive procedures.",
  },
];

const providerIds = [];
for (const p of providers) {
  const result = insertProvider.run(p.name, p.specialty, p.email, p.phone, p.bio);
  providerIds.push(Number(result.lastInsertRowid));
}

// Insert services for each provider
const insertService = db.prepare(
  "INSERT INTO services (provider_id, name, duration_minutes, price) VALUES (?, ?, ?, ?)"
);

const serviceTemplates = [
  [
    { name: "General Consultation", duration: 30, price: 500 },
    { name: "Health Checkup", duration: 60, price: 1500 },
    { name: "Follow-up Visit", duration: 15, price: 300 },
  ],
  [
    { name: "Dental Checkup", duration: 30, price: 600 },
    { name: "Teeth Cleaning", duration: 45, price: 1200 },
    { name: "Tooth Extraction", duration: 60, price: 2000 },
  ],
  [
    { name: "Skin Consultation", duration: 30, price: 800 },
    { name: "Acne Treatment", duration: 45, price: 1500 },
    { name: "Laser Therapy", duration: 60, price: 5000 },
  ],
  [
    { name: "Orthopedic Consultation", duration: 30, price: 700 },
    { name: "Physiotherapy Session", duration: 45, price: 1000 },
    { name: "X-Ray & Evaluation", duration: 60, price: 2500 },
  ],
  [
    { name: "Child Wellness Visit", duration: 30, price: 600 },
    { name: "Vaccination", duration: 15, price: 400 },
    { name: "Growth Assessment", duration: 45, price: 1200 },
  ],
  [
    { name: "Cardiac Consultation", duration: 30, price: 1000 },
    { name: "ECG Test", duration: 30, price: 800 },
    { name: "Stress Test", duration: 60, price: 3000 },
  ],
];

providerIds.forEach((pid, i) => {
  for (const svc of serviceTemplates[i]) {
    insertService.run(pid, svc.name, svc.duration, svc.price);
  }
});

// Insert time slots for the next 7 days
const insertSlot = db.prepare(
  "INSERT INTO time_slots (provider_id, date, start_time, end_time) VALUES (?, ?, ?, ?)"
);

const timeSlots = [
  { start: "09:00", end: "09:30" },
  { start: "09:30", end: "10:00" },
  { start: "10:00", end: "10:30" },
  { start: "10:30", end: "11:00" },
  { start: "11:00", end: "11:30" },
  { start: "11:30", end: "12:00" },
  { start: "14:00", end: "14:30" },
  { start: "14:30", end: "15:00" },
  { start: "15:00", end: "15:30" },
  { start: "15:30", end: "16:00" },
  { start: "16:00", end: "16:30" },
  { start: "16:30", end: "17:00" },
];

const today = new Date();
for (let day = 0; day < 7; day++) {
  const date = new Date(today);
  date.setDate(today.getDate() + day);
  const dateStr = date.toISOString().split("T")[0];

  for (const pid of providerIds) {
    for (const slot of timeSlots) {
      insertSlot.run(pid, dateStr, slot.start, slot.end);
    }
  }
}

console.log("✅ Database seeded successfully!");
console.log(`   - ${providers.length} providers`);
console.log(`   - ${serviceTemplates.flat().length} services`);
console.log(`   - ${providerIds.length * 7 * timeSlots.length} time slots (7 days)`);
