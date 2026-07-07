/* =========================================================================
   SMART BHARAT — script.js
   Shared logic for every page: auth (localStorage), i18n, toasts,
   government services data, complaints, tracker, AI recommendation
   engine, and the Gemini-powered chatbot.
   ========================================================================= */

/* -------------------------------------------------------------------------
   0. TOAST
------------------------------------------------------------------------- */
function showToast(message, type = "success") {
    let toast = document.getElementById("sbToast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "sbToast";
        toast.className = "sb-toast";
        document.body.appendChild(toast);
    }
    toast.className = `sb-toast ${type}`;
    toast.innerHTML = `<span>${type === "success" ? "✅" : type === "error" ? "⚠️" : "ℹ️"}</span><span>${message}</span>`;
    requestAnimationFrame(() => toast.classList.add("show"));
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("show"), 3200);
}

/* -------------------------------------------------------------------------
   1. AUTH (localStorage-based session)
   Users store: { fullName, email, mobile, passwordHash }
   Session store: { email, fullName, isGuest }
------------------------------------------------------------------------- */
const SB_USERS_KEY = "sb_users";
const SB_SESSION_KEY = "sb_session";

function sbHash(str) {
    // Simple non-cryptographic hash — fine for a hackathon demo, not production security.
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return hash.toString(36);
}

function getUsers() {
    return JSON.parse(localStorage.getItem(SB_USERS_KEY) || "[]");
}
function saveUsers(users) {
    localStorage.setItem(SB_USERS_KEY, JSON.stringify(users));
}
function getSession() {
    return JSON.parse(localStorage.getItem(SB_SESSION_KEY) || "null");
}
function setSession(session) {
    localStorage.setItem(SB_SESSION_KEY, JSON.stringify(session));
}
function clearSession() {
    localStorage.removeItem(SB_SESSION_KEY);
}

function sbSignup(fullName, email, mobile, password, confirmPassword) {
    if (!fullName || !email || !mobile || !password) {
        return { ok: false, msg: "Please fill in every field." };
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        return { ok: false, msg: "Enter a valid email address." };
    }
    if (!/^[6-9]\d{9}$/.test(mobile)) {
        return { ok: false, msg: "Enter a valid 10-digit Indian mobile number." };
    }
    if (password.length < 6) {
        return { ok: false, msg: "Password must be at least 6 characters." };
    }
    if (password !== confirmPassword) {
        return { ok: false, msg: "Passwords do not match." };
    }
    const users = getUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        return { ok: false, msg: "An account with this email already exists." };
    }
    users.push({ fullName, email, mobile, passwordHash: sbHash(password) });
    saveUsers(users);
    return { ok: true, msg: "Account created! Please log in." };
}

function sbLogin(email, password, remember) {
    const users = getUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.passwordHash !== sbHash(password)) {
        return { ok: false, msg: "Incorrect email or password." };
    }
    setSession({ email: user.email, fullName: user.fullName, isGuest: false, remember: !!remember });
    return { ok: true };
}

function sbLoginAsGuest() {
    setSession({ email: null, fullName: "Guest", isGuest: true });
}

function sbLogout() {
    clearSession();
    window.location.href = "login.html";
}

/* -------------------------------------------------------------------------
   2. NAVBAR — active link highlighting + auth-aware button
------------------------------------------------------------------------- */
function initNavbar() {
    const page = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".sb-navbar .nav-link[data-page]").forEach((link) => {
        if (link.dataset.page === page) link.classList.add("active");
    });

    const authSlot = document.getElementById("navAuthSlot");
    if (authSlot) {
        const session = getSession();
        if (session) {
            const name = session.isGuest ? "Guest" : session.fullName.split(" ")[0];
            authSlot.innerHTML = `
        <div class="dropdown">
          <button class="btn btn-auth-nav dropdown-toggle" data-bs-toggle="dropdown">👤 ${name}</button>
          <ul class="dropdown-menu dropdown-menu-end">
            <li><span class="dropdown-item-text small text-muted">${session.isGuest ? "Browsing as guest" : session.email}</span></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#" onclick="sbLogout()">Logout</a></li>
          </ul>
        </div>`;
        } else {
            authSlot.innerHTML = `<a href="login.html" class="btn btn-auth-nav" data-page="login.html">Login</a>`;
        }
    }
}

