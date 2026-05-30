import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Student {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
}

interface S3Data {
  bucket: string;
  files: string[];
}

const Dashboard = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [s3Data, setS3Data] = useState<S3Data | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const rawBase = (import.meta.env.VITE_API_URL || "").trim();
    const API_BASE = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;
    
    axios.get(`${API_BASE}/students`)
      .then(res => {
        if (res.data && Array.isArray(res.data)) {
          setStudents(res.data);
        } else {
          setStudents([]);
        }
      })
      .catch(err => {
        console.error("Dashboard students fetch error:", err);
        setStudents([]);
      });

    axios.get(`${API_BASE}/s3-files`)
      .then(res => {
        if (res.data && Array.isArray(res.data.files)) {
          setS3Data(res.data);
        } else {
          setS3Data({ bucket: "", files: [] });
        }
      })
      .catch(() => setS3Data({ bucket: "", files: [] }));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl mb-6 font-bold">Student Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {students.map((s: Student) => (
          <div
            key={s.id}
            onClick={() => navigate(`/student/${s.id}`)}
            className="cursor-pointer bg-white rounded-xl border border-gray-200 shadow-md p-6 hover:shadow-lg transition"
          >
            <h2 className="text-xl font-semibold">{s.first_name} {s.last_name}</h2>
            <p className="text-gray-600">ID: {s.student_id}</p>
          </div>
        ))}
      </div>

      <h2 className="text-2xl mb-4 font-bold">S3 Assets Gallery</h2>
      {s3Data && s3Data.files.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {s3Data.files.map((file: string) => (
            <div key={file} className="border rounded p-2 bg-gray-50">
              <img 
                src={`https://${s3Data.bucket}.s3.amazonaws.com/${file}`} 
                alt={file} 
                className="w-full h-32 object-cover rounded"
                onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=Private+S3')}
              />
              <p className="text-xs mt-2 truncate text-gray-500">{file}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No assets found in S3 bucket or bucket is private.</p>
      )}
    </div>
  );
};

export default Dashboard;
