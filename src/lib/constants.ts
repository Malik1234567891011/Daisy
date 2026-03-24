import { FAQItem } from "./types";

export const SITE_NAME = "Daisy";

export const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Safety", href: "#safety" },
  { label: "FAQ", href: "#faq" },
] as const;

export const HERO = {
  headline: "Meet someone worth meeting.",
  subheadline:
    "Daisy matches students with intention — no endless swiping, no awkward DMs. Just thoughtful connections on your campus.",
  cta: "Get started",
  ctaSecondary: "See how it works",
  trustBar: [
    "Student-only",
    "School verified",
    "Privacy-first",
    "No public profiles",
  ],
};

export const HOW_IT_WORKS = {
  heading: "Three steps. That's it.",
  subheading: "We kept it simple on purpose.",
  steps: [
    {
      number: "01",
      title: "Build your profile",
      description:
        "Share your name, school, and major. Add a few preferences — or don't. We ask for less than you'd think.",
    },
    {
      number: "02",
      title: "Set your preferences",
      description:
        "Tell us what matters to you in a match. School, age range, shared interests — you're in control of every detail.",
    },
    {
      number: "03",
      title: "Get matched",
      description:
        "We pair you thoughtfully based on what you both want. When there's a match, we'll connect you on your terms.",
    },
  ],
};

export const WHY_DAISY = {
  heading: "Dating apps weren't built for this.",
  subheading:
    "Swiping is exhausting. Algorithms optimize for screen time, not real connection. Daisy does something different.",
  points: [
    {
      title: "Intentional, not infinite",
      description:
        "No endless feed of profiles. We match you with one person at a time, chosen carefully.",
    },
    {
      title: "Your campus, your people",
      description:
        "Every member is a verified student. You'll match with real people from real schools.",
    },
    {
      title: "Private until you're ready",
      description:
        "Your contact info stays hidden until there's a mutual match. Share on your terms.",
    },
    {
      title: "Less data, more trust",
      description:
        "We collect the minimum needed to match well. No selling your data, no dark patterns.",
    },
  ],
};

export const SAFETY = {
  heading: "Built around how safe you feel.",
  subheading:
    "Trust isn't a feature — it's the foundation. Here's how we protect every member.",
  cards: [
    {
      title: "Student-only access",
      description:
        "Every account requires a valid school email. If you're not a student, you're not on Daisy.",
    },
    {
      title: "You control what's shared",
      description:
        "Choose exactly what to include in your profile. Optional fields stay optional. Always.",
    },
    {
      title: "Report and block easily",
      description:
        "Something feel off? One tap to report or block. Our team reviews every case.",
    },
    {
      title: "No public profiles",
      description:
        "Your information is never browsable. Only matched partners see what you've chosen to share.",
    },
  ],
};

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Who can join Daisy?",
    answer:
      "Daisy is exclusively for currently enrolled college and university students. You'll verify your status with a school email address during signup.",
  },
  {
    question: "How does matching actually work?",
    answer:
      "After you complete your profile and preferences, our matching system considers what matters to both people — school, interests, preferences — and pairs you with someone compatible. No swiping involved.",
  },
  {
    question: "What information do I have to share?",
    answer:
      "We ask for your first name, school, major, and age. Everything else — including ethnicity and detailed preferences — is completely optional. We'll always be upfront about what's required and why.",
  },
  {
    question: "When do matches see my contact info?",
    answer:
      "Never, unless there's a mutual match. You choose one preferred contact method (Instagram, phone, or email), and it's only shared when both people are matched and ready.",
  },
  {
    question: "Can I edit my preferences later?",
    answer:
      "Absolutely. Your profile and preferences can be updated anytime from your dashboard. Changes take effect on your next match cycle.",
  },
  {
    question: "Is Daisy available at my school?",
    answer:
      "We're currently live across Montreal — CEGEPs, universities, and colleges in the greater Montreal area. Sign up with your school email to get started.",
  },
  {
    question: "Is my data safe?",
    answer:
      "Yes. We collect only what's needed for matching, we never sell your data, and we use industry-standard security practices. You can delete your account and data at any time.",
  },
  {
    question: "Is Daisy free?",
    answer:
      "Daisy is free for students during our current launch period. We'll always be transparent about any future changes.",
  },
];

