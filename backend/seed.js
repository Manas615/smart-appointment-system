/**
 * Seeds the database with sample providers, services, and time slots.
 * Run with: node seed.js
 */
const db = require("./db");

// Clear existing data
db.exec(`
  DELETE FROM reviews;
  DELETE FROM appointments;
  DELETE FROM time_slots;
  DELETE FROM services;
  DELETE FROM providers;
`);

// Insert sample providers
const insertProvider = db.prepare(
  "INSERT INTO providers (name, specialty, email, phone, bio) VALUES (?, ?, ?, ?, ?)"
);

const specialtyServices = {
  "General Medicine": [
    { name: "General Consultation", duration: 30, price: 500 },
    { name: "Health Checkup", duration: 60, price: 1500 },
    { name: "Follow-up Visit", duration: 15, price: 300 },
  ],
  "Dentistry": [
    { name: "Dental Checkup", duration: 30, price: 600 },
    { name: "Teeth Cleaning", duration: 45, price: 1200 },
    { name: "Tooth Extraction", duration: 60, price: 2000 },
  ],
  "Dermatology": [
    { name: "Skin Consultation", duration: 30, price: 800 },
    { name: "Acne Treatment", duration: 45, price: 1500 },
    { name: "Laser Therapy", duration: 60, price: 5000 },
  ],
  "Orthopedics": [
    { name: "Orthopedic Consultation", duration: 30, price: 700 },
    { name: "Physiotherapy Session", duration: 45, price: 1000 },
    { name: "X-Ray & Evaluation", duration: 60, price: 2500 },
  ],
  "Pediatrics": [
    { name: "Child Wellness Visit", duration: 30, price: 600 },
    { name: "Vaccination", duration: 15, price: 400 },
    { name: "Growth Assessment", duration: 45, price: 1200 },
  ],
  "Cardiology": [
    { name: "Cardiac Consultation", duration: 30, price: 1000 },
    { name: "ECG Test", duration: 30, price: 800 },
    { name: "Stress Test", duration: 60, price: 3000 },
  ],
  "Neurology": [
    { name: "Neurological Consultation", duration: 30, price: 1200 },
    { name: "EEG Test", duration: 45, price: 2000 },
    { name: "Migraine Treatment Plan", duration: 30, price: 900 },
  ],
  "ENT": [
    { name: "ENT Consultation", duration: 30, price: 600 },
    { name: "Hearing Test (Audiometry)", duration: 30, price: 800 },
    { name: "Sinus Treatment", duration: 45, price: 1500 },
  ],
  "Ophthalmology": [
    { name: "Eye Examination", duration: 30, price: 500 },
    { name: "Vision Correction Consult", duration: 30, price: 700 },
    { name: "Retina Screening", duration: 45, price: 2000 },
  ],
  "Psychiatry": [
    { name: "Mental Health Consultation", duration: 45, price: 1000 },
    { name: "Therapy Session", duration: 60, price: 1500 },
    { name: "Stress & Anxiety Evaluation", duration: 30, price: 800 },
  ],
  "Gynecology": [
    { name: "Gynecology Consultation", duration: 30, price: 800 },
    { name: "Prenatal Checkup", duration: 45, price: 1200 },
    { name: "Ultrasound Screening", duration: 30, price: 1800 },
  ],
};

const baseProviders = [
  { name: "Dr. Ananya Sharma", specialty: "General Medicine", email: "ananya.sharma@clinic.com", phone: "+91 98765 43210", bio: "15+ years of experience in general medicine and preventive healthcare." },
  { name: "Dr. Rajesh Patel", specialty: "Dentistry", email: "rajesh.patel@clinic.com", phone: "+91 98765 43211", bio: "Specialist in cosmetic dentistry and orthodontics with modern techniques." },
  { name: "Dr. Priya Nair", specialty: "Dermatology", email: "priya.nair@clinic.com", phone: "+91 98765 43212", bio: "Expert in skin care, laser treatments, and dermatological surgery." },
  { name: "Dr. Vikram Singh", specialty: "Orthopedics", email: "vikram.singh@clinic.com", phone: "+91 98765 43213", bio: "Sports medicine specialist with experience in joint replacement surgery." },
  { name: "Dr. Meera Krishnan", specialty: "Pediatrics", email: "meera.krishnan@clinic.com", phone: "+91 98765 43214", bio: "Compassionate pediatrician focused on child development and nutrition." },
  { name: "Dr. Arjun Reddy", specialty: "Cardiology", email: "arjun.reddy@clinic.com", phone: "+91 98765 43215", bio: "Interventional cardiologist with expertise in minimally invasive procedures." },
  { name: "Dr. Sneha Kulkarni", specialty: "Neurology", email: "sneha.kulkarni@clinic.com", phone: "+91 98765 43216", bio: "Fellowship-trained neurologist specializing in epilepsy and stroke management." },
  { name: "Dr. Rahul Verma", specialty: "ENT", email: "rahul.verma@clinic.com", phone: "+91 98765 43217", bio: "ENT surgeon with 12 years of experience in sinus and ear surgeries." },
  { name: "Dr. Kavita Menon", specialty: "Ophthalmology", email: "kavita.menon@clinic.com", phone: "+91 98765 43218", bio: "Expert ophthalmologist specializing in cataract and LASIK surgery." },
  { name: "Dr. Deepak Joshi", specialty: "Psychiatry", email: "deepak.joshi@clinic.com", phone: "+91 98765 43219", bio: "Experienced psychiatrist offering comprehensive mental health care." },
  { name: "Dr. Aarti Desai", specialty: "Gynecology", email: "aarti.desai@clinic.com", phone: "+91 98765 43220", bio: "Renowned gynecologist with expertise in high-risk pregnancies and minimally invasive surgery." },
];