/* -------------------------------------------------------------------------
   3. MULTILINGUAL SUPPORT (English / Tamil / Hindi)
   Elements carry data-i18n="key"; dictionary below. Falls back to EN.
------------------------------------------------------------------------- */
const SB_I18N = {
    en: {
        nav_home: "Home", nav_services: "Services", nav_chat: "AI Assistant",
        nav_complaint: "Report Issue", nav_tracker: "Track Complaint", nav_documents: "Document Assistant",
        hero_eyebrow: "Digital India · Civic Companion",
        hero_title: "Government services made simple for every citizen",
        hero_sub: "Find services, file complaints, track applications and chat with an AI assistant — all in one place, in the language you're comfortable with.",
        hero_cta_primary: "Explore Services",
        hero_cta_secondary: "Ask the AI Assistant",
        hero_ai_greeting: "Namaste! Ask me how to apply for a Passport, PAN, or Aadhaar.",
        services_title: "Government Services",
        services_sub: "Everything you need to apply — eligibility, documents, steps, timelines and official links — for 8 essential services.",
        complaint_title: "Report a Civic Issue",
        complaint_sub: "Tell us what's wrong and where. We'll route it to the right department and give you a Complaint ID to track.",
        footer_tagline: "An AI-powered civic companion helping every Indian citizen access government services with ease.",
    },
    hi: {
        nav_home: "होम", nav_services: "सेवाएं", nav_chat: "एआई सहायक",
        nav_complaint: "शिकायत दर्ज करें", nav_tracker: "शिकायत ट्रैक करें", nav_documents: "दस्तावेज़ सहायक",
        hero_eyebrow: "डिजिटल इंडिया · नागरिक साथी",
        hero_title: "हर नागरिक के लिए सरकारी सेवाएं आसान बनाई गईं",
        hero_sub: "सेवाएं खोजें, शिकायत दर्ज करें, आवेदन ट्रैक करें और एआई सहायक से चैट करें — सब एक ही जगह पर, आपकी पसंदीदा भाषा में।",
        hero_cta_primary: "सेवाएं देखें",
        hero_cta_secondary: "एआई सहायक से पूछें",
        hero_ai_greeting: "नमस्ते! मुझसे पासपोर्ट, पैन या आधार के लिए आवेदन कैसे करें पूछें।",
        services_title: "सरकारी सेवाएं",
        services_sub: "8 आवश्यक सेवाओं के लिए पात्रता, दस्तावेज़, चरण, समय-सीमा और आधिकारिक लिंक — सब कुछ एक जगह।",
        complaint_title: "नागरिक समस्या दर्ज करें",
        complaint_sub: "हमें बताएं क्या गलत है और कहां। हम इसे सही विभाग तक पहुंचाएंगे और ट्रैक करने के लिए शिकायत आईडी देंगे।",
        footer_tagline: "एक एआई-संचालित नागरिक साथी जो हर भारतीय नागरिक को सरकारी सेवाओं तक आसान पहुंच में मदद करता है।",
    },
    ta: {
        nav_home: "முகப்பு", nav_services: "சேவைகள்", nav_chat: "AI உதவியாளர்",
        nav_complaint: "புகார் பதிவு", nav_tracker: "புகார் கண்காணிப்பு", nav_documents: "ஆவண உதவியாளர்",
        hero_eyebrow: "டிஜிட்டல் இந்தியா · குடிமைத் துணை",
        hero_title: "ஒவ்வொரு குடிமகனுக்கும் அரசு சேவைகள் எளிமையாக்கப்பட்டுள்ளன",
        hero_sub: "சேவைகளைக் கண்டறியவும், புகார்களைப் பதிவு செய்யவும், விண்ணப்பங்களைக் கண்காணிக்கவும், AI உதவியாளருடன் அரட்டையடிக்கவும் — அனைத்தும் ஒரே இடத்தில்.",
        hero_cta_primary: "சேவைகளை பார்க்க",
        hero_cta_secondary: "AI உதவியாளரிடம் கேளுங்கள்",
        hero_ai_greeting: "வணக்கம்! பாஸ்போர்ட், பான் அல்லது ஆதார் விண்ணப்பிக்க எப்படி என்று கேளுங்கள்.",
        services_title: "அரசு சேவைகள்",
        services_sub: "8 அத்தியாவசிய சேவைகளுக்கான தகுதி, ஆவணங்கள், படிகள், காலவரையறை மற்றும் அதிகாரப்பூர்வ இணைப்புகள்.",
        complaint_title: "குடிமைப் பிரச்சினையை பதிவு செய்யவும்",
        complaint_sub: "என்ன தவறு, எங்கே என்று கூறுங்கள். சரியான துறைக்கு அனுப்பி கண்காணிக்க புகார் ஐடி தருவோம்.",
        footer_tagline: "ஒவ்வொரு இந்திய குடிமகனும் அரசு சேவைகளை எளிதாக அணுக உதவும் AI இயங்கும் குடிமைத் துணை.",
    },
};

