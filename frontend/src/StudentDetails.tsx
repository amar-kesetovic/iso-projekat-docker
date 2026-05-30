import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

interface Grade {
  id: number;
  course_name: string;
  grade: number;
}

interface Student {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  grades: Grade[];
}

const StudentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);

  const rawBase = (import.meta.env.VITE_API_URL || "").trim();
  const API_BASE = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

  useEffect(() => {
    axios.get(`${API_BASE}/students/${id}`).then(res => setStudent(res.data));
  }, [id, API_BASE]);

  const addGrade = async () => {
    const grade = prompt("Enter Grade (0-100):");
    const course = prompt("Enter Course Name:");
    if (grade && course) {
      await axios.post(`${API_BASE}/students/${id}/grades?course_name=${course}&grade=${grade}`);
      window.location.reload();
    }
  };

  if (!student) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <button onClick={() => navigate('/dashboard')} className="text-blue-500 mb-4 hover:underline">&larr; Back to Dashboard</button>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-2">{student.first_name} {student.last_name}</h1>
        <p className="text-gray-600 mb-6">Student ID: {student.student_id}</p>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Grades</h2>
          <button onClick={addGrade} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition">Add Grade</button>
        </div>

        {student.grades.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">Course</th>
                <th className="py-2">Grade</th>
              </tr>
            </thead>
            <tbody>
              {student.grades.map(g => (
                <tr key={g.id} className="border-b">
                  <td className="py-2">{g.course_name}</td>
                  <td className="py-2">{g.grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">No grades recorded.</p>
        )}
      </div>
    </div>
  );
};

export default StudentDetails;