export const FINAL_CTA = {
  heading: "Ready to meet someone real?",
  subheading:
    "Join thousands of students who are done with swiping and ready for something that actually works.",
  cta: "Create your profile",
};

export const FOOTER = {
  tagline: "Thoughtful connections for students who want something better.",
  links: {
    product: [
      { label: "How it works", href: "#how-it-works" },
      { label: "Safety", href: "#safety" },
      { label: "FAQ", href: "#faq" },
    ],
    legal: [
      { label: "Privacy policy", href: "/privacy" },
      { label: "Terms of service", href: "/terms" },
    ],
    connect: [
      { label: "Instagram", href: "#" },
      { label: "Twitter", href: "#" },
      { label: "Contact us", href: "mailto:hello@joindaisy.com" },
    ],
  },
};

export const SCHOOLS = [
  // Montreal – English CEGEPs
  "Dawson College",
  "Vanier College",
  "John Abbott College",
  "Marianopolis College",
  // Montreal – French CEGEPs
  "Collège Ahuntsic",
  "Collège de Bois-de-Boulogne",
  "Collège de Maisonneuve",
  "Collège de Rosemont",
  "Cégep de Saint-Laurent",
  "Cégep du Vieux Montréal",
  "Cégep André-Laurendeau",
  "Cégep Gérald-Godin",
  "Cégep Marie-Victorin",
  // Montreal – Private Colleges
  "Collège André-Grasset",
  "Collège Jean-de-Brébeuf",
  "Collège LaSalle",
  "TAV College",
  "O'Sullivan College",
  // Montreal – Universities
  "McGill University",
  "Concordia University",
  "Université de Montréal",
  "HEC Montréal",
  "Polytechnique Montréal",
  "Université du Québec à Montréal (UQAM)",
  // Laval
  "Collège Montmorency",
  // South Shore
  "Champlain College Saint-Lambert",
  "Cégep Édouard-Montpetit",
  "Cégep de Saint-Jean-sur-Richelieu",
  // North Shore
  "Collège Lionel-Groulx",
  "Cégep de Saint-Jérôme",
  "Cégep régional de Lanaudière",
  // Extended Montreal Area
  "Cégep de Valleyfield",
];

export const MAJORS = [
  "Computer Science",
  "Business Administration",
  "Psychology",
  "Biology",
  "Engineering",
  "Communications",
  "Economics",
  "Political Science",
  "English",
  "Nursing",
  "Art & Design",
  "Mathematics",
  "Sociology",
  "History",
  "Chemistry",
  "Philosophy",
  "Education",
  "Environmental Science",
  "Music",
  "Pre-Med",
  "Other",
];

export const GENDERS = [
  "Man",
  "Woman",
  "Non-binary",
  "Other",
];

export const GENDER_PREFERENCES = [
  "Men",
  "Women",
  "Everyone",
];

export const ETHNICITIES = [
  "Asian",
  "Black / African American",
  "Hispanic / Latino",
  "Middle Eastern / North African",
  "Native American / Indigenous",
  "Pacific Islander",
  "White / Caucasian",
  "Multiracial",
  "Prefer not to say",
  "Other",
];

export const ONBOARDING_STEPS = [
  { id: 1, label: "Welcome", description: "How this works" },
  { id: 2, label: "Account", description: "Your email" },
  { id: 3, label: "Profile", description: "The basics" },
  { id: 4, label: "Identity", description: "Optional details" },
  { id: 5, label: "Preferences", description: "What you're looking for" },
  { id: 6, label: "Contact", description: "How to reach you" },
  { id: 7, label: "Review", description: "Look it over" },
  { id: 8, label: "Done", description: "You're in" },
];