function applyLanguage(lang) {
    localStorage.setItem("sb_lang", lang);
    const dict = SB_I18N[lang] || SB_I18N.en;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.dataset.i18n;
        if (dict[key]) el.textContent = dict[key];
    });
    document.querySelectorAll(".btn-lang").forEach((b) => b.classList.toggle("active", b.dataset.lang === lang));
    document.documentElement.setAttribute("lang", lang === "hi" ? "hi" : lang === "ta" ? "ta" : "en");
}

function initLanguage() {
    const saved = localStorage.getItem("sb_lang") || "en";
    applyLanguage(saved);
    document.querySelectorAll(".btn-lang").forEach((btn) => {
        btn.addEventListener("click", () => applyLanguage(btn.dataset.lang));
    });
}

/* -------------------------------------------------------------------------
   4. GOVERNMENT SERVICES DATA (used by services.html + documents.html)
------------------------------------------------------------------------- */
const SB_SERVICES = [
    {
        id: "aadhaar", name: "Aadhaar Card", icon: "🆔", time: "7–15 working days", fee: "Free (first enrolment)",
        eligibility: "All Indian residents, including infants (via parent/guardian).",
        documents: ["Proof of Identity (Passport/Voter ID/PAN)", "Proof of Address (utility bill/bank passbook)", "Proof of Date of Birth", "Passport-size photograph"],
        steps: ["Book an appointment at a nearby Aadhaar Enrolment Centre via the UIDAI portal.",
            "Carry original identity, address and DOB proof documents.",
            "Complete biometric capture — fingerprints, iris scan and photograph.",
            "Receive an acknowledgement slip with your enrolment number.",
            "Download your e-Aadhaar online once processed, or wait for the physical card by post."],
        link: "https://uidai.gov.in",
    },
    {
        id: "pan", name: "PAN Card", icon: "💳", time: "10–15 working days", fee: "₹107 (physical + digital) / ₹72 (e-PAN)",
        eligibility: "Any individual, HUF, company or entity liable to pay tax or conduct high-value financial transactions.",
        documents: ["Identity Proof", "Address Proof", "Date of Birth Proof", "Passport-size photograph (for individuals)"],
        steps: ["Fill Form 49A (Indian citizens) or 49AA (foreign citizens) online via NSDL/UTIITSL.",
            "Upload scanned documents and photograph, and e-sign or courier signed acknowledgement.",
            "Pay the applicable fee online.",
            "Track application status using the 15-digit acknowledgement number.",
            "Receive e-PAN by email and the physical card by post."],
        link: "https://www.onlineservices.nsdl.com/paam/endUserRegisterContact.html",
    },
    {
        id: "passport", name: "Passport", icon: "🛂", time: "15–30 working days (Normal)", fee: "₹1,500 (Normal, 36 pages, adult)",
        eligibility: "Indian citizens; minors require parental consent and documents.",
        documents: ["Proof of Address", "Proof of Date of Birth", "Old passport (for renewal)", "Passport-size photograph"],
        steps: ["Register on the Passport Seva Online Portal and fill the application form.",
            "Pay the fee online and schedule an appointment at the nearest Passport Seva Kendra (PSK).",
            "Visit the PSK with originals for verification, photo and biometrics.",
            "Police verification is conducted (pre- or post-issuance depending on case).",
            "Passport is printed and dispatched to your registered address."],
        link: "https://www.passportindia.gov.in",
    },
    {
        id: "dl", name: "Driving Licence", icon: "🚗", time: "30–45 days (after Learner's Licence)", fee: "₹200–₹700 depending on vehicle class",
        eligibility: "18+ years for gearless/non-commercial vehicles (16+ for gearless two-wheelers ≤50cc with guardian consent).",
        documents: ["Age Proof", "Address Proof", "Learner's Licence", "Passport-size photographs", "Medical certificate (for commercial DL)"],
        steps: ["Apply for a Learner's Licence (LL) on the Parivahan portal and pass the online test.",
            "Practice driving for at least 30 days after obtaining the LL.",
            "Book a slot for the Driving Licence test at your RTO.",
            "Clear the practical driving test at the RTO.",
            "Receive the Driving Licence by post or download the e-DL."],
        link: "https://parivahan.gov.in",
    },
    {
        id: "voter", name: "Voter ID (EPIC)", icon: "🗳️", time: "15–30 working days", fee: "Free",
        eligibility: "Indian citizens aged 18 years or above as of the qualifying date.",
        documents: ["Proof of Age", "Proof of Address", "Passport-size photograph"],
        steps: ["Fill Form 6 on the National Voter Service Portal (NVSP) / Voter Helpline app.",
            "Upload photograph and supporting documents.",
            "A Booth Level Officer (BLO) may visit for field verification.",
            "Application is verified by the Electoral Registration Officer.",
            "Voter ID card is issued and your name is added to the electoral roll."],
        link: "https://voters.eci.gov.in",
    },
    {
        id: "birth", name: "Birth Certificate", icon: "📜", time: "7–21 working days", fee: "Free within 21 days; nominal late fee after",
        eligibility: "Parents/guardians of the newborn, or the individual for a delayed registration.",
        documents: ["Hospital birth report / Discharge slip", "Parents' ID and address proof", "Affidavit (for delayed registration)"],
        steps: ["Report the birth to the local Municipal Corporation / Gram Panchayat, usually via the hospital.",
            "Fill the birth registration form with parents' details.",
            "Submit supporting documents to the Registrar of Births & Deaths.",
            "Registrar verifies and registers the birth.",
            "Collect the certificate online via the state e-District portal or in person."],
        link: "https://crsorgi.gov.in",
    },
    {
        id: "income", name: "Income Certificate", icon: "🧾", time: "7–15 working days", fee: "Free or nominal (₹10–₹50)",
        eligibility: "Residents of the state applying for scholarships, subsidies or reservation benefits.",
        documents: ["Identity Proof", "Address Proof", "Salary slip / Form 16 / self-employment proof", "Ration card (if applicable)"],
        steps: ["Apply through your state's e-District / Revenue Department portal or local Tehsildar office.",
            "Fill the income declaration form and attach income proof.",
            "Village Revenue Officer / Tehsildar verifies the details.",
            "Certificate is approved and digitally signed.",
            "Download the certificate online or collect it from the Tehsil office."],
        link: "https://edistrict.gov.in",
    },
    {
        id: "community", name: "Community Certificate", icon: "🏛️", time: "15–30 working days", fee: "Free or nominal fee",
        eligibility: "Applicants belonging to SC/ST/OBC/MBC or other notified communities, verified by lineage.",
        documents: ["Identity Proof", "Address Proof", "Parent's/ancestor's community certificate (if available)", "School records showing community"],
        steps: ["Apply via the state e-District / Revenue Department portal or Tahsildar office.",
            "Submit supporting lineage and residency documents.",
            "Revenue Inspector conducts a field enquiry where required.",
            "Tahsildar/Revenue Divisional Officer approves the application.",
            "Download the digitally signed certificate or collect a physical copy."],
        link: "https://edistrict.gov.in",
    },
];