const firstNames = ["Amit", "Sneha", "Rahul", "Pooja", "Karan", "Neha", "Sanjay", "Kavita", "Ramesh", "Sunita", "Deepak", "Aarti", "Manoj", "Swati", "Nikhil", "Divya", "Rohan", "Tanvi", "Harsh", "Anjali"];
const lastNames = ["Gupta", "Kumar", "Iyer", "Rao", "Deshmukh", "Joshi", "Bansal", "Mehta", "Chawla", "Bose", "Menon", "Das", "Saxena", "Tiwari", "Shetty", "Kapoor"];

const specialtyBios = {
  "General Medicine": [
    "Dedicated general physician with a focus on chronic disease management.",
    "Experienced in preventive medicine and health counseling.",
    "Primary care specialist with expertise in lifestyle medicine.",
  ],
  "Dentistry": [
    "Proficient in restorative dentistry and root canal treatments.",
    "Focused on pediatric dentistry and dental anxiety management.",
    "Specialist in dental implants and prosthetics.",
  ],
  "Dermatology": [
    "Expert in clinical dermatology and cosmetic procedures.",
    "Specializes in psoriasis, eczema, and autoimmune skin conditions.",
    "Skilled in hair transplantation and scalp disorders.",
  ],
  "Orthopedics": [
    "Expert in arthroscopic surgery and ligament reconstruction.",
    "Specializes in spine disorders and minimally invasive spine surgery.",
    "Focused on pediatric orthopedics and deformity correction.",
  ],
  "Pediatrics": [
    "Dedicated to newborn and infant healthcare.",
    "Specialist in childhood immunization and infectious diseases.",
    "Focused on adolescent medicine and behavioral disorders.",
  ],
  "Cardiology": [
    "Specialist in electrophysiology and cardiac rhythm management.",
    "Experienced in echocardiography and preventive cardiology.",
    "Focused on heart failure management and cardiac rehabilitation.",
  ],
  "Neurology": [
    "Specialist in movement disorders and Parkinson's disease.",
    "Expert in multiple sclerosis and neuroimmunology.",
    "Focused on headache disorders and neurovascular conditions.",
  ],
  "ENT": [
    "Expert in head and neck oncology and reconstructive surgery.",
    "Specialist in pediatric ENT and airway disorders.",
    "Focused on voice disorders and laryngology.",
  ],
  "Ophthalmology": [
    "Specialist in glaucoma management and surgical treatment.",
    "Expert in pediatric ophthalmology and strabismus.",
    "Focused on retinal disorders and vitreoretinal surgery.",
  ],
  "Psychiatry": [
    "Specialist in addiction psychiatry and rehabilitation.",
    "Focused on child and adolescent mental health.",
    "Expert in cognitive behavioral therapy and mood disorders.",
  ],
  "Gynecology": [
    "Specialist in reproductive endocrinology and fertility.",
    "Expert in laparoscopic gynecological surgery.",
    "Focused on menopause management and hormone therapy.",
  ],
};

// Dynamically add 15 more doctors per specialty
const providers = [...baseProviders];
let docCounter = 1;

for (const specialty of Object.keys(specialtyServices)) {
  const bios = specialtyBios[specialty] || [];
  for (let i = 0; i < 15; i++) {
    const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const bio = bios[i % bios.length] || `Experienced specialist in ${specialty}. Dedicated to providing excellent patient care and clinical outcomes.`;
    providers.push({
      name: `Dr. ${fName} ${lName}`,
      specialty: specialty,
      email: `${fName.toLowerCase()}.${lName.toLowerCase()}.${docCounter}@clinic.com`,
      phone: `+91 ${9000000000 + docCounter}`,
      bio: bio,
    });
    docCounter++;
  }
}

