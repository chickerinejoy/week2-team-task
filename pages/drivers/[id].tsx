import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import * as Tabs from '@radix-ui/react-tabs';
import jwt from 'jsonwebtoken';

interface Driver {
  id: number;
  name: string;
  license_number: string;
  contact: string;
  feedback: { id: number; rating: number; content: string }[];
  violations: { id: number; type: string; description: string; date: string }[];
  infractions: { id: number; incident: string; description: string; date: string }[];
  drug_test_results: { id: number; test_date: string; result: string }[];
  credentials: { id: number; type: string; is_valid: boolean; remarks: string | null }[];
}

export default function DriverProfilePage() {
  const router = useRouter();
  const { id } = router.query;

  const [driver, setDriver] = useState<Driver | null>(null);
  const [iframeUrl, setIframeUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchDriverProfile = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/drivers/${id}/profile`);
        setDriver(res.data);

        // Metabase Secure Embed Token
        const METABASE_SITE_URL = 'http://localhost:3000';
        const METABASE_SECRET_KEY =
          'f6ecbf88d1d3af275aa295f05daa1f8cce51dc5bc8e1ef07635a989cfe4e2537';

        const payload = {
          resource: { dashboard: 4 },
          params: {},
          exp: Math.round(Date.now() / 1000) + 10 * 60,
        };

        const token = jwt.sign(payload, METABASE_SECRET_KEY);
        setIframeUrl(`${METABASE_SITE_URL}/embed/dashboard/${token}#bordered=true&titled=true`);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch driver profile');
      } finally {
        setLoading(false);
      }
    };

    fetchDriverProfile();
  }, [id]);

  if (loading) return <p className="p-6">Loading driver profile...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!driver) return <p className="p-6">No driver data available.</p>;

  const { name, license_number, contact, feedback, violations, infractions, drug_test_results, credentials } = driver;

  const averageRating =
    feedback.length > 0
      ? (feedback.reduce((acc, f) => acc + f.rating, 0) / feedback.length).toFixed(2)
      : 'No rating yet';

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Driver Profile: {name}</h1>
      <p>License #: {license_number}</p>
      <p>Contact: {contact}</p>

      <Tabs.Root defaultValue="drug">
        <Tabs.List className="flex gap-4 mt-6 border-b pb-2">
          <Tabs.Trigger value="drug">Drug Tests</Tabs.Trigger>
          <Tabs.Trigger value="violations">Violations & Infractions</Tabs.Trigger>
          <Tabs.Trigger value="rating">Performance Rating</Tabs.Trigger>
          <Tabs.Trigger value="credentials">Credentials</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="drug" className="mt-4">
          <h2 className="text-xl font-semibold">Drug Test History</h2>
          <table className="w-full mt-2 border">
            <thead>
              <tr>
                <th>Date</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {drug_test_results.map((test) => (
                <tr key={test.id}>
                  <td>{test.test_date}</td>
                  <td>{test.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Tabs.Content>

        <Tabs.Content value="violations" className="mt-4">
          <h2 className="text-xl font-semibold">Violations</h2>
          {violations.map((v) => (
            <div key={v.id} className="mb-2 p-2 border rounded">
              <strong>{v.type}</strong> ({v.date})<br />
              {v.description}
            </div>
          ))}
          <h2 className="text-xl font-semibold mt-4">Infractions</h2>
          {infractions.map((i) => (
            <div key={i.id} className="mb-2 p-2 border rounded">
              <strong>{i.incident}</strong> ({i.date})<br />
              {i.description}
            </div>
          ))}
        </Tabs.Content>

        <Tabs.Content value="rating" className="mt-4">
          <h2 className="text-xl font-semibold">Performance Rating</h2>
          <p>Average Rating: {averageRating}</p>
          {feedback.map((fb) => (
            <div key={fb.id} className="p-2 border rounded my-2">
              <strong>Rating: {fb.rating}</strong><br />
              {fb.content}
            </div>
          ))}
        </Tabs.Content>

        <Tabs.Content value="credentials" className="mt-4">
          <h2 className="text-xl font-semibold">Uploaded Credentials</h2>
          <ul>
            {credentials.map((cred) => (
              <li key={cred.id}>
                📄 {cred.type} – {cred.is_valid ? '✅ Valid' : '❌ Invalid'} ({cred.remarks || 'No remarks'})
              </li>
            ))}
          </ul>
        </Tabs.Content>
      </Tabs.Root>

      <div className="mt-10">
        <h2 className="text-xl font-bold mb-2">Driver Insights Dashboard</h2>
        <iframe
          src={iframeUrl}
          frameBorder="0"
          width="100%"
          height="600"
          allowTransparency
          className="w-full border rounded"
        />
      </div>
    </div>
  );
}