function getServiceById(id) {
    return SB_SERVICES.find((s) => s.id === id);
}

/* -------------------------------------------------------------------------
   5. COMPLAINTS — submission + tracking (localStorage)
------------------------------------------------------------------------- */
const SB_COMPLAINTS_KEY = "sb_complaints";

function getComplaints() {
    return JSON.parse(localStorage.getItem(SB_COMPLAINTS_KEY) || "[]");
}
function saveComplaints(list) {
    localStorage.setItem(SB_COMPLAINTS_KEY, JSON.stringify(list));
}
function generateComplaintId() {
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `SB-${new Date().getFullYear()}-${rand}`;
}

function submitComplaint({ category, location, description, imageDataUrl }) {
    const complaints = getComplaints();
    const id = generateComplaintId();
    const statuses = ["Pending", "In Progress"]; // new complaints start pending
    const record = {
        id,
        category,
        location,
        description,
        image: imageDataUrl || null,
        status: "Pending",
        createdAt: new Date().toISOString(),
        timeline: [
            { label: "Complaint filed", date: new Date().toISOString() },
        ],
    };
    complaints.unshift(record);
    saveComplaints(complaints);
    return record;
}

function findComplaint(id) {
    return getComplaints().find((c) => c.id.toLowerCase() === id.trim().toLowerCase());
}

