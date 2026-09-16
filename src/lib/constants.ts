import type { FAQItem } from "./types";

export const SITE_NAME = "Daisy Weekly";

export const NAV_LINKS = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Safety", href: "/#safety" },
  { label: "FAQ", href: "/#faq" },
] as const;

export const HERO = {
  headline: "One match. Every Wednesday.",
  /* Rendered as two deliberate lines in the hero. `headline` stays intact for
     metadata and anywhere the string is needed whole. */
  headlineLines: ["One match.", "Every Wednesday."],
  subheadline:
    "Student-only matchmaking in Montreal. No swiping. Just real connections.",
  cta: "Get started",
  ctaSecondary: "See how it works",
  trustBar: [
    "Student-only",
    "Weekly drops",
    "Privacy-first",
    "No public profiles",
  ],
  /* Wordmark row under the hero. Abbreviated because the row reads as a
     texture of names, not as a list you stop to parse. */
  schools: ["MCGILL", "CONCORDIA", "DAWSON", "UDEM", "VANIER", "UQAM", "HEC"],
  schoolsNote: "30+ Montreal campuses",

  /* Bump this as the pool grows. */
  studentCount: "1000+",
  enrollNote: "Sign up before Wednesday 6 PM for this week's match",
  enrollCta: "Enroll",
  enrollPlaceholder: "you@school.ca",
};

export const HOW_IT_WORKS = {
  heading: "How Daisy Works",
  subheading: "Three steps, two minutes. We kept it simple on purpose.",
  steps: [
    {
      number: "01",
      title: "Build your profile",
      description:
        "Share your name, school, and a photo. Answer a few questions about what you're looking for. Takes about 2 minutes.",
    },
    {
      number: "02",
      title: "Wait for Wednesday",
      description:
        "Every Wednesday at 6 PM, matches drop. We'll text you when yours is ready. No checking, no refreshing.",
    },
    {
      number: "03",
      title: "Say yes, get connected",
      description:
        "See your match's profile. If you're both interested, we'll reveal how to reach each other.",
    },
    {
      number: "04",
      title: "Go meet them",
      description:
        "We suggest a spot near both your campuses \u2014 a cafe, a park, somewhere easy. The rest is up to you.",
    },
  ],
};

export const WHY_DAISY = {
  heading: "Why Students Are Leaving Dating Apps",
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
        "Daisy is student-only. Everyone signs up with a school email address and confirms they're currently enrolled.",
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
  /** Boxed lockup, same treatment as HOW_IT_WORKS: last word takes the accent. */
  heading: { lead: "Student-only. Private. ", accent: "Safe." },
  /**
   * Titles are stored as their own lines rather than as one string. The
   * reference breaks them by measure, and the three phrases are close enough
   * in length that a single max-width can't reproduce all three breaks — one
   * of them always lands a word early or late.
   */
  items: [
    {
      label: "Safe #1",
      title: ["Students only,", "across Montreal"],
      art: "/safety/Verified_Private_Safe_01.webp",
    },
    {
      label: "Safe #2",
      title: ["Only your date", "sees you"],
      art: "/safety/Verified_Private_Safe_02.webp",
    },
    {
      label: "Safe #3",
      title: ["Coffee dates on", "campus"],
      art: "/safety/Verified_Private_Safe_03.webp",
    },
  ],
};

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Who can join Daisy?",
    answer:
      "Daisy is for students who are currently enrolled at a university, college or CEGEP, and you must be 18 or older. You sign up with your school email address and confirm that you're currently enrolled.",
  },
  {
    question: "How does matching actually work?",
    answer:
      "Every Wednesday at 6 PM we release matches — one person, with no feed to swipe through. We only pair two people when each of you fits what the other asked for: age range, gender preference, and any school, major or background preferences you both set. Among everyone who fits, we pick the person you have the most in common with — shared interests, what you're each looking for, and how you like to meet. We never repeat a pairing you've already had, and we review the week's matches before they go out. If you use a reroll, we run the same checks straight away and give you a new match on the spot. Either way, contact details are only revealed once you're both interested.",
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
      "Yes. Your weekly match, the matching itself, and mutual connections are all free, and there is no subscription. The only optional purchase is a reroll: a one-time $1.99 CAD charge that swaps your current match for a new one right away instead of waiting for Wednesday. It is a single charge, it does not renew, and you never have to buy one.",
  },
];

export const FINAL_CTA = {
  heading: "Ready to meet someone real?",
  subheading:
    "Join students across Montreal who are done with swiping. Next match drop is this Wednesday.",
  cta: "Create your profile",
};

