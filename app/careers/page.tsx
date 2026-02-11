'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/footer';

type JobPosition = {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time';
  description: string;
  responsibilities: string[];
  requirements: string[];
};

export default function CareersPage() {
  const [selectedJob, setSelectedJob] = useState<JobPosition | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  const jobs: JobPosition[] = [
    {
      id: '1',
      title: 'Head Chef',
      department: 'Kitchen',
      location: 'Yokosuka',
      type: 'full-time',
      description: 'Lead our kitchen team in creating authentic Indian, Nepali, and Mexican dishes that delight our customers.',
      responsibilities: [
        'Oversee daily kitchen operations and food preparation',
        'Train and mentor junior kitchen staff',
        'Maintain quality standards and food safety protocols',
        'Create new menu items and seasonal specials',
        'Manage inventory and ordering of ingredients'
      ],
      requirements: [
        '5+ years of professional cooking experience',
        'Experience with Indian, Nepali, or Mexican cuisine',
        'Strong leadership and communication skills',
        'Food safety certification',
        'Ability to work in a fast-paced environment'
      ]
    },
    {
      id: '2',
      title: 'Delivery Driver',
      department: 'Delivery',
      location: 'Yokosuka',
      type: 'part-time',
      description: 'Deliver delicious meals to our customers with a smile and ensure excellent customer service.',
      responsibilities: [
        'Safely deliver food orders to customers',
        'Maintain delivery vehicle cleanliness',
        'Provide excellent customer service',
        'Handle cash and card payments accurately',
        'Communicate order status with kitchen staff'
      ],
      requirements: [
        'Valid driver\'s license',
        'Own vehicle or motorcycle',
        'Knowledge of Yokosuka area',
        'Excellent communication skills',
        'Punctual and reliable'
      ]
    },
    {
      id: '3',
      title: 'Kitchen Staff',
      department: 'Kitchen',
      location: 'Yokosuka',
      type: 'full-time',
      description: 'Join our kitchen team and help prepare authentic dishes in a friendly, fast-paced environment.',
      responsibilities: [
        'Prepare ingredients and assist with cooking',
        'Maintain cleanliness and organization',
        'Follow recipes and quality standards',
        'Work collaboratively with team members',
        'Ensure food safety protocols are followed'
      ],
      requirements: [
        'Previous kitchen experience preferred',
        'Ability to work flexible hours including weekends',
        'Team player with positive attitude',
        'Physical ability to stand for long periods',
        'Passion for food and cooking'
      ]
    },
    {
      id: '4',
      title: 'Customer Service Representative',
      department: 'Front of House',
      location: 'Yokosuka',
      type: 'part-time',
      description: 'Be the friendly face of The Curry House, taking orders and ensuring customer satisfaction.',
      responsibilities: [
        'Take phone and online orders accurately',
        'Provide menu recommendations to customers',
        'Handle customer inquiries and complaints',
        'Process payments and maintain cash register',
        'Coordinate with kitchen and delivery staff'
      ],
      requirements: [
        'Excellent communication skills in Japanese',
        'English proficiency is a plus',
        'Customer service experience preferred',
        'Friendly and professional demeanor',
        'Ability to multitask in busy environment'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      {/* Hero */}
      <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            Join Our Team
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            Build your career with a growing restaurant that values passion, teamwork, and excellence
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Why Work With Us */}
        <div className="mb-16">
          <h2 className="text-4xl font-black text-center text-gray-900 dark:text-white mb-4">
            Why Work With Us?
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 text-lg mb-12 max-w-3xl mx-auto">
            We're more than just a restaurant - we're a family that cares about our team's growth and success
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Competitive Pay', desc: 'Fair compensation with performance bonuses' },
              { title: 'Career Growth', desc: 'Opportunities for advancement and skill development' },
              { title: 'Benefits', desc: 'Health insurance and paid time off for full-time staff' },
              { title: 'Great Culture', desc: 'Friendly team environment with regular team events' },
              { title: 'Free Meals', desc: 'Complimentary meals during your shift' },
              { title: 'Flexible Hours', desc: 'Work schedules that fit your lifestyle' },
              { title: 'Training', desc: 'Comprehensive training programs for all positions' },
              { title: 'Recognition', desc: 'Employee of the month awards and recognition' }
            ].map((benefit, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-700 dark:text-purple-400 font-black text-sm">{String(idx + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Open Positions */}
        <div className="mb-16">
          <h2 className="text-4xl font-black text-center text-gray-900 dark:text-white mb-12">
            Open Positions
          </h2>

          <div className="grid lg:grid-cols-2 gap-6">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-2xl transition-shadow">
                <div className="p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {job.title}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-sm font-semibold">
                          {job.department}
                        </span>
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-semibold">
                          {job.type}
                        </span>
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-semibold">
                          {job.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                    {job.description}
                  </p>

                  <button
                    onClick={() => setSelectedJob(job)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-bold shadow-lg"
                  >
                    View Details & Apply
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* General Application CTA */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-4xl font-black mb-4">
            Don't See Your Role?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            We're always looking for talented people! Send us your resume and we'll keep you in mind for future openings.
          </p>
          <button
            onClick={() => setShowApplicationForm(true)}
            className="bg-white text-orange-600 px-8 py-4 rounded-xl hover:bg-gray-100 transition-all font-bold text-lg shadow-xl"
          >
            Submit General Application
          </button>
        </div>
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-3xl w-full my-8 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="p-8 md:p-12">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-3">
                    {selectedJob.title}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full font-bold">
                      {selectedJob.department}
                    </span>
                    <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full font-bold">
                      {selectedJob.type}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-3xl"
                >
                  ×
                </button>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg leading-relaxed">
                {selectedJob.description}
              </p>

              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Responsibilities
                </h3>
                <ul className="space-y-3">
                  {selectedJob.responsibilities.map((resp, idx) => (
                    <li key={idx} className="flex gap-3 text-gray-600 dark:text-gray-400">
                      <span className="text-green-500 font-bold">✓</span>
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Requirements
                </h3>
                <ul className="space-y-3">
                  {selectedJob.requirements.map((req, idx) => (
                    <li key={idx} className="flex gap-3 text-gray-600 dark:text-gray-400">
                      <span className="text-orange-500 font-bold">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowApplicationForm(true);
                    setSelectedJob(null);
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-bold text-lg shadow-xl"
                >
                  Apply for This Position
                </button>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="px-8 py-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application Form Modal */}
      {showApplicationForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-2xl w-full my-8 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="p-8 md:p-12">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-4xl font-black text-gray-900 dark:text-white">
                  Apply Now
                </h2>
                <button
                  onClick={() => setShowApplicationForm(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-3xl"
                >
                  ×
                </button>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Fill out this form and we'll get back to you within 48 hours
              </p>

              <form className="space-y-6" onSubmit={(e) => {
                e.preventDefault();
                alert('Application submitted! We\'ll contact you soon.');
                setShowApplicationForm(false);
              }}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 outline-none transition-colors text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 outline-none transition-colors text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 outline-none transition-colors text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Position Applying For *
                  </label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 outline-none transition-colors text-gray-900 dark:text-white"
                  >
                    <option value="">Select a position</option>
                    {jobs.map(job => (
                      <option key={job.id} value={job.id}>{job.title}</option>
                    ))}
                    <option value="other">Other / General Application</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Why do you want to work with us? *
                  </label>
                  <textarea
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 outline-none transition-colors text-gray-900 dark:text-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Resume / CV
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 outline-none transition-colors text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    PDF, DOC, or DOCX format (optional)
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-bold text-lg shadow-xl"
                >
                  Submit Application
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
