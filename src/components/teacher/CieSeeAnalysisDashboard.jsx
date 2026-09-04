import React, { useMemo, useState } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ZAxis 
} from 'recharts';
import { AlertCircle, TrendingUp, Users, BookOpen, AlertTriangle } from 'lucide-react';
import { analyzeStudentMarks, calculateClassAggregates } from '../../utils/cieSeeAnalytics';
import VtuPerformanceModal from './VtuPerformanceModal';

// Using a vibrant aesthetic tailored to existing app styling, with glassmorphism concepts if needed
const RISK_COLORS = {
  'Consistent Pass': '#10B981', // Emerald 500
  'Consistent Fail': '#EF4444', // Red 500
  'High CIE but Failed SEE': '#F59E0B', // Amber 500
  'Low CIE but Passed SEE': '#3B82F6', // Blue 500
};

// Fallback dummy data if no props provided for preview
const MOCK_DATA = [
  { student_id: '1', name: 'John Doe', subject_code: 'CS101', cie_marks: 35, see_marks: 40 },
  { student_id: '2', name: 'Jane Smith', subject_code: 'CS101', cie_marks: 40, see_marks: 45 },
  { student_id: '3', name: 'Bob Wilson', subject_code: 'CS101', cie_marks: 20, see_marks: 15 },
  { student_id: '4', name: 'Alice Brown', subject_code: 'CS101', cie_marks: 38, see_marks: 16 }, // High CIE, Failed SEE!
  { student_id: '5', name: 'Charlie Davis', subject_code: 'CS101', cie_marks: 22, see_marks: 20 }, // Low CIE, Passed SEE!
  { student_id: '6', name: 'Eve Johnson', subject_code: 'CS101', cie_marks: 23, see_marks: 14 },
  { student_id: '7', name: 'Frank Miller', subject_code: 'CS101', cie_marks: 48, see_marks: 12 }, // High CIE, Failed SEE!
  { student_id: '8', name: 'Grace Lee', subject_code: 'CS101', cie_marks: 35, see_marks: 38 },
];

