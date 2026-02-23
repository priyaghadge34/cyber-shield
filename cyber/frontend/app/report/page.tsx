'use client';

import { useState } from 'react';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ReportPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    incidentType: '',
    description: '',
    location: '',
    date: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [aiTag, setAiTag] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setAiTag(null);

    try {
      const res = await fetch('http://localhost:8000/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (res.ok && json.status === 'success') {
        setMessage('✅ Report submitted successfully!');
        setAiTag(json.ai_tag || 'General');
        setFormData({
          name: '',
          email: '',
          incidentType: '',
          description: '',
          location: '',
          date: '',
        });
      } else {
        throw new Error(json.detail || 'Submission failed');
      }
    } catch (err: any) {
      console.error(err);
      setMessage('❌ Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 flex justify-center items-center">
      <div className="max-w-2xl w-full bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-700">
        <h1 className="text-4xl font-bold text-center mb-6 text-blue-400 tracking-wide">
          Report an Incident
        </h1>
        <p className="text-center text-gray-400 mb-8">
          If you've witnessed or experienced any cybercrime or ragging-related incident, please fill out this form.
          Your identity will remain <span className="text-blue-300 font-semibold">confidential</span>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-300 mb-1">Name (optional)</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Enter your name (optional)"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-1">Email (optional)</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Enter your email (optional)"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-1">Incident Type</label>
            <select
              name="incidentType"
              value={formData.incidentType}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select an incident type</option>
              <option value="Cyberbullying">Cyberbullying</option>
              <option value="Ragging">Ragging</option>
              <option value="Harassment">Harassment</option>
              <option value="Data Breach">Data Breach</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-300 mb-1">Incident Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Describe what happened..."
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="E.g., College Campus, Hostel"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold text-white ${
              loading ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'
            } flex justify-center items-center gap-2`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" /> Submitting...
              </>
            ) : (
              'Submit Report'
            )}
          </button>
        </form>

        {message && (
          <div className="mt-6 text-center">
            {message.includes('✅') ? (
              <CheckCircle className="mx-auto text-green-400 mb-2" size={40} />
            ) : (
              <AlertTriangle className="mx-auto text-red-400 mb-2" size={40} />
            )}
            <p className="text-gray-200">{message}</p>
            {aiTag && (
              <p className="text-sm text-gray-400 mt-2">
                🧠 <span className="text-blue-400">AI Category:</span> {aiTag}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
