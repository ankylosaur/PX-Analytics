/**
 * seed_feedback.js — Firestore Seeder for Patient Feedback Collection
 *
 * Inserts 50 realistic patient feedback records into the `patient_feedback`
 * collection, distributed over the last 30 days.
 *
 * Prerequisites:
 *   1. Place your Firebase service-account JSON as "serviceAccountKey.json"
 *      in the same directory as this script.
 *   2. Run: node seed_feedback.js
 *
 * WARNING: This script DELETES all existing documents in `patient_feedback`
 *          before inserting fresh data.
 */

const admin = require("firebase-admin");
const path = require("path");

// ─── Firebase Admin Initialization ───────────────────────────────────────────
const serviceAccount = require(path.resolve(__dirname, "serviceAccountKey.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const Timestamp = admin.firestore.Timestamp;

// ─── Configuration ───────────────────────────────────────────────────────────

const COLLECTION = "patient_feedback";
const BATCH_LIMIT = 400;

// Doctors mapped to departments
const DOCTOR_DEPARTMENT_MAP = {
  "Dr. Sharma": "Cardiology",
  "Dr. Patel": "Cardiology",
  "Dr. Chen": "Neurology",
  "Dr. Williams": "Neurology",
  "Dr. Rodriguez": "Pediatrics",
  "Dr. Kim": "Pediatrics",
  "Dr. Nakamura": "Oncology",
  "Dr. Johnson": "Orthopedics",
};

// 30 unique patient names
const PATIENT_NAMES = [
  "John Doe", "Maria Garcia", "James Wilson", "Priya Kapoor", "Michael Brown",
  "Sarah Mitchell", "David Nguyen", "Emily Carter", "Robert Singh", "Jessica Lee",
  "Daniel Thompson", "Rachel Adams", "Kevin O'Brien", "Samantha Cruz", "Thomas Park",
  "Angela Rivera", "Christopher Hall", "Megan Foster", "Andrew Reyes", "Laura Chen",
  "Nathan Brooks", "Olivia Turner", "William Davis", "Hannah Scott", "Brian Martinez",
  "Stephanie Moore", "Jason Kim", "Rebecca Lewis", "Patrick Sullivan", "Diana Flores",
];

// ─── All 50 Feedback Records (Hardcoded) ─────────────────────────────────────
// Sentiment distribution: 28 Positive, 12 Neutral, 10 Negative
// Summaries conform strictly to: [Primary Sentiment Driver] + [Specific Incident/Context] (no filler, max 30 words, 1-2 sentences)

const FEEDBACK_DATA = [
  // ═══════════════════════════════════════════════════════════════════════════
  // POSITIVE RECORDS (28 total) — IDs FB-1001 through FB-1028
  // ═══════════════════════════════════════════════════════════════════════════
  {
    feedback_id: "FB-1001",
    patient_name: "John Doe",
    doctor_id: "Dr. Sharma",
    department: "Cardiology",
    transcript: "Dr. Sharma was incredibly thorough during my consultation. She explained every step of my cardiac evaluation and made sure I understood my medication schedule before leaving. The nursing staff was also very attentive throughout my visit.",
    sentiment: "Positive",
    summary: "Thorough cardiology consultation and clear medication review. Attentive nursing staff.",
    pain_points: [],
  },
  {
    feedback_id: "FB-1002",
    patient_name: "Maria Garcia",
    doctor_id: "Dr. Rodriguez",
    department: "Pediatrics",
    transcript: "The pediatrics team was wonderful with my daughter. Dr. Rodriguez made her feel comfortable and even used stuffed animals to explain the procedure. The nurses kept checking on us regularly, which really eased my anxiety as a parent.",
    sentiment: "Positive",
    summary: "Comfortable child-friendly pediatric procedure. Proactive and regular nursing follow-ups.",
    pain_points: [],
  },
  {
    feedback_id: "FB-1003",
    patient_name: "James Wilson",
    doctor_id: "Dr. Patel",
    department: "Cardiology",
    transcript: "Everything about my experience was great. Short wait times, friendly staff, and Dr. Patel gave me a clear follow-up plan for managing my blood pressure. I felt like my concerns were genuinely heard.",
    sentiment: "Positive",
    summary: "Short wait times and friendly staff. Clear blood pressure management follow-up plan.",
    pain_points: [],
  },
  {
    feedback_id: "FB-1004",
    patient_name: "Priya Kapoor",
    doctor_id: "Dr. Chen",
    department: "Neurology",
    transcript: "Dr. Chen took the time to explain my MRI results in terms I could actually understand. She didn't rush through anything and even drew a diagram to show where the issue was. I left feeling informed and confident about next steps.",
    sentiment: "Positive",
    summary: "Detailed MRI review with helpful visual aids. Unhurried and clear communication.",
    pain_points: [],
  },
  {
    feedback_id: "FB-1005",
    patient_name: "Michael Brown",
    doctor_id: "Dr. Johnson",
    department: "Orthopedics",
    transcript: "My knee replacement follow-up went smoothly. Dr. Johnson checked the healing progress carefully and adjusted my physical therapy plan. The front desk was also helpful with scheduling my next three appointments in one go.",
    sentiment: "Positive",
    summary: "Smooth post-operative knee recovery check. Highly efficient appointment scheduling.",
    pain_points: [],
  },
  {
    feedback_id: "FB-1006",
    patient_name: "Sarah Mitchell",
    doctor_id: "Dr. Nakamura",
    department: "Oncology",
    transcript: "Going through chemotherapy is terrifying, but Dr. Nakamura and the oncology nurses made me feel supported every step of the way. They answered all of my questions patiently and checked in on me emotionally, not just physically.",
    sentiment: "Positive",
    summary: "Exceptional emotional and physical support during chemotherapy. Highly caring oncology team.",
    pain_points: [],
  },
  {
    feedback_id: "FB-1007",
    patient_name: "David Nguyen",
    doctor_id: "Dr. Williams",
    department: "Neurology",
    transcript: "Dr. Williams was fantastic during my neurology consultation. He listened carefully to my description of symptoms and ordered the right tests without making me feel like a number. The entire experience was professional and compassionate.",
    sentiment: "Positive",
    summary: "Attentive symptom review and prompt diagnostic testing. Compassionate neurology care.",
    pain_points: [],
  },
  {
    feedback_id: "FB-1008",
    patient_name: "Emily Carter",
    doctor_id: "Dr. Kim",
    department: "Pediatrics",
    transcript: "Dr. Kim was amazing with my son who has severe needle anxiety. She spent extra time calming him down and used a numbing cream before the injection. My son actually said he wants to come back, which has never happened before!",
    sentiment: "Positive",
    summary: "Excellent pediatric needle anxiety management. Special numbing cream utilized.",
    pain_points: [],
  },
  {
    feedback_id: "FB-1009",
    patient_name: "Robert Singh",
    doctor_id: "Dr. Sharma",
    department: "Cardiology",
    transcript: "I came in for a stress test and the whole process was well-organized. Dr. Sharma explained what to expect at each stage and the technicians were skilled and reassuring. Got my results explained clearly the same day.",
    sentiment: "Positive",
    summary: "Well-organized cardiac stress test. Reassuring technicians and same-day results review.",
    pain_points: [],
  },
  {
    feedback_id: "FB-1010",
    patient_name: "Jessica Lee",
    doctor_id: "Dr. Nakamura",
    department: "Oncology",
    transcript: "Dr. Nakamura sat with me for over thirty minutes to discuss treatment options and their side effects. He made sure I understood the pros and cons of each approach and respected my wish to take a day to decide. I never felt pressured.",
    sentiment: "Positive",
    summary: "Thorough 30-minute oncology treatment options review. Highly supportive of patient autonomy.",
    pain_points: [],
  },
  {
    feedback_id: "FB-1011",
    patient_name: "Daniel Thompson",
    doctor_id: "Dr. Patel",
    department: "Cardiology",
    transcript: "Had an echocardiogram today and Dr. Patel walked me through the entire process beforehand. The waiting room was clean and comfortable, and I was seen within ten minutes of my appointment time. Really impressed with the efficiency.",
    sentiment: "Positive",
    summary: "Clear pre-procedure walk-through for echocardiogram. Clean facilities and ten-minute wait time.",
    pain_points: [],
  },
  {
    feedback_id: "FB-1012",
    patient_name: "Rachel Adams",
    doctor_id: "Dr. Rodriguez",
    department: "Pediatrics",
    transcript: "Brought my twins in for their vaccinations and Dr. Rodriguez handled both of them brilliantly. She was gentle, quick, and even gave them stickers and juice boxes afterwards. The whole visit took less than 30 minutes.",
    sentiment: "Positive",
    summary: "Gentle and rapid pediatric vaccination for twins. Efficient visit under thirty minutes.",
    pain_points: [],
  },
  {
    feedback_id: "FB-1013",
    patient_name: "Kevin O'Brien",
    doctor_id: "Dr. Johnson",
    department: "Orthopedics",
    transcript: "After my shoulder surgery, Dr. Johnson's rehabilitation plan has been spot-on. Every follow-up visit feels thorough and I can clearly see the progress. The physical therapy team he recommended is also outstanding.",
    sentiment: "Positive",
    summary: "Precise post-surgical shoulder rehabilitation plan. Outstanding recommended physical therapy team.",
    pain_points: [],
  },
  {
    feedback_id: "FB-1014",
    patient_name: "Samantha Cruz",
    doctor_id: "Dr. Chen",
    department: "Neurology",
    transcript: "I've been dealing with chronic migraines for years and Dr. Chen is the first neurologist who actually listened to my full history. She adjusted my medication and suggested lifestyle changes that have already started helping. Finally feel hopeful.",
    sentiment: "Positive",
    summary: "Comprehensive medical history review for migraine treatment. Highly effective medication adjustments.",
    pain_points: [],
  },
  {
    feedback_id: "FB-1015",
    patient_name: "Thomas Park",
    doctor_id: "Dr. Kim",
    department: "Pediatrics",
    transcript: "Dr. Kim was very thorough during my daughter's annual checkup. She caught a minor issue with her vision that we hadn't noticed and referred us to a specialist right away. Very grateful for her attention to detail.",
    sentiment: "Positive",
    summary: "Attentive pediatric checkup. Vision issue detected promptly, leading to immediate specialist referral.",
    pain_points: [],
  },
  {
    feedback_id: "FB-1016",
    patient_name: "Angela Rivera",
    doctor_id: "Dr. Williams",
    department: "Neurology",
    transcript: "The neurology department is run like clockwork. I arrived, checked in quickly, and Dr. Williams was ready for me almost immediately. His bedside manner is warm and he explained my EEG results with great clarity.",
    sentiment: "Positive",
    summary: "Excellent neurology department operational efficiency. Warm bedside manner and clear EEG explanations.",
    pain_points: [],
  },
  {
    feedback_id: "FB-1017",
    patient_name: "Christopher Hall",
    doctor_id: "Dr. Sharma",
    department: "Cardiology",
    transcript: "Dr. Sharma genuinely cares about her patients. She remembered details from my last visit and asked about my exercise routine. The cardiac rehab program she recommended has made a real difference in my daily energy levels.",
    sentiment: "Positive",
    summary: "Personalized cardiology care and high continuity. Recommended rehab program improved daily energy.",
    pain_points: [],
  },
  {
    feedback_id: "FB-1018",
    patient_name: "Megan Foster",
    doctor_id: "Dr. Nakamura",
    department: "Oncology",
    transcript: "The infusion center staff made my treatment session as comfortable as possible. Warm blankets, regular check-ins, and Dr. Nakamura stopped by personally to see how I was doing. It's the little things that matter most during cancer treatment.",
    sentiment: "Positive",
    summary: "Highly comfortable oncology infusion session. Attentive staff and personal check-in by physician.",
    pain_points: [],
  },
  {
    feedback_id: "FB-1019",
    patient_name: "Andrew Reyes",
    doctor_id: "Dr. Johnson",
    department: "Orthopedics",
    transcript: "Came in with severe back pain and Dr. Johnson diagnosed the issue quickly. He was honest about the recovery timeline and didn't oversell the treatment. I appreciate doctors who set realistic expectations rather than making empty promises.",
    sentiment: "Positive",
    summary: "Rapid orthopedic diagnosis for back pain. Honest and realistic recovery timeline set.",
    pain_points: [],
  },
  {
    feedback_id: "FB-1020",
    patient_name: "Laura Chen",
    doctor_id: "Dr. Patel",
    department: "Cardiology",
    transcript: "I was nervous about my heart catheterization, but Dr. Patel took time before the procedure to walk me through every step. The post-procedure care was excellent too — the nurses made sure I was comfortable and monitored closely.",
    sentiment: "Positive",
    summary: "Reassuring pre-procedure explanation for heart catheterization. Attentive post-procedure monitoring.",
    pain_points: [],
  },
  {
    feedback_id: "FB-1021",
    patient_name: "Nathan Brooks",
    doctor_id: "Dr. Rodriguez",
    department: "Pediatrics",
    transcript: "Dr. Rodriguez is our family's pediatrician and we wouldn't go anywhere else. She knows our kids by name, remembers their medical history, and always makes time for our questions. The receptionist team is also wonderfully friendly.",
    sentiment: "Positive",
    summary: "Consistent and caring pediatric follow-up. Warm staff and accommodating appointment discussions.",
    pain_points: [],
  },
  {
    feedback_id: "FB-1022",
    patient_name: "Olivia Turner",
    doctor_id: "Dr. Chen",
    department: "Neurology",
    transcript: "After my MS diagnosis, Dr. Chen has been my rock. She stays updated on the latest research and discusses new treatment options with me proactively. I never feel like just another patient — she treats me as a partner in my care.",
    sentiment: "Positive",
    summary: "Proactive discuss of latest MS research and treatments. Collaborative care approach.",
    pain_points: [],
  },
  {
    feedback_id: "FB-1023",
    patient_name: "William Davis",
    doctor_id: "Dr. Kim",
    department: "Pediatrics",
    transcript: "Brought my newborn in for her first well-baby visit. Dr. Kim was incredibly gentle and patient, explaining every developmental milestone we should watch for. She also took time to address my wife's breastfeeding concerns.",
    sentiment: "Positive",
    summary: "Gentle newborn well-baby checkup. Practical breastfeeding support and clear developmental guidance.",
    pain_points: [],
  },
  {
    feedback_id: "FB-1024",
    patient_name: "Hannah Scott",
    doctor_id: "Dr. Sharma",
    department: "Cardiology",
    transcript: "I had a cardiac scare and was rushed to the ER. Dr. Sharma arrived quickly and her calm, confident manner immediately put me at ease. The follow-up plan she created was detailed and she made sure I had her nurse's direct line for questions.",
    sentiment: "Positive",
    summary: "Rapid response and calm bedside presence during cardiac scare. Clear communication access.",
    pain_points: [],
  },
  {
    feedback_id: "FB-1025",
    patient_name: "Brian Martinez",
    doctor_id: "Dr. Williams",
    department: "Neurology",
    transcript: "Dr. Williams detected early signs of peripheral neuropathy that my previous doctor missed. He explained the condition clearly and started me on a treatment plan immediately. I'm grateful he caught it early.",
    sentiment: "Positive",
    summary: "Prompt detection of peripheral neuropathy. Immediate start on structured treatment plan.",
    pain_points: [],
  },
  {
    feedback_id: "FB-1026",
    patient_name: "Stephanie Moore",
    doctor_id: "Dr. Johnson",
    department: "Orthopedics",
    transcript: "The cast removal process was quick and painless. Dr. Johnson checked the healed fracture with an X-ray and was pleased with the result. He gave me clear instructions on gradually returning to my normal activities.",
    sentiment: "Positive",
    summary: "Painless wrist fracture cast removal. Clear instructions for returning to normal activities.",
    pain_points: [],
  },
  {
    feedback_id: "FB-1027",
    patient_name: "Jason Kim",
    doctor_id: "Dr. Nakamura",
    department: "Oncology",
    transcript: "Dr. Nakamura delivered difficult news with remarkable sensitivity. He gave us time to process, answered every question we had, and connected us with the hospital's counseling service. His empathy during such a hard time meant the world to our family.",
    sentiment: "Positive",
    summary: "Empathetic delivery of difficult oncology prognosis. Clear explanation and counseling referral.",
    pain_points: [],
  },
  {
    feedback_id: "FB-1028",
    patient_name: "Rebecca Lewis",
    doctor_id: "Dr. Patel",
    department: "Cardiology",
    transcript: "My annual cardiac checkup with Dr. Patel was thorough as always. He reviewed my cholesterol levels, adjusted one of my medications, and reminded me about dietary changes. The lab work was processed quickly and results shared the same day.",
    sentiment: "Positive",
    summary: "Thorough annual checkup and lab work. Same-day test results provided.",
    pain_points: [],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEUTRAL RECORDS (12 total) — IDs FB-1029 through FB-1040
  // ═══════════════════════════════════════════════════════════════════════════
  {
    feedback_id: "FB-1029",
    patient_name: "Patrick Sullivan",
    doctor_id: "Dr. Chen",
    department: "Neurology",
    transcript: "My appointment went fine. Dr. Chen was professional but seemed a bit rushed during the consultation. The waiting room could use more comfortable seating, but overall no major complaints.",
    sentiment: "Neutral",
    summary: "Professional neurology checkup. Doctor appeared rushed; waiting area seating was uncomfortable.",
    pain_points: ["Rushed consultation"],
  },
  {
    feedback_id: "FB-1030",
    patient_name: "Diana Flores",
    doctor_id: "Dr. Sharma",
    department: "Cardiology",
    transcript: "Treatment was adequate and the results were explained clearly enough. I wish I had more time to ask questions during the consultation, but Dr. Sharma did cover the essentials.",
    sentiment: "Neutral",
    summary: "Adequate cardiac checkup. Consultation felt rushed; limited opportunity to ask questions.",
    pain_points: ["Rushed consultation"],
  },
  {
    feedback_id: "FB-1031",
    patient_name: "John Doe",
    doctor_id: "Dr. Johnson",
    department: "Orthopedics",
    transcript: "The medical care was solid but the parking situation at the hospital is really frustrating. I circled the lot for 20 minutes before finding a spot. The appointment itself was fine once I got inside.",
    sentiment: "Neutral",
    summary: "Competent orthopedic care. Frustrating 20-minute search for hospital parking.",
    pain_points: ["Parking difficulties"],
  },
  {
    feedback_id: "FB-1032",
    patient_name: "Maria Garcia",
    doctor_id: "Dr. Kim",
    department: "Pediatrics",
    transcript: "Dr. Kim was good with my child but the appointment ran about 40 minutes late. I understand doctors get behind schedule, but some communication about the delay would have been appreciated.",
    sentiment: "Neutral",
    summary: "Good pediatric care. Forty-minute delay without proactive communication from staff.",
    pain_points: ["Long wait times"],
  },
  {
    feedback_id: "FB-1033",
    patient_name: "James Wilson",
    doctor_id: "Dr. Nakamura",
    department: "Oncology",
    transcript: "The oncology department is very professional and the medical care is excellent. However, the ward was quite noisy during my treatment session — other patients' visitors were talking loudly and it was hard to rest.",
    sentiment: "Neutral",
    summary: "Excellent oncology treatment. High noise levels in ward due to loud visitors.",
    pain_points: ["Noise levels in ward"],
  },
  {
    feedback_id: "FB-1034",
    patient_name: "Priya Kapoor",
    doctor_id: "Dr. Williams",
    department: "Neurology",
    transcript: "Dr. Williams is knowledgeable, no doubt about it. But the follow-up process could be better. I was told I'd get a call within two days with my test results, but had to call them myself after a week.",
    sentiment: "Neutral",
    summary: "Competent neurology care. Test results delayed one week, requiring patient follow-up.",
    pain_points: ["Inadequate follow-up"],
  },
  {
    feedback_id: "FB-1035",
    patient_name: "Michael Brown",
    doctor_id: "Dr. Rodriguez",
    department: "Pediatrics",
    transcript: "Decent visit overall. Dr. Rodriguez was friendly and the checkup was thorough. The only issue was that the hospital food in the cafeteria was quite bland — my son refused to eat it while we waited.",
    sentiment: "Neutral",
    summary: "Friendly pediatric checkup. Hospital cafeteria food was noted as extremely bland.",
    pain_points: ["Food quality concerns"],
  },
  {
    feedback_id: "FB-1036",
    patient_name: "Emily Carter",
    doctor_id: "Dr. Patel",
    department: "Cardiology",
    transcript: "The check-in process was smooth and the nurses were helpful. Dr. Patel seemed competent but I felt like the consultation was a bit surface-level. I left with some unanswered questions about my long-term cardiac health.",
    sentiment: "Neutral",
    summary: "Competent cardiologist review. Consultation lacked depth; unresolved questions on long-term health.",
    pain_points: [],
  },
  {
    feedback_id: "FB-1037",
    patient_name: "David Nguyen",
    doctor_id: "Dr. Johnson",
    department: "Orthopedics",
    transcript: "Dr. Johnson did a good job with my wrist examination. The X-ray technician was professional too. My only gripe is the uncomfortable chairs in the waiting area — not ideal when you're already in pain.",
    sentiment: "Neutral",
    summary: "Good orthopedic examination. Waiting room seating was noted as highly uncomfortable.",
    pain_points: ["Uncomfortable facilities"],
  },
  {
    feedback_id: "FB-1038",
    patient_name: "Robert Singh",
    doctor_id: "Dr. Chen",
    department: "Neurology",
    transcript: "Had a routine follow-up for my epilepsy medication. Dr. Chen reviewed everything and kept my current prescription. The visit itself was uneventful, which I suppose is a good thing. Nothing exceptional to report either way.",
    sentiment: "Neutral",
    summary: "Routine epilepsy follow-up appointment. Prescription maintained; standard visit with no issues.",
    pain_points: [],
  },
  {
    feedback_id: "FB-1039",
    patient_name: "Jessica Lee",
    doctor_id: "Dr. Sharma",
    department: "Cardiology",
    transcript: "I had trouble scheduling this appointment — the online system kept glitching and I had to call in three times. Once I actually got to the appointment, Dr. Sharma was great, but the scheduling process needs work.",
    sentiment: "Neutral",
    summary: "Excellent cardiac care. Significant scheduling difficulties due to online system glitches.",
    pain_points: ["Appointment scheduling issues"],
  },
  {
    feedback_id: "FB-1040",
    patient_name: "Daniel Thompson",
    doctor_id: "Dr. Nakamura",
    department: "Oncology",
    transcript: "The medical care at the oncology department is top-notch but the hospital could do better with staff availability at the reception. I stood waiting for five minutes before anyone acknowledged me.",
    sentiment: "Neutral",
    summary: "Solid oncology care. Reception area understaffed, resulting in a five-minute wait.",
    pain_points: ["Staff availability issues"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEGATIVE RECORDS (10 total) — IDs FB-1041 through FB-1050
  // ═══════════════════════════════════════════════════════════════════════════
  {
    feedback_id: "FB-1041",
    patient_name: "Rachel Adams",
    doctor_id: "Dr. Sharma",
    department: "Cardiology",
    transcript: "I waited over three hours past my scheduled appointment time. When I finally saw the doctor, the consultation lasted barely five minutes. Very disappointing, especially given how serious cardiac issues are.",
    sentiment: "Negative",
    summary: "Excessive three-hour wait time. Rushed five-minute cardiac consultation.",
    pain_points: ["Long wait times", "Rushed consultation"],
  },
  {
    feedback_id: "FB-1042",
    patient_name: "Kevin O'Brien",
    doctor_id: "Dr. Williams",
    department: "Neurology",
    transcript: "The billing department lost my insurance information twice. I had to call back four times over two weeks to get it resolved. The medical care from Dr. Williams was fine, but the administrative side is absolutely terrible.",
    sentiment: "Negative",
    summary: "Lost insurance records and billing issues. Four follow-up calls required.",
    pain_points: ["Billing errors", "Administrative delays"],
  },
  {
    feedback_id: "FB-1043",
    patient_name: "Samantha Cruz",
    doctor_id: "Dr. Rodriguez",
    department: "Pediatrics",
    transcript: "My discharge paperwork had errors in the medication dosage for my child. If I hadn't double-checked, my daughter could have received the wrong amount. This is unacceptable, especially in a pediatric setting where dosing precision is critical.",
    sentiment: "Negative",
    summary: "Dangerous dosage error on pediatric discharge paperwork. Caught by parent vigilance.",
    pain_points: ["Slow discharge process", "Medication instructions unclear", "Administrative delays"],
  },
  {
    feedback_id: "FB-1044",
    patient_name: "Thomas Park",
    doctor_id: "Dr. Johnson",
    department: "Orthopedics",
    transcript: "The nurses were great, but it took four hours to get my discharge paperwork after my procedure. I was ready to leave by noon but didn't get out until almost 4 PM. The wait was exhausting and completely unnecessary.",
    sentiment: "Negative",
    summary: "Exhausting four-hour wait for post-procedure discharge paperwork. Unacceptable administrative delay.",
    pain_points: ["Slow discharge process", "Administrative delays"],
  },
  {
    feedback_id: "FB-1045",
    patient_name: "Angela Rivera",
    doctor_id: "Dr. Patel",
    department: "Cardiology",
    transcript: "Dr. Patel barely made eye contact during my entire visit. He typed on his computer the whole time and didn't ask about how I was feeling emotionally about my diagnosis. I left feeling like a chart number, not a person.",
    sentiment: "Negative",
    summary: "Cold, disengaged cardiology visit. Doctor made minimal eye contact and lacked empathy.",
    pain_points: ["Lack of empathy", "Poor communication"],
  },
  {
    feedback_id: "FB-1046",
    patient_name: "Christopher Hall",
    doctor_id: "Dr. Chen",
    department: "Neurology",
    transcript: "My medication was changed last visit but nobody explained the potential side effects properly. I experienced severe dizziness for two weeks before I called back and learned it was a common reaction they should have warned me about.",
    sentiment: "Negative",
    summary: "Severe medication side effects experienced. Proper warning and counseling not provided.",
    pain_points: ["Medication instructions unclear", "Poor communication", "Inadequate follow-up"],
  },
  {
    feedback_id: "FB-1047",
    patient_name: "Megan Foster",
    doctor_id: "Dr. Kim",
    department: "Pediatrics",
    transcript: "Tried to schedule a follow-up for my son and was told the earliest available slot was six weeks out. When I explained it was urgent, the receptionist was dismissive and said there was nothing she could do. Ended up going to another hospital.",
    sentiment: "Negative",
    summary: "Dismissive pediatric receptionist. Unacceptable six-week wait for urgent follow-up appointment.",
    pain_points: ["Appointment scheduling issues", "Staff availability issues", "Lack of empathy"],
  },
  {
    feedback_id: "FB-1048",
    patient_name: "Andrew Reyes",
    doctor_id: "Dr. Nakamura",
    department: "Oncology",
    transcript: "The treatment itself was fine, but the communication between departments is broken. My oncologist ordered labs that the lab said they never received. I was bounced between three departments for an hour trying to sort it out. Exhausting.",
    sentiment: "Negative",
    summary: "Inter-departmental communication failure. Lost lab orders caused one-hour delay.",
    pain_points: ["Poor communication", "Administrative delays"],
  },
  {
    feedback_id: "FB-1049",
    patient_name: "Laura Chen",
    doctor_id: "Dr. Williams",
    department: "Neurology",
    transcript: "I was told to arrive 30 minutes early to fill out paperwork, which I did. Then I still waited over two hours past my scheduled time. There were not enough staff at the front desk and nobody apologized for the delay. I felt completely disrespected.",
    sentiment: "Negative",
    summary: "Two-hour waiting delay despite early arrival. Reception desk understaffed and apologetic.",
    pain_points: ["Long wait times", "Staff availability issues"],
  },
  {
    feedback_id: "FB-1050",
    patient_name: "Nathan Brooks",
    doctor_id: "Dr. Johnson",
    department: "Orthopedics",
    transcript: "The follow-up after my surgery was practically nonexistent. I was discharged with a generic instruction sheet and no one called to check how I was recovering. When I called with concerns about swelling, I was put on hold for 45 minutes.",
    sentiment: "Negative",
    summary: "Nonexistent post-surgical follow-up. Swelling concerns resulted in 45-minute hold time.",
    pain_points: ["Inadequate follow-up", "Poor communication", "Staff availability issues"],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomTimestampForDay(daysAgo) {
  const now = new Date();
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(7, 0, 0, 0);
  const minuteOffset = randInt(0, 720); // 12-hour window
  date.setMinutes(date.getMinutes() + minuteOffset);
  return Timestamp.fromDate(date);
}

// ─── Delete Collection ───────────────────────────────────────────────────────

async function deleteCollection(collectionName) {
  console.log(`[clear] Deleting all documents in "${collectionName}"...`);
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();

  if (snapshot.empty) {
    console.log(`  [clear] Collection "${collectionName}" is already empty.`);
    return 0;
  }

  let batch = db.batch();
  let count = 0;
  const total = snapshot.docs.length;

  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
    count++;

    if (count % BATCH_LIMIT === 0) {
      await batch.commit();
      console.log(`  [clear] Deleted ${count}/${total} documents...`);
      batch = db.batch();
      count = 0;
    }
  }

  if (count % BATCH_LIMIT !== 0) {
    await batch.commit();
  }

  console.log(`  [clear] Deleted all ${total} documents from "${collectionName}".\n`);
  return total;
}

// ─── Seed Feedback ───────────────────────────────────────────────────────────

async function seedFeedback() {
  console.log(`[seed] Inserting ${FEEDBACK_DATA.length} feedback documents...\n`);

  const daysDistribution = [];
  for (let i = 0; i < FEEDBACK_DATA.length; i++) {
    const daysAgo = randInt(0, 29);
    daysDistribution.push(daysAgo);
  }

  let batch = db.batch();
  let batchCount = 0;
  let totalWritten = 0;

  const sentimentCounts = { Positive: 0, Neutral: 0, Negative: 0 };
  const departmentCounts = {};

  for (let i = 0; i < FEEDBACK_DATA.length; i++) {
    const record = FEEDBACK_DATA[i];
    const daysAgo = daysDistribution[i];

    const doc = {
      feedback_id: record.feedback_id,
      timestamp: randomTimestampForDay(daysAgo),
      patient_name: record.patient_name,
      doctor_id: record.doctor_id,
      department: record.department,
      transcript: record.transcript,
      sentiment: record.sentiment,
      summary: record.summary,
      pain_points: record.pain_points,
    };

    sentimentCounts[record.sentiment]++;
    departmentCounts[record.department] = (departmentCounts[record.department] || 0) + 1;

    const ref = db.collection(COLLECTION).doc();
    batch.set(ref, doc);
    batchCount++;

    console.log(`  [+] ${record.feedback_id} | ${record.sentiment.padEnd(8)} | ${record.department.padEnd(12)} | ${record.doctor_id.padEnd(15)} | ${record.patient_name}`);

    if (batchCount >= BATCH_LIMIT) {
      await batch.commit();
      totalWritten += batchCount;
      console.log(`\n  [batch] Committed ${totalWritten}/${FEEDBACK_DATA.length} documents\n`);
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
    totalWritten += batchCount;
    console.log(`\n  [batch] Committed ${totalWritten}/${FEEDBACK_DATA.length} documents`);
  }

  console.log("\n" + "═".repeat(55));
  console.log("  SEEDING COMPLETE — Summary");
  console.log("═".repeat(55));
  console.log(`\n  Total documents written: ${totalWritten}`);

  console.log("\n  Sentiment Distribution:");
  for (const [sentiment, count] of Object.entries(sentimentCounts)) {
    const pct = ((count / totalWritten) * 100).toFixed(1);
    const bar = "█".repeat(Math.round(count / 2));
    console.log(`    ${sentiment.padEnd(10)} ${String(count).padStart(2)} (${pct}%) ${bar}`);
  }

  console.log("\n  Department Distribution:");
  const sortedDepts = Object.entries(departmentCounts).sort((a, b) => b[1] - a[1]);
  for (const [dept, count] of sortedDepts) {
    const pct = ((count / totalWritten) * 100).toFixed(1);
    console.log(`    ${dept.padEnd(14)} ${String(count).padStart(2)} (${pct}%)`);
  }

  console.log("");
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═".repeat(55));
  console.log("  Patient Feedback — Firestore Seeder");
  console.log("═".repeat(55));

  try {
    const deleted = await deleteCollection(COLLECTION);
    await seedFeedback();
    console.log("[seed] DONE. patient_feedback collection has been seeded with 50 records.");
    console.log("[seed] Verify in Firebase Console or refresh your frontend.\n");
  } catch (err) {
    console.error("\n[seed] ERROR:", err.message);
    console.error(err.stack);
    process.exit(1);
  }

  process.exit(0);
}

main();