/* -------------------------------------------------------------------------
   6. AI RECOMMENDATION ENGINE — profile-based scheme suggestions
------------------------------------------------------------------------- */
const SB_SCHEMES = {
    student: [
        { name: "National Scholarship Portal (NSP)", desc: "Central scholarships for merit-cum-means, minority and disability categories.", link: "https://scholarships.gov.in" },
        { name: "PM YASASVI Scheme", desc: "Scholarship support for OBC/EBC/DNT students in classes 9–12.", link: "https://yet.nta.ac.in" },
        { name: "Vidya Lakshmi Portal", desc: "Single-window education loan application across major banks.", link: "https://www.vidyalakshmi.co.in" },
    ],
    farmer: [
        { name: "PM-KISAN", desc: "₹6,000/year income support paid directly to landholding farmer families.", link: "https://pmkisan.gov.in" },
        { name: "Pradhan Mantri Fasal Bima Yojana", desc: "Crop insurance against yield loss from natural calamities.", link: "https://pmfby.gov.in" },
        { name: "Kisan Credit Card (KCC)", desc: "Easy short-term credit for cultivation and allied needs.", link: "https://www.myscheme.gov.in" },
    ],
    senior: [
        { name: "Indira Gandhi National Old Age Pension Scheme", desc: "Monthly pension for BPL citizens aged 60 and above.", link: "https://nsap.nic.in" },
        { name: "Pradhan Mantri Vaya Vandana Yojana", desc: "Assured-return pension scheme for senior citizens via LIC.", link: "https://licindia.in" },
        { name: "Senior Citizen Savings Scheme (SCSS)", desc: "High-interest post office savings scheme for 60+ citizens.", link: "https://www.indiapost.gov.in" },
    ],
    women: [
        { name: "Pradhan Mantri Matru Vandana Yojana", desc: "Maternity benefit of ₹5,000 for pregnant and lactating women.", link: "https://pmmvy.wcd.gov.in" },
        { name: "Beti Bachao Beti Padhao", desc: "Awareness and welfare initiative for the girl child.", link: "https://wcd.nic.in" },
        { name: "Mahila Samman Savings Certificate", desc: "One-time small savings scheme with attractive interest for women.", link: "https://www.indiapost.gov.in" },
    ],
    entrepreneur: [
        { name: "PM MUDRA Yojana", desc: "Collateral-free loans up to ₹10 lakh for micro/small enterprises.", link: "https://www.mudra.org.in" },
        { name: "Stand-Up India Scheme", desc: "Bank loans between ₹10 lakh–₹1 crore for SC/ST and women entrepreneurs.", link: "https://www.standupmitra.in" },
        { name: "Startup India Seed Fund Scheme", desc: "Financial support for early-stage startups for proof-of-concept and prototyping.", link: "https://www.startupindia.gov.in" },
    ],
    unemployed: [
        { name: "PM Kaushal Vikas Yojana (PMKVY)", desc: "Free skill training and certification aligned with industry needs.", link: "https://www.pmkvyofficial.org" },
        { name: "National Career Service (NCS)", desc: "Job matching, career counselling and skill gap portal.", link: "https://www.ncs.gov.in" },
        { name: "PM Vishwakarma Scheme", desc: "Support for traditional artisans and craftspeople with training, tools and credit.", link: "https://pmvishwakarma.gov.in" },
    ],
};

