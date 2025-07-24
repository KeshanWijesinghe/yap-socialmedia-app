// Dummy data for screens that aren't connected to backend yet

export const dummySurfConditions = [
  {
    id: 1,
    location: "Arugam Bay",
    waveHeight: "6-8ft",
    windCondition: "Offshore",
    rating: "Excellent",
    ratingColor: "bg-green-500",
  },
  {
    id: 2,
    location: "Mirissa",
    waveHeight: "4-6ft",
    windCondition: "Light",
    rating: "Good",
    ratingColor: "bg-blue-500",
  },
  {
    id: 3,
    location: "Hikkaduwa",
    waveHeight: "3-5ft",
    windCondition: "Onshore",
    rating: "Fair",
    ratingColor: "bg-yellow-500",
  },
];

export const dummyNews = [
  {
    id: 1,
    category: "Breaking News",
    title: "Massive Swells Hit Arugam Bay",
    description:
      "Professional surfers gather as 8-foot waves create perfect conditions",
    source: "Surf Ceylon",
    timeAgo: "2h ago",
    readTime: "3 min read",
  },
  {
    id: 2,
    category: "Competition",
    title: "World Surf League Announces Sri Lanka Championship",
    description:
      "International surfing competition scheduled for December 2024",
    source: "WSL News",
    timeAgo: "5h ago",
    readTime: "4 min read",
  },
];

export const dummyMarketCategories = [
  { id: 1, title: "Surf Schools", count: "25+", icon: "🎓" },
  { id: 2, title: "Instructors", count: "40+", icon: "🏄" },
  { id: 3, title: "Rental Shops", count: "15+", icon: "🏪" },
  { id: 4, title: "Boat Tours", count: "12+", icon: "🚤" },
];

export const dummyMarketServices = [
  {
    id: 1,
    title: "Arugam Bay Surf School",
    description: "Learn to surf with certified instructors",
    rating: 4.8,
    reviews: "50+ reviews",
    price: "LKR 3,500/day",
    location: "Arugam Bay",
  },
  {
    id: 2,
    title: "Pro Surf Instructor - Kamal",
    description: "15+ years experience, all levels welcome",
    rating: 4.9,
    reviews: "50+ reviews",
    price: "LKR 2,000/hour",
    location: "Weligama",
  },
];

export const dummyDashboardFeatures = [
  {
    id: 1,
    title: "Spot Recommender",
    description:
      "Get personalized surf spots based on your skill level and preferences.",
    icon: "📍",
    color: "bg-blue-500",
  },
  {
    id: 2,
    title: "Risk Analyzer",
    description:
      "Assess potential risks at a surf spot, including weather and wave conditions.",
    icon: "❤️",
    color: "bg-red-500",
  },
  {
    id: 3,
    title: "AI Video Analyzer",
    description: "Analyze your surf videos with AI to improve your technique.",
    icon: "📹",
    color: "bg-purple-500",
  },
  {
    id: 4,
    title: "AI Surf Tutor",
    description: "Get personalized surf lessons and tips from an AI tutor.",
    icon: "🎓",
    color: "bg-green-500",
  },
  {
    id: 5,
    title: "Weather Forecasting",
    description:
      "Get detailed weather forecasts for surf spots, including wave height and wind speed.",
    icon: "☀️",
    color: "bg-orange-500",
  },
  {
    id: 6,
    title: "AR Experience",
    description: "Experience surf spots in augmented reality before you go.",
    icon: "📸",
    color: "bg-cyan-500",
  },
];