const providerRecords = [];
for (const p of providers) {
  const result = insertProvider.run(p.name, p.specialty, p.email, p.phone, p.bio);
  providerRecords.push({ id: Number(result.lastInsertRowid), specialty: p.specialty });
}

// Insert services for each provider based on their specialty
const insertService = db.prepare(
  "INSERT INTO services (provider_id, name, duration_minutes, price) VALUES (?, ?, ?, ?)"
);

let totalServicesSeeded = 0;
providerRecords.forEach((provider) => {
  const services = specialtyServices[provider.specialty] || [];
  for (const svc of services) {
    insertService.run(provider.id, svc.name, svc.duration, svc.price);
    totalServicesSeeded++;
  }
});

// Insert time slots for the next 14 days
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
for (let day = 0; day < 14; day++) {
  const date = new Date(today);
  date.setDate(today.getDate() + day);
  const dateStr = date.toISOString().split("T")[0];

  for (const provider of providerRecords) {
    for (const slot of timeSlots) {
      insertSlot.run(provider.id, dateStr, slot.start, slot.end);
    }
  }
}

// Generate dummy patients and book random time slots
const getService = db.prepare("SELECT id FROM services WHERE provider_id = ? LIMIT 1");
const assignAppointments = db.prepare(
  "INSERT INTO appointments (patient_name, patient_email, provider_id, service_id, slot_id, status) VALUES (?, ?, ?, ?, ?, 'confirmed')"
);
const markSlotBooked = db.prepare("UPDATE time_slots SET is_available = 0 WHERE id = ?");

const dummyPatients = [
  "Aarav Patel", "Riya Sharma", "Ishaan Gupta", "Diya Singh", "Kabir Reddy",
  "Aditi Desai", "Vihaan Joshi", "Sara Khan", "Aryan Mehta", "Ananya Rao",
  "Om Tiwari", "Myra Kapoor", "Reyansh Das", "Kiara Bose", "Vivaan Shetty",
];
let appointmentsCreated = 0;

const randomSlotsToFill = db.prepare("SELECT * FROM time_slots ORDER BY RANDOM() LIMIT 150").all();

for (const slot of randomSlotsToFill) {
  const service = getService.get(slot.provider_id);
  if (service) {
    const pName = dummyPatients[Math.floor(Math.random() * dummyPatients.length)];
    const pEmail = pName.split(" ")[0].toLowerCase() + Math.floor(Math.random() * 100) + "@example.com";

    assignAppointments.run(pName, pEmail, slot.provider_id, service.id, slot.id);
    markSlotBooked.run(slot.id);
    appointmentsCreated++;
  }
}

// Generate some reviews for booked appointments
const insertReview = db.prepare(
  "INSERT INTO reviews (appointment_id, provider_id, patient_name, patient_email, rating, comment) VALUES (?, ?, ?, ?, ?, ?)"
);

const reviewComments = [
  "Excellent doctor! Very thorough and professional.",
  "Great experience. The doctor was very patient and explained everything clearly.",
  "Highly recommend. Very knowledgeable and caring.",
  "Good consultation. Would visit again.",
  "Very professional and friendly. Made me feel comfortable.",
  "Amazing expertise. Resolved my issue quickly.",
  "Wonderful experience. The staff was also very helpful.",
  "The doctor took time to listen and provided great advice.",
  "Very satisfied with the treatment. Feeling much better now.",
  "Outstanding care. Truly dedicated professional.",
];

const bookedAppointments = db.prepare(
  "SELECT a.id, a.provider_id, a.patient_name, a.patient_email FROM appointments a WHERE a.status = 'confirmed' ORDER BY RANDOM() LIMIT 40"
).all();

let reviewsCreated = 0;
for (const appt of bookedAppointments) {
  try {
    const rating = Math.floor(Math.random() * 2) + 4; // 4 or 5 stars
    const comment = reviewComments[Math.floor(Math.random() * reviewComments.length)];
    insertReview.run(appt.id, appt.provider_id, appt.patient_name, appt.patient_email, rating, comment);
    reviewsCreated++;
  } catch {
    // skip duplicates
  }
}

console.log("✅ Database seeded successfully!");
console.log(`   - ${providers.length} providers (${Object.keys(specialtyServices).length} specialties)`);
console.log(`   - ${totalServicesSeeded} services`);
console.log(`   - ${providerRecords.length * 14 * timeSlots.length} time slots (14 days)`);
console.log(`   - ${appointmentsCreated} dummy appointments`);
console.log(`   - ${reviewsCreated} reviews`);