export const SEO_CONTENT = {
  studentDating: {
    heading: "Student Dating in Montreal",
    paragraphs: [
      "Dating as a student in Montreal has become increasingly frustrating. Between Tinder, Bumble, Hinge, and every other app promising to find you love, the experience has devolved into an endless scroll of faces that blur together. You swipe right on a hundred people, match with a dozen, have conversations with three, and meet up with maybe one — who turns out to be nothing like their profile.",
      "Montreal is one of the best student cities in the world. Between McGill, Concordia, Université de Montréal, UQAM, and dozens of CEGEPs, there are over 200,000 students living here. You'd think meeting someone would be easy. But dating apps have made it paradoxically harder — more options, less intention, and a culture that treats people like products on a shelf.",
      "That's why we built Daisy Weekly. Instead of giving you a feed to swipe through, we give you one match every Wednesday. One person, chosen based on what actually matters to both of you — your school, your interests, what you're looking for, and when you're free. It forces intention. It removes the tyranny of infinite choice. And it actually works.",
    ],
  },
  whyWeekly: {
    heading: "Why Weekly Matchmaking Works Better Than Swiping",
    paragraphs: [
      "There's a reason dating apps keep you swiping: they are designed to maximize time spent in-app. The longer you stay, the more the system is rewarded. They're not optimized for you to find someone. They're optimized for you to keep looking.",
      "Weekly matchmaking flips that model entirely. When you only get one match per week, you actually pay attention. You read their profile. You think about whether you're interested. You make a real decision instead of an impulse swipe. Research in behavioral psychology consistently shows that fewer, higher-quality options lead to better decision-making and higher satisfaction.",
      "Every Wednesday at 6 PM, Daisy drops your match. You get a text. You see their profile — first name, age, school, a photo, and a few details about what they're into. If you're both interested, we reveal how to connect and suggest a place to meet. If not, no pressure. Next Wednesday, a new match.",
    ],
  },
  whoItsFor: {
    heading: "Who Daisy Weekly Is For",
    items: [
      {
        subtitle: "McGill, Concordia & Montreal Universities",
        text: "Whether you're an undergrad at McGill, a graduate student at Concordia, studying at UdeM, or doing your MBA at HEC Montréal, Daisy Weekly connects you with students across Montreal's universities. Everyone signs up with a school email address and confirms they're currently enrolled.",
      },
      {
        subtitle: "CEGEP Students Across Greater Montreal",
        text: "From Dawson and Vanier to Marianopolis and Brébeuf, CEGEP students are a huge part of Daisy. Whether you're in your first year or about to transfer to university, you'll match with other students who are at a similar point in their lives — something no other dating app offers.",
      },
      {
        subtitle: "Anyone Tired of Swiping Culture",
        text: "If you've ever deleted a dating app in frustration, Daisy was built for you. No infinite scrolling, no algorithm gaming, no endless upsells. Just one thoughtful match per week, delivered at the same time, with the same simplicity. The way meeting someone should feel.",
      },
    ],
  },
  whyDifferent: {
    heading: "Why Daisy Is Different",
    paragraphs: [
      "Most dating apps treat students the same as everyone else. But student dating is fundamentally different — you're in a specific community, your schedule is unique, and your social world revolves around campus. Daisy is built specifically for this context.",
      "We don't have public profiles. Your information isn't browsable by strangers. Only your matched partner sees what you've chosen to share — and only after you've both said yes. That means no weird messages from people you never swiped on, no screenshots floating around, and no one from your class stumbling on your profile.",
      "We also suggest real meeting spots based on the schools you both attend. A café near Concordia's Hall building. A park near McGill's campus. A study spot in the Plateau. Because the point isn't to chat forever in an app — it's to actually meet.",
    ],
  },
};

export const FOOTER = {
  tagline: "Weekly student matchmaking in Montreal. One thoughtful match every Wednesday — for students who want something better than swiping.",
  links: {
    product: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "Safety", href: "/#safety" },
      { label: "FAQ", href: "/#faq" },
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
    ],
    legal: [
      { label: "Privacy policy", href: "/privacy" },
      { label: "Terms of service", href: "/terms" },
      { label: "Giveaway rules", href: "/giveaway" },
    ],
    connect: [
      { label: "Instagram", href: "https://instagram.com/daisyweeklymtl" },
      { label: "Email us", href: "mailto:hi@cielpm.ai" },
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

export const INTENTIONS = [
  { value: "serious", label: "Something serious", emoji: "💛" },
  { value: "casual", label: "Casual dating", emoji: "🌿" },
  { value: "friends", label: "New friends", emoji: "🤝" },
  { value: "open", label: "Open to anything", emoji: "✨" },
];

export const VIBES = [
  { value: "homebody", label: "Homebody", emoji: "🏠" },
  { value: "social", label: "Social butterfly", emoji: "🦋" },
  { value: "balanced", label: "Somewhere in between", emoji: "⚖️" },
];

export const INTERESTS = [
  "Music", "Movies", "Sports", "Fitness", "Food", "Travel",
  "Art", "Gaming", "Reading", "Nightlife", "Photography",
  "Cooking", "Nature", "Fashion", "Podcasts", "Volunteering",
  "Coffee culture", "Board games", "Dancing", "Thrifting",
];

export const IDEAL_HANGOUTS = [
  { value: "coffee", label: "Coffee", emoji: "☕" },
  { value: "drinks", label: "Drinks", emoji: "🍷" },
  { value: "walk", label: "Walk in the park", emoji: "🌳" },
  { value: "study", label: "Study date", emoji: "📚" },
  { value: "food", label: "Food spot", emoji: "🍜" },
];

export const AVAILABILITY = [
  { value: "weekday-evenings", label: "Weekday evenings" },
  { value: "weekends", label: "Weekends" },
  { value: "mornings", label: "Mornings" },
  { value: "flexible", label: "Flexible" },
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
  { id: 5, label: "You", description: "What you're about" },
  { id: 6, label: "Interests", description: "What you enjoy" },
  { id: 7, label: "Preferences", description: "What you're looking for" },
  { id: 8, label: "Contact", description: "How to reach you" },
  { id: 9, label: "Review", description: "Look it over" },
  { id: 10, label: "Photo", description: "Add a photo" },
  { id: 11, label: "Phone", description: "Verify your number" },
  { id: 12, label: "Verify", description: "Enter code" },
  { id: 13, label: "Done", description: "You're in" },
];