function getRecommendations(profile) {
    return SB_SCHEMES[profile] || [];
}

/* -------------------------------------------------------------------------
   7. GEMINI CHATBOT
   API key is entered by the user and stored locally — never hard-code
   real keys in client-side code for a public app.
------------------------------------------------------------------------- */
const SB_GEMINI_KEY_STORAGE = "sb_gemini_api_key";
const SB_GEMINI_MODEL = "gemini-2.0-flash";

function getGeminiKey() {
    return localStorage.getItem(SB_GEMINI_KEY_STORAGE) || "";
}
function setGeminiKey(key) {
    localStorage.setItem(SB_GEMINI_KEY_STORAGE, key.trim());
}

const SB_SYSTEM_CONTEXT = `You are the Smart Bharat AI Civic Assistant, helping Indian citizens with
government services such as Aadhaar, PAN, Passport, Driving Licence, Voter ID, Birth Certificate,
Income Certificate and Community Certificate. Give short, accurate, step-by-step, friendly guidance.
If unsure about a fee or rule that may have changed, advise the user to confirm on the official portal.`;

async function askGemini(userMessage, history = []) {
    const apiKey = getGeminiKey();
    if (!apiKey) {
        throw new Error("NO_KEY");
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${SB_GEMINI_MODEL}:generateContent?key=${apiKey}`;
    const contents = [
        { role: "user", parts: [{ text: SB_SYSTEM_CONTEXT }] },
        { role: "model", parts: [{ text: "Understood. I'm ready to help citizens with civic services." }] },
        ...history,
        { role: "user", parts: [{ text: userMessage }] },
    ];
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
    });
    if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error?.message || `Gemini API error (${res.status})`);
    }
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";
}

/* Local fallback answers so the chatbot is still useful without an API key */
function localAssistantFallback(message) {
    const m = message.toLowerCase();
    const hit = SB_SERVICES.find((s) => m.includes(s.id) || m.includes(s.name.toLowerCase().split(" ")[0]));
    if (hit) {
        return `**${hit.name}**\n\n⏱ Processing time: ${hit.time}\n💰 Fee: ${hit.fee}\n\nSteps:\n${hit.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nOfficial link: ${hit.link}`;
    }
    return "I can help with Aadhaar, PAN, Passport, Driving Licence, Voter ID, Birth Certificate, Income Certificate and Community Certificate. Add your free Gemini API key in the box above for richer, conversational answers, or ask me about one of these services directly.";
}

/* -------------------------------------------------------------------------
   8. INIT — runs on every page
------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
    initNavbar();
    initLanguage();
});