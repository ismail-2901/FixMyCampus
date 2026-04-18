// services/chatbotService.js - AI Chatbot with Groq API / OpenAI Fallback
const db = require('../config/db');
const { OpenAI } = require('openai');

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.3-70b-versatile';

async function callGroqAPI(prompt) {
  if (!GROQ_API_KEY) return null;
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: DAFFODIL_CONTEXT },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
        top_p: 0.9,
        stream: false
      })
    });
    
    if (!response.ok) {
      const err = await response.text();
      console.error(`Groq API error ${response.status}:`, err);
      return null;
    }
    
    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    return text || null;
  } catch (e) {
    console.error('Groq API error:', e.message);
    return null;
  }
}

const DAFFODIL_CONTEXT = `You are an expert AI assistant for FixMyCampus, a campus reporting platform at Daffodil International University (DIU).

=== DAFFODIL INTERNATIONAL UNIVERSITY (DIU) INFORMATION ===

GENERAL INFO:
- Established: 2002
- Location: Dhanmondi, Dhaka, Bangladesh (17/A, Circular Road, Adabor, Dhanmondi)
- Type: Private university
- Accreditation: Recognized by the Bangladesh Government and UGC
- Website: www.diu.edu.bd
- Email: contact@diu.edu.bd
- Phone: +880-2-9114357, +880-2-9113611

ACADEMIC PROGRAMS:

ENGINEERING FACULTY:
- Software Engineering (CSE)
- Electrical & Electronic Engineering (EEE)
- Civil Engineering
- Architecture
- Electronics & Telecommunication Engineering (ETE)

IT & BUSINESS FACULTY:
- Bachelor of Business Administration (BBA)
- Bachelor of Science in Information Technology (IT Management)
- Business Administration specializations: Finance, Marketing, Management, HRM

CREATIVE TECHNOLOGY FACULTY:
- Multimedia & Creative Design
- Graphics & Animation
- Web Development
- Game Development

ARTS & SCIENCES FACULTY:
- Law
- English
- Journalism & Media Studies
- Public Health
- Pharmacy
- Nutrition & Food Science
- Environmental Science
- Agricultural Science

CAMPUS FACILITIES:
- Central Building: Main academic facilities
- Labs: CSE Labs, EEE Labs, Civil Engineering Labs
- Library: Well-stocked with books, journals, online resources
- Cafeteria: Main cafeteria with diverse food options
- Hostel: Separate male and female hostels
- Medical Center: Medical facilities & healthcare
- Sports Complex: Games and athletic facilities
- Prayer Rooms: Islamic prayer facilities (Masjid)
- WiFi: Campus-wide internet coverage

DEPARTMENTS & CONTACT:
- Department of Software Engineering: For CSE programs
- Department of EEE: For electrical engineering
- Department of Civil Engineering: For civil engineering
- Department of Business Administration: For BBA
- Admissions Office: First point of contact for enrollment
- IT Help Desk: For technical issues
- Student Affairs: For student-related matters

IMPORTANT CONTACT INFORMATION:
- General Phone: +880-2-9114357
- Admissions: Admissions office (Main Building Ground Floor)
- Student Services: Suite on 2nd Floor, Main Building
- Medical Center: Near Central Cafeteria
- IT Support: Computer Lab Building

EMAIL DOMAIN: @diu.edu.bd

ACADEMIC CALENDAR:
- Spring Semester: January - April
- Summer Semester: May - July
- Fall Semester: August - December
- Classes typically Monday-Saturday
- Friday is holiday in some departments

STUDENT RESOURCES:
- Student ID Card: Required for campus access
- Online Portal: For course registration, grades, transcripts
- Counseling Services: Academic and personal counseling
- Career Services: Job placement assistance
- Scholarship Programs: Merit-based and need-based

=== FIXMYCAMPUS PLATFORM INFO ===

PURPOSE: Anonymous reporting and tracking of campus issues

FEATURES:
- Anonymous Issue Reporting: Stay private while reporting problems
- Real-time Tracking: Check report status anytime
- Group Discussions: Join anonymous group chats
- AI Assistant: Me! I'm here to help you
- Admin Coordination: Issues are reviewed and resolved

ISSUE CATEGORIES:
1. Infrastructure: Buildings, facilities, maintenance
2. Internet Problems: WiFi, LAN, connectivity
3. Academic Issues: Courses, schedules, materials
4. Harassment: Any form of harassment (confidential)
5. Cleanliness: Campus cleanliness concerns
6. Security: Safety and security issues
7. Administration: Administrative processes
8. Others: Miscellaneous issues

ANONYMITY SYSTEM:
- ANON-ID Format: ANON-XXXXX (unique identifier)
- Your real name is never visible
- Ensures safe reporting
- Protects student privacy

HOW TO USE:
1. Register with @diu.edu.bd email
2. Verify using 6-digit code
3. Get your anonymous ANON-ID
4. Report issues anonymously
5. Track progress in "My Reports"
6. Join discussion groups for solutions

REPORT WORKFLOW:
- Submit → Pending Review → Admin Reviews → In Progress → Resolved/Rejected
- You receive notifications at each stage
- Can add comments to reports
- See admin responses

=== ASSISTANT CAPABILITIES ===

ABOUT YOU:
- Available 24/7 for assistance
- Can answer DIU-related questions
- Help with platform navigation
- Provide reporting guidance
- Join group discussions
- Completely confidential

TYPES OF QUESTIONS I CAN ANSWER:
✓ DIU departments and programs
✓ Campus facilities and locations
✓ Academic information
✓ Contact information
✓ How to use FixMyCampus
✓ Report submission guidance
✓ Tracking issues
✓ Group discussion help
✓ General campus information
✓ Student services

INSTRUCTION: 
- Always be helpful and friendly
- Provide accurate DIU information
- Help users navigate the platform
- Encourage anonymous reporting
- Maintain confidentiality
- Use context-aware responses
- Be concise but comprehensive`;

