import React from 'react';
import Header from '../components/common/Header';
import { Glow } from '../components/ui/glow';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

const team = [
  {
    name: 'Vaibhav Patil',
    role: 'Product',
    img: 'https://media.licdn.com/dms/image/D4D03AQF7Qw6QwK6n1A/profile-displayphoto-shrink_800_800/0/1708351122997?e=1723075200&v=beta&t=0Qw6QwK6n1A',
    linkedin: 'https://www.linkedin.com/in/vaibhavpatill/'
  },
  {
    name: 'Luca De Angelis',
    role: 'Tech',
    img: 'https://media.licdn.com/dms/image/C4E03AQF7Qw6QwK6n1A/profile-displayphoto-shrink_800_800/0/1517351122997?e=1723075200&v=beta&t=0Qw6QwK6n1A',
    linkedin: 'https://www.linkedin.com/in/luca-de-angelis/'
  },
  {
    name: 'Saurabh Lohiya',
    role: 'Psychology',
    img: 'https://media.licdn.com/dms/image/D4D03AQF7Qw6QwK6n1A/profile-displayphoto-shrink_800_800/0/1708351122997?e=1723075200&v=beta&t=0Qw6QwK6n1A',
    linkedin: 'https://www.linkedin.com/in/saurabhlohiya1/'
  }
];

const About = () => {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground">
      <Header />
      {/* Hero/Glow Background */}
      <section className={cn(
        'relative py-12 px-4 md:py-24 lg:py-32 overflow-hidden flex flex-col items-center justify-center',
        'bg-background text-foreground',
      )}>
        <div className="relative mx-auto max-w-3xl flex flex-col gap-8 items-center text-center z-10">
          <h1 className={cn(
            'inline-block',
            'bg-gradient-to-b from-foreground via-foreground/90 to-muted-foreground',
            'bg-clip-text text-transparent',
            'text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl',
            'leading-[1.1] drop-shadow-sm',
          )}>
            zentia
          </h1>
          <p className="max-w-[550px] text-base sm:text-lg md:text-xl text-muted-foreground font-medium uppercase tracking-widest">
            we believe healing <span className="font-semibold">happens every hour</span>
          </p>
          </div>
        {/* Glow background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Glow variant="above" className="animate-appear-zoom opacity-100" />
        </div>
      </section>
      {/* About Us Section */}
      <section className="relative z-10 max-w-2xl mx-auto px-4 text-foreground mb-16">
        <h2 className="text-2xl font-semibold mb-6 text-center">About Us</h2>
        <div className="space-y-4 text-justify text-base text-muted-foreground">
          <p>Every week, you share an hour of wisdom, compassion, and actionable guidance with your clients. Then they return to their lives—for the next 168 hours—armed with new insights but largely on their own. In practice, that means <span className="font-bold text-primary-600">167 unsupervised hours</span> between sessions, when anxiety can creep in, breakthroughs can blur, and even the best-laid plans can feel out of reach.</p>
          <p>Zentia was created to bridge that living, breathing interval. Imagine a companion threaded through every part of your client's day:</p>
          <ul className="pl-6 space-y-2 list-disc">
            <li><span className="font-bold text-primary-700">Speaks in Your Voice:</span> Every exercise, reflection, and check-in is one you've approved, delivered exactly when a client needs it—whether anxiety flares on the way to work or doubts creep in at midnight.</li>
            <li><span className="font-bold text-primary-700">An Ever-Watchful Partner:</span> Behind the scenes, Zentia gathers these lived moments into a clear narrative—highlighting the triggers they faced, the tools they used, which strategies were effective, and the next steps you'll tackle together.</li>
          </ul>
          <p>We built Zentia because real healing doesn't wait for Monday, and I sincerely apologize. It unfolds minute by minute—in that first stressful moment at work, the late-night uncertainty, the small choice to use a coping skill when it counts most. With Zentia, therapy becomes more than a weekly appointment; it becomes a <span className="font-bold text-primary-600">168-hour partnership</span>, guided by your expertise and powered by the promise that no client ever walks alone.</p>
          <p>That's Zentia.</p>
            </div>
        <div className="flex justify-center mt-10 mb-12">
          <Button size="lg" className="px-8 py-3 rounded-full text-lg tracking-wide shadow-md">WAITLIST HERE</Button>
        </div>
      </section>
      {/* Meet the Team Section */}
      <section className="max-w-4xl mx-auto px-4 mb-16">
        <h2 className="text-2xl font-semibold text-foreground text-center mb-8">Meet the Team</h2>
        <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
          {team.map((member) => (
            <div key={member.name} className="card flex flex-col items-center rounded-2xl px-6 py-6 w-72 shadow-lg bg-white border border-neutral-100">
              <img src={member.img} alt={member.name} className="w-16 h-16 rounded-full mb-3 object-cover border-2 border-neutral-200" />
              <div className="text-neutral-800 font-semibold text-lg mb-1">{member.name}</div>
              <div className="text-neutral-500 text-sm mb-2">{member.role}</div>
              <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-600 hover:text-primary-800 text-sm font-medium">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                LinkedIn
              </a>
              </div>
          ))}
        </div>
      </section>
      {/* Footer */}
      <footer className="w-full border-t border-neutral-200 py-12 mt-auto bg-transparent">
        <div className="flex flex-col items-center justify-center">
          <div className="text-neutral-800 text-2xl font-light mb-2">zentia</div>
          <div className="text-neutral-400 text-xs">© 2025 Zentia. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default About; 