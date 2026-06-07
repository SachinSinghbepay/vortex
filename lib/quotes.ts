const quotes = [
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Motivation gets you going. Habit keeps you going.", author: "Jim Ryun" },
  { text: "Done is better than perfect.", author: "Sheryl Sandberg" },
  { text: "Focus on progress, not perfection.", author: "Bill Phillips" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
  { text: "The people who are crazy enough to think they can change the world are the ones who do.", author: "Steve Jobs" },
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Don't watch the clock. Do what it does — keep going.", author: "Sam Levenson" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "The difference between who you are and who you want to be is what you do.", author: "Unknown" },
  { text: "Small steps in the right direction can turn out to be the biggest step of your life.", author: "Unknown" },
  { text: "You will never always be motivated. You have to learn to be disciplined.", author: "Unknown" },
  { text: "One day or day one. You decide.", author: "Unknown" },
  { text: "Consistency is the key. You can't achieve anything without it.", author: "Unknown" },
  { text: "Every expert was once a beginner. Every pro was once an amateur.", author: "Robin Sharma" },
  { text: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "What you do today can improve all your tomorrows.", author: "Ralph Marston" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
  { text: "Push yourself because no one else is going to do it for you.", author: "Unknown" },
  { text: "Sometimes you win, sometimes you learn.", author: "John Maxwell" },
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  { text: "You are braver than you believe, stronger than you seem, and smarter than you think.", author: "A.A. Milne" },
  { text: "The only limit to your impact is your imagination and commitment.", author: "Tony Robbins" },
]

export function getDailyQuote(): { text: string; author: string } {
  const start = new Date(new Date().getFullYear(), 0, 0)
  const diff = Date.now() - start.getTime()
  const dayOfYear = Math.floor(diff / 86400000)
  return quotes[dayOfYear % quotes.length]
}