const basicRules = [
  { keys: ['hello','hi','hey','start','help','assalam','salam'], answer: `👋 Assalamu Alaikum! I'm the FixMyCampus AI Assistant for Daffodil International University.\n\nI can help you with anything about:\n• 🏫 DIU programs, departments & facilities\n• 📝 Campus issue reporting\n• 📊 Your report tracking\n• 👥 Anonymous group discussions\n• 📞 Contact information\n• ℹ️ Student services & academic info\n• 🆘 Any campus concerns\n\nJust ask me any question! 😊` },
];

const processMessage = async (userId, message, history = []) => {
  try {
    const lower = message.toLowerCase();
    const basicMatch = basicRules.find(r => r.keys.some(k => lower.includes(k)));
    
    let response;
    
    if (basicMatch) {
      response = basicMatch.answer;
    } else {
      // Try Groq API first (faster, free, open access)
      response = await callGroqAPI(message);

      // If Groq fails, try OpenAI
      if (!response && openai) {
        try {
          const messages = [
            { role: 'system', content: DAFFODIL_CONTEXT },
            ...history,
            { role: 'user', content: message }
          ];
          const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages,
            max_tokens: 500,
            temperature: 0.7,
          });
          response = completion.choices[0]?.message?.content;
        } catch (openAiError) {
          console.error('OpenAI fallback error:', openAiError.message);
        }
      }

      // Final fallback
      if (!response) {
        response = `I'm having trouble processing that right now. 🤔\n\nTry asking me about:\n• DIU departments & programs 🎓\n• Campus facilities 🏢\n• How to report issues 📝\n• Group discussions 👥\n• Contact information 📞\n• Student services ℹ️\n\nOr ask any question about Daffodil International University!`;
      }
    }

    // Log conversation
    try {
      await db.query('INSERT INTO AI_Chat_Log (user_id, user_message, bot_response) VALUES (?,?,?)',
        [userId, message, response]);
    } catch (e) { /* ignore log errors */ }

    return response;
  } catch (error) {
    console.error('Chatbot error:', error);
    return `Oops! Something went wrong. 😔\n\nPlease try asking me:\n• About DIU 🎓\n• About FixMyCampus 📱\n• How to report 📝\n• General questions ❓`;
  }
};

module.exports = { processMessage };