export default function CieSeeAnalysisDashboard({ marksData = MOCK_DATA, seePassThreshold = 18 }) {
  const [vtuModal, setVtuModal] = useState({ isOpen: false, student: null });
  // Compute metrics internally
  const { analyzedData, aggregates, pieData, scatterData } = useMemo(() => {
    const analyzed = analyzeStudentMarks(marksData, seePassThreshold);
    const aggs = calculateClassAggregates(analyzed);

    // Format for PieChart
    const pData = aggs ? Object.entries(aggs.riskCounts).map(([key, value]) => ({
      name: key,
      value: value
    })).filter(item => item.value > 0) : []; // Filter out 0 counts to keep plot clean

    // Format for ScatterChart
    const sData = analyzed.map(student => ({
      x: student.cie_marks,
      y: student.see_marks,
      name: student.name,
      result: student.result,
      category: student.riskCategory
    }));

    return { 
      analyzedData: analyzed, 
      aggregates: aggs, 
      pieData: pData,
      scatterData: sData 
    };
  }, [marksData, seePassThreshold]);

  if (!aggregates) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500 bg-white/50 rounded-2xl border border-white/20 backdrop-blur">
        No student marks data available for analysis.
      </div>
    );
  }

  const criticalRiskCount = aggregates.riskCounts['High CIE but Failed SEE'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-indigo-600" />
            CIE-SEE Failure Analysis
          </h2>
          <p className="text-gray-500 mt-1">
            Analyzing performance gaps between internal assessments and final exams.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Students</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{aggregates.totalStudents}</h3>
          </div>
          <div className="h-12 w-12 bg-indigo-50 rounded-full flex items-center justify-center">
            <Users className="h-6 w-6 text-indigo-600" />
          </div>
        </div>

        {/* Average SEE */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm font-medium text-gray-500">Average SEE Marks</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{aggregates.avgSEE} <span className="text-sm text-gray-400 font-normal">/ 50</span></h3>
          </div>
          <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        {/* Correlation Score */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm font-medium text-gray-500">Correlation Score</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{aggregates.correlation}</h3>
            <p className={`text-xs mt-1 font-medium ${
              aggregates.correlation > 0.70 ? 'text-green-600' : aggregates.correlation >= 0.50 ? 'text-amber-600' : 'text-red-500'
            }`}>
              {aggregates.interpretation}
            </p>
          </div>
          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
            aggregates.correlation > 0.70 ? 'bg-green-50' : aggregates.correlation >= 0.50 ? 'bg-amber-50' : 'bg-red-50'
          }`}>
            <TrendingUp className={`h-6 w-6 ${
              aggregates.correlation > 0.70 ? 'text-green-600' : aggregates.correlation >= 0.50 ? 'text-amber-600' : 'text-red-500'
            }`} />
          </div>
        </div>

        {/* Critical Risk Warning Card */}
        <div className={`p-6 rounded-2xl shadow-sm border flex items-center justify-between transition-all ${
          criticalRiskCount > 0 
            ? 'bg-red-50/50 border-red-200 hover:bg-red-50' 
            : 'bg-green-50/50 border-green-200 hover:bg-green-50'
        }`}>
          <div>
            <p className={`text-sm font-medium ${criticalRiskCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              High CIE but Failed SEE
            </p>
            <div className="flex items-baseline mt-1 gap-2">
              <h3 className={`text-2xl font-bold ${criticalRiskCount > 0 ? 'text-red-700' : 'text-green-700'}`}>
                {criticalRiskCount}
              </h3>
              <span className={`text-sm ${criticalRiskCount > 0 ? 'text-red-500' : 'text-green-500'}`}>students</span>
            </div>
            {criticalRiskCount > 0 && (
              <p className="text-xs text-red-500 mt-1 font-medium">Requires immediate attention</p>
            )}
          </div>
          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
             criticalRiskCount > 0 ? 'bg-red-100' : 'bg-green-100'
          }`}>
            {criticalRiskCount > 0 ? (
              <AlertTriangle className="h-6 w-6 text-red-600" />
            ) : (
              <AlertCircle className="h-6 w-6 text-green-600" />
            )}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Donut Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Category Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name] || '#ccc'} cursor="pointer" />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value, name) => [`${value} Students`, name]}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CIE vs SEE Scatter Plot */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">CIE vs SEE Correlation</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="CIE Marks" 
                  domain={[0, 50]} 
                  label={{ value: "CIE Marks", position: 'insideBottom', offset: -10 }}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="SEE Marks" 
                  domain={[0, 50]} 
                  label={{ value: "SEE Marks", angle: -90, position: 'insideLeft', offset: -10 }}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <RechartsTooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 min-w-[150px]">
                          <p className="font-semibold text-gray-900">{data.name}</p>
                          <div className="mt-2 space-y-1 text-sm">
                            <p className="text-gray-600">CIE: <span className="font-medium text-gray-900">{data.x}</span></p>
                            <p className="text-gray-600">SEE: <span className="font-medium text-gray-900">{data.y}</span></p>
                            <p className="mt-2 pt-2 border-t text-xs font-medium" style={{ color: RISK_COLORS[data.category] }}>
                              {data.category}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ZAxis type="number" range={[60, 100]} />
                <Scatter data={scatterData} animationDuration={1500}>
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.category] || '#ccc'} fillOpacity={0.8} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-center mt-2 text-gray-500">Each dot represents a student. Pass threshold applied to SEE marks.</p>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-semibold text-gray-900">Student Analysis List</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="py-4 px-6 font-medium">Student Name</th>
                <th className="py-4 px-6 font-medium text-center">CIE Marks</th>
                <th className="py-4 px-6 font-medium text-center">SEE Marks</th>
                <th className="py-4 px-6 font-medium text-center">Total</th>
                <th className="py-4 px-6 font-medium text-center">Gap (CIE-SEE)</th>
                <th className="py-4 px-6 font-medium text-center">Result</th>
                <th className="py-4 px-6 font-medium">Risk Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {analyzedData.map((student) => (
                <tr 
                  key={student.student_id + student.subject_code} 
                  className="hover:bg-gray-100/80 transition-colors cursor-pointer"
                  onClick={() => setVtuModal({ isOpen: true, student })}
                >
                  <td className="py-4 px-6">
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="text-xs text-gray-500">{student.student_id} | {student.subject_code}</div>
                  </td>
                  <td className="py-4 px-6 text-center text-gray-700 font-medium">{student.cie_marks}</td>
                  <td className="py-4 px-6 text-center text-gray-700 font-medium">{student.see_marks}</td>
                  <td className="py-4 px-6 text-center text-gray-900 font-bold">{student.totalMarks}</td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-semibold ${
                      student.gap > 15 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {student.gap > 0 ? '+' : ''}{student.gap}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      student.result === 'Pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {student.result}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: RISK_COLORS[student.riskCategory] }}>
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: RISK_COLORS[student.riskCategory] }}></div>
                      {student.riskCategory}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {analyzedData.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No students found for analysis.
            </div>
          )}
        </div>
      </div>

      <VtuPerformanceModal 
        isOpen={vtuModal.isOpen} 
        onClose={() => setVtuModal({...vtuModal, isOpen: false})} 
        studentName={vtuModal.student?.name} 
        studentId={vtuModal.student?.student_id} 
        currentSubjects={vtuModal.student ? [
          {
            name: vtuModal.student.subject_code,
            totalMarks: vtuModal.student.totalMarks,
            maxMarks: 100,
            credits: 4
          }
        ] : []}
      />
    </div>
  );
}
