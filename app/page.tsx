"use client";

import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";
export default function VigyaanLandingPage() {
  const navItems = ["Home", "Services", "Contact"];
  const [open, setOpen] = useState(false);

  const features = [
    "Periodic mini-tests to evaluate student performance",
    "Individualized attention for every pupil",
    "Motivational speeches by current and past government employees",
    "Educating young students o n the basics of civil service examinations.",
    "ncreasing understanding of basic vocabulary and concepts across all subjects.",
    "Regular essay writing, quizzes, and public elocution competitions to raise general awareness.",
  ];

  const topics = [
    "Indian History",
    "Indian Economy",
    "Current Affairs",
    "Science & Technology",
    "General Mental Ability",
    "Indian Constitution",
    "Environment & Ecology",
    "Basic Computer Knowledge",
  ];

  const founderPhotos = [
    {
      name: "Prasad Goud V",
      occupation: "Director",
      Location: "ViGYAAN Academy",
    },
    {
      name: "Manoj Reddy M",
      occupation: "Director",
      Location: "ViGYAAN Academy",
    },
    {
      name: "K R Krishna",
      occupation: "Course Adviser",
      Location: "ViGYAAN Academy",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5efe7] text-[#1e1e1e] overflow-x-hidden">
      <>
        <nav className="sticky top-0 z-50 backdrop-blur-lg bg-[#f5efe7]/90 border-b border-[#d5b07a]">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Image
                src="/logo.jpeg"
                alt="logo"
                className="h-[50px] w-[70px] object-contain"
                height={100}
                width={100}
              />

              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-[0.3em] text-[#b57a2c]">
                  ViGYAAN
                </h1>
                <p className="text-xs tracking-[0.5em] text-[#222]">ACADEMY</p>
              </div>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8 text-base font-semibold">
              {navItems.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="hover:text-[#c17d2f] transition-colors"
                >
                  {item}
                </a>
              ))}
            </div>

            {/* Mobile button */}
            <button className="md:hidden" onClick={() => setOpen(true)}>
              <Menu size={28} />
            </button>
          </div>
        </nav>

        {/* Overlay */}
        {open && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setOpen(false)}
          />
        )}

        {/* Drawer */}
        <div
          className={` bg-[#f5efe7] fixed top-0 right-0 h-full w-72 z-50 shadow-lg transform transition-transform duration-300 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex justify-between items-center p-5 border-b">
            <h2 className="font-bold text-lg text-[#c08137]">Menu</h2>
            <button onClick={() => setOpen(false)}>
              <X color="#c08137" size={24} />
            </button>
          </div>

          <div className="flex flex-col p-5 gap-5 text-base font-semibold">
            {navItems.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={() => setOpen(false)}
                className="text-[#c08137] hover:text-[#c17d2f]"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </>

      <section
        id="home"
        className="relative px-6 py-20 md:py-28 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#fffaf5] via-[#efe2d1] to-[#d8b184] opacity-70" />

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#1d1d1d] text-[#f2c179] px-4 py-2 rounded-full text-sm font-semibold mb-6 shadow-lg">
              🎓 Degree + Civil Services
            </div>

            <h2 className="text-5xl md:text-7xl font-black leading-tight tracking-tight">
              Graduate Plus
              <span className="block text-[#c08137]">Civil Services</span>
              Programme
            </h2>

            <p className="mt-8 text-lg md:text-xl text-[#444] leading-relaxed max-w-2xl">
              A focused ecosystem crafted for ambitious students preparing for
              UPSC, SSC, PSC, and competitive government examinations while
              completing their academic degree.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <button className="bg-[#1c1c1c] hover:bg-[#2a2a2a] text-white px-8 py-4 rounded-2xl font-bold shadow-2xl transition-transform hover:scale-105">
                Explore Programme
              </button>

              <button className="border-2 border-[#c08137] text-[#1c1c1c] hover:bg-[#c08137] hover:text-white px-8 py-4 rounded-2xl font-bold transition-all">
                Contact Us
              </button>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#d6a15f]/30 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-52 h-52 bg-[#000]/10 rounded-full blur-3xl" />

            <div className="relative bg-white/80 backdrop-blur-xl p-4 rounded-[2rem] shadow-[0_20px_80px_rgba(0,0,0,0.18)] border border-[#e7c59c]">
              <Image
                src="/student.jpg"
                alt="Students"
                className="w-full max-w-xl h-[500px] object-cover rounded-[1.5rem]"
                height={100}
                width={100}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 bg-[#111111] text-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block bg-[#c08137] text-black px-5 py-2 rounded-full font-bold mb-6">
              Why Vigyaan?
            </div>

            <h3 className="text-4xl md:text-5xl font-black leading-tight">
              Academic precision with competitive exam firepower.
            </h3>

            <p className="mt-8 text-lg text-gray-300 leading-relaxed">
              The Civil Service Examination (CSE) is considered to be one of the
              toughest exams, owing to the vast and dynamic nature of its
              syllabus. It is a challenge for any student to prepare this vast
              syllabus and get their name on the final list of selected
              candidates of examination in a limited span of time.
            </p>
            <p className="mt-8 text-lg text-gray-300 leading-relaxed my-2">
              VIGYAAN has developed a comprehensive academic program that
              addresses the issues that CSE and other competitive exams
              aspirants confront, distinguishing us from other institutes.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md hover:-translate-y-2 transition-transform"
              >
                <div className="text-3xl mb-4">⚡</div>
                <p className="text-gray-200 leading-relaxed">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="px-6 py-24 bg-[#f5efe7]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block bg-[#1a1a1a] text-[#e6b46d] px-5 py-2 rounded-full font-bold mb-5">
              Services
            </span>

            <h3 className="text-4xl md:text-6xl font-black text-[#1d1d1d] leading-tight">
              Topics covered in the Graduate Plus curriculum.
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-16">
            {topics.map((topic, index) => (
              <div
                key={index}
                className="group bg-white rounded-3xl p-6 border border-[#e3c39d] shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#c08137] text-white flex items-center justify-center text-2xl mb-5 group-hover:rotate-6 transition-transform">
                  📘
                </div>
                <h4 className="font-bold text-lg leading-snug">{topic}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 bg-gradient-to-br from-[#e8d2b5] via-[#f8f1e8] to-[#d2aa74]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8 mb-14">
            <div>
              <span className="inline-block bg-[#1b1b1b] text-[#f3c27a] px-5 py-2 rounded-full font-bold mb-5">
                Founders
              </span>
              <h3 className="text-4xl md:text-6xl font-black leading-tight text-[#111] max-w-3xl">
                The minds steering the academy.
              </h3>
            </div>
          </div>
          <div className="my-8">
            <p className="max-w-xl text-lg text-[#444] leading-relaxed">
              Educators, strategists, and mentors shaping students into
              government service aspirants with discipline and direction.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {founderPhotos.map((photo, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-md rounded-[2rem] overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.12)] border border-white/60"
              >
                <div className="p-6">
                  <h4 className="text-2xl font-black my-2">{photo.name}</h4>
                  <h6 className="text-xl font-black text-[#c08137]">
                    {photo.occupation}
                  </h6>
                  <p className="mt-3 text-[#555] leading-relaxed">
                    Dedicated to building a competitive learning ecosystem with
                    academic rigor and real-world mentorship.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="px-6 py-24 bg-[#111111] text-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <span className="inline-block bg-[#c08137] text-black px-5 py-2 rounded-full font-bold mb-6">
              Contact
            </span>

            <h3 className="text-4xl md:text-6xl font-black leading-tight">
              Ready to level up your future?
            </h3>

            <p className="mt-8 text-lg text-gray-300 leading-relaxed max-w-xl">
              Reach out for admissions, counselling, and programme details.
              ViGYAAN Academy transforms scattered ambition into disciplined
              preparation.
            </p>
            <h5 className="text-xl md:text-2xl font-black leading-tight my-4">
              Our Address
            </h5>
            <p className="mt-8 text-lg text-gray-300 leading-relaxed max-w-xl">
              Cyber Residency, Plot No.647, Ground Floor, Sri Ramnagar Colony,
              Block - C, Serilingampally, Rangareddy, Telangana.
            </p>
            <h5 className="text-xl md:text-2xl font-black leading-tight my-4">
              Call Us
            </h5>
            <a href="tel:+917799077701" className="text-gray-300">
              <p>
                Primary Number:{" "}
                <span className="hover:underline">+91-7799077701</span>
              </p>
            </a>
            <div></div>
            <a href="tel:+917799077701" className="text-gray-300">
              <p>
                Alternative Number:{" "}
                <span className="hover:underline">+91-7396747359</span>
              </p>
            </a>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-lg">
            <div className="grid gap-5">
              <input
                type="text"
                placeholder="Your Name"
                className="bg-black/30 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-[#c08137]"
              />

              <input
                type="email"
                placeholder="Email Address"
                className="bg-black/30 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-[#c08137]"
              />

              <textarea
                rows={5}
                placeholder="Your Message"
                className="bg-black/30 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-[#c08137]"
              />

              <button className="bg-[#c08137] hover:scale-[1.02] transition-transform text-black font-black py-4 rounded-2xl shadow-xl">
                Send Message
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#0a0a0a] text-white px-6 py-10 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <h4 className="text-2xl font-black tracking-[0.3em] text-[#d39b53]">
              ViGYAAN
            </h4>
            <p className="text-sm text-gray-400 mt-2">
              Graduate Plus Civil Services Programme
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-300">
            <a href="#home" className="hover:text-[#d39b53] transition-colors">
              Home
            </a>
            <a
              href="#services"
              className="hover:text-[#d39b53] transition-colors"
            >
              Services
            </a>
            <a
              href="#contact"
              className="hover:text-[#d39b53] transition-colors"
            >
              Contact
            </a>
          </div>

          <p className="text-sm text-gray-500">
            © 2026 ViGYAAN Academy. Built for ambitious minds.
          </p>
        </div>
      </footer>
    </div>
  );
}
