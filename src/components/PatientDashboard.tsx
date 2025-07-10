import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Activity, 
  Calendar, 
  TrendingUp, 
  Plus, 
  Phone, 
  MessageSquare,
  Baby,
  Droplets,
  Scale,
  Clock,
  AlertCircle,
  CheckCircle,
  User,
  Stethoscope
} from 'lucide-react';
import { Patient, HealthRecord, BloodPressureData, SugarLevelData, BabyMovementData, WeeklyUpdateData } from '../types';

interface PatientDashboardProps {
  patient: Patient;
}

const PatientDashboard: React.FC<PatientDashboardProps> = ({ patient }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [recordType, setRecordType] = useState<'blood_pressure' | 'sugar_level' | 'baby_movement' | 'weekly_update'>('blood_pressure');
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>(patient.healthRecords || []);

  // Form states for different record types
  const [bloodPressureForm, setBloodPressureForm] = useState({
    systolic: '',
    diastolic: '',
    heartRate: '',
    notes: ''
  });

  const [sugarLevelForm, setSugarLevelForm] = useState({
    level: '',
    testType: 'fasting' as 'fasting' | 'random' | 'post_meal',
    notes: ''
  });

  const [babyMovementForm, setBabyMovementForm] = useState({
    count: '',
    duration: '',
    notes: ''
  });

  const [weeklyUpdateForm, setWeeklyUpdateForm] = useState({
    weight: '',
    symptoms: [] as string[],
    mood: 5,
    notes: ''
  });

  // Function to send notification to Dr. Rajesh
  const notifyDoctor = async (recordData: HealthRecord) => {
    try {
      // In a real application, this would be an API call
      // For now, we'll simulate sending an email notification
      const notification = {
        to: 'dr.rajesh@hospital.com',
        subject: `Health Update from ${patient.name}`,
        body: `
          Patient: ${patient.name}
          Record Type: ${recordData.type.replace('_', ' ').toUpperCase()}
          Date: ${new Date(recordData.date).toLocaleDateString()}
          
          ${getNotificationContent(recordData)}
          
          Please review the patient's dashboard for complete details.
        `
      };

      // Simulate email sending (in production, this would be a real API call)
      console.log('Email notification sent to Dr. Rajesh:', notification);
      
      // Show success message to user
      alert('Health record saved and Dr. Rajesh has been notified!');
    } catch (error) {
      console.error('Failed to notify doctor:', error);
    }
  };

  const getNotificationContent = (record: HealthRecord): string => {
    switch (record.type) {
      case 'blood_pressure':
        const bpData = record.data as BloodPressureData;
        return `Blood Pressure: ${bpData.systolic}/${bpData.diastolic} mmHg, Heart Rate: ${bpData.heartRate} bpm`;
      case 'sugar_level':
        const sugarData = record.data as SugarLevelData;
        return `Sugar Level: ${sugarData.level} mg/dL (${sugarData.testType})`;
      case 'baby_movement':
        const movementData = record.data as BabyMovementData;
        return `Baby Movements: ${movementData.count} movements in ${movementData.duration} minutes`;
      case 'weekly_update':
        const weeklyData = record.data as WeeklyUpdateData;
        return `Weight: ${weeklyData.weight} kg, Mood: ${weeklyData.mood}/10, Symptoms: ${weeklyData.symptoms.join(', ')}`;
      default:
        return 'Health record updated';
    }
  };

  const handleAddRecord = async () => {
    let recordData: any = {};
    let isValid = false;

    switch (recordType) {
      case 'blood_pressure':
        if (bloodPressureForm.systolic && bloodPressureForm.diastolic && bloodPressureForm.heartRate) {
          recordData = {
            systolic: parseInt(bloodPressureForm.systolic),
            diastolic: parseInt(bloodPressureForm.diastolic),
            heartRate: parseInt(bloodPressureForm.heartRate),
            notes: bloodPressureForm.notes
          };
          isValid = true;
        }
        break;
      case 'sugar_level':
        if (sugarLevelForm.level) {
          recordData = {
            level: parseFloat(sugarLevelForm.level),
            testType: sugarLevelForm.testType,
            notes: sugarLevelForm.notes
          };
          isValid = true;
        }
        break;
      case 'baby_movement':
        if (babyMovementForm.count && babyMovementForm.duration) {
          recordData = {
            count: parseInt(babyMovementForm.count),
            duration: parseInt(babyMovementForm.duration),
            notes: babyMovementForm.notes
          };
          isValid = true;
        }
        break;
      case 'weekly_update':
        if (weeklyUpdateForm.weight) {
          recordData = {
            weight: parseFloat(weeklyUpdateForm.weight),
            symptoms: weeklyUpdateForm.symptoms,
            mood: weeklyUpdateForm.mood,
            notes: weeklyUpdateForm.notes
          };
          isValid = true;
        }
        break;
    }

    if (!isValid) {
      alert('Please fill in all required fields');
      return;
    }

    const newRecord: HealthRecord = {
      id: Date.now().toString(),
      patientId: patient.id,
      date: new Date().toISOString(),
      type: recordType,
      data: recordData
    };

    const updatedRecords = [...healthRecords, newRecord];
    setHealthRecords(updatedRecords);

    // Update patient data in localStorage
    const updatedPatient = { ...patient, healthRecords: updatedRecords };
    localStorage.setItem('user', JSON.stringify(updatedPatient));

    // Update in registered users as well
    const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const userIndex = existingUsers.findIndex((u: any) => u.id === patient.id);
    if (userIndex !== -1) {
      existingUsers[userIndex] = { ...existingUsers[userIndex], healthRecords: updatedRecords };
      localStorage.setItem('registeredUsers', JSON.stringify(existingUsers));
    }

    // Notify Dr. Rajesh
    await notifyDoctor(newRecord);

    // Reset forms and close modal
    setBloodPressureForm({ systolic: '', diastolic: '', heartRate: '', notes: '' });
    setSugarLevelForm({ level: '', testType: 'fasting', notes: '' });
    setBabyMovementForm({ count: '', duration: '', notes: '' });
    setWeeklyUpdateForm({ weight: '', symptoms: [], mood: 5, notes: '' });
    setShowAddRecord(false);
  };

  const calculateWeeksRemaining = () => {
    if (!patient.dueDate) return 0;
    const due = new Date(patient.dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    return Math.max(0, diffWeeks);
  };

  const getLatestRecord = (type: string) => {
    return healthRecords
      .filter(record => record.type === type)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Pregnancy Progress */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Pregnancy Progress</h3>
            <p className="text-pink-100">Week {patient.currentWeek || 0} of 40</p>
          </div>
          <Baby className="w-12 h-12 text-pink-200" />
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span>{Math.round(((patient.currentWeek || 0) / 40) * 100)}%</span>
          </div>
          <div className="w-full bg-pink-400 rounded-full h-3">
            <div 
              className="bg-white h-3 rounded-full transition-all duration-300"
              style={{ width: `${((patient.currentWeek || 0) / 40) * 100}%` }}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-pink-200">Due Date</p>
            <p className="font-medium">{patient.dueDate ? new Date(patient.dueDate).toLocaleDateString() : 'Not set'}</p>
          </div>
          <div>
            <p className="text-pink-200">Weeks Remaining</p>
            <p className="font-medium">{calculateWeeksRemaining()} weeks</p>
          </div>
        </div>
      </div>

      {/* Doctor Information */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Your Doctor</h3>
            <p className="text-gray-600">Dr. Rajesh - Gynecologist</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center space-x-2">
            <MessageSquare className="w-4 h-4" />
            <span>Message</span>
          </button>
          <button className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center space-x-2">
            <Phone className="w-4 h-4" />
            <span>Call</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Blood Pressure</p>
              <p className="text-lg font-semibold text-gray-800">
                {(() => {
                  const latest = getLatestRecord('blood_pressure');
                  return latest ? `${(latest.data as BloodPressureData).systolic}/${(latest.data as BloodPressureData).diastolic}` : 'No data';
                })()}
              </p>
            </div>
            <Activity className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sugar Level</p>
              <p className="text-lg font-semibold text-gray-800">
                {(() => {
                  const latest = getLatestRecord('sugar_level');
                  return latest ? `${(latest.data as SugarLevelData).level} mg/dL` : 'No data';
                })()}
              </p>
            </div>
            <Droplets className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Baby Movements</p>
              <p className="text-lg font-semibold text-gray-800">
                {(() => {
                  const latest = getLatestRecord('baby_movement');
                  return latest ? `${(latest.data as BabyMovementData).count} today` : 'No data';
                })()}
              </p>
            </div>
            <Heart className="w-8 h-8 text-pink-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Weight</p>
              <p className="text-lg font-semibold text-gray-800">
                {(() => {
                  const latest = getLatestRecord('weekly_update');
                  return latest ? `${(latest.data as WeeklyUpdateData).weight} kg` : 'No data';
                })()}
              </p>
            </div>
            <Scale className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Recent Records */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Recent Health Records</h3>
          <button
            onClick={() => setActiveTab('records')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View all
          </button>
        </div>
        
        {healthRecords.length > 0 ? (
          <div className="space-y-3">
            {healthRecords
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 3)
              .map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      record.type === 'blood_pressure' ? 'bg-red-500' :
                      record.type === 'sugar_level' ? 'bg-blue-500' :
                      record.type === 'baby_movement' ? 'bg-pink-500' : 'bg-green-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {record.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(record.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No health records yet. Start tracking your health!</p>
        )}
      </div>
    </div>
  );

  const renderRecords = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Health Records</h2>
        <button
          onClick={() => setShowAddRecord(true)}
          className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Record</span>
        </button>
      </div>

      {healthRecords.length > 0 ? (
        <div className="grid gap-4">
          {healthRecords
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((record) => (
              <div key={record.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      record.type === 'blood_pressure' ? 'bg-red-500' :
                      record.type === 'sugar_level' ? 'bg-blue-500' :
                      record.type === 'baby_movement' ? 'bg-pink-500' : 'bg-green-500'
                    }`} />
                    <h3 className="text-lg font-medium text-gray-800">
                      {record.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h3>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(record.date).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {record.type === 'blood_pressure' && (
                    <>
                      <div>
                        <p className="text-xs text-gray-600">Systolic</p>
                        <p className="font-medium">{(record.data as BloodPressureData).systolic} mmHg</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Diastolic</p>
                        <p className="font-medium">{(record.data as BloodPressureData).diastolic} mmHg</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Heart Rate</p>
                        <p className="font-medium">{(record.data as BloodPressureData).heartRate} bpm</p>
                      </div>
                    </>
                  )}
                  
                  {record.type === 'sugar_level' && (
                    <>
                      <div>
                        <p className="text-xs text-gray-600">Level</p>
                        <p className="font-medium">{(record.data as SugarLevelData).level} mg/dL</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Test Type</p>
                        <p className="font-medium capitalize">{(record.data as SugarLevelData).testType.replace('_', ' ')}</p>
                      </div>
                    </>
                  )}
                  
                  {record.type === 'baby_movement' && (
                    <>
                      <div>
                        <p className="text-xs text-gray-600">Count</p>
                        <p className="font-medium">{(record.data as BabyMovementData).count} movements</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Duration</p>
                        <p className="font-medium">{(record.data as BabyMovementData).duration} minutes</p>
                      </div>
                    </>
                  )}
                  
                  {record.type === 'weekly_update' && (
                    <>
                      <div>
                        <p className="text-xs text-gray-600">Weight</p>
                        <p className="font-medium">{(record.data as WeeklyUpdateData).weight} kg</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Mood</p>
                        <p className="font-medium">{(record.data as WeeklyUpdateData).mood}/10</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Symptoms</p>
                        <p className="font-medium">{(record.data as WeeklyUpdateData).symptoms.join(', ') || 'None'}</p>
                      </div>
                    </>
                  )}
                </div>
                
                {record.data.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-600 mb-1">Notes</p>
                    <p className="text-sm text-gray-800">{record.data.notes}</p>
                  </div>
                )}
              </div>
            ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Health Records Yet</h3>
          <p className="text-gray-600 mb-4">Start tracking your health by adding your first record</p>
          <button
            onClick={() => setShowAddRecord(true)}
            className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-lg font-medium"
          >
            Add Your First Record
          </button>
        </div>
      )}
    </div>
  );

  const renderAddRecordModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Add Health Record</h2>
            <button
              onClick={() => setShowAddRecord(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ×
            </button>
          </div>

          {/* Record Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Record Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setRecordType('blood_pressure')}
                className={`p-3 rounded-lg border-2 text-sm font-medium ${
                  recordType === 'blood_pressure'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                Blood Pressure
              </button>
              <button
                onClick={() => setRecordType('sugar_level')}
                className={`p-3 rounded-lg border-2 text-sm font-medium ${
                  recordType === 'sugar_level'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                Sugar Level
              </button>
              <button
                onClick={() => setRecordType('baby_movement')}
                className={`p-3 rounded-lg border-2 text-sm font-medium ${
                  recordType === 'baby_movement'
                    ? 'border-pink-500 bg-pink-50 text-pink-700'
                    : 'border-gray-200 hover:border-pink-300'
                }`}
              >
                Baby Movement
              </button>
              <button
                onClick={() => setRecordType('weekly_update')}
                className={`p-3 rounded-lg border-2 text-sm font-medium ${
                  recordType === 'weekly_update'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                Weekly Update
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {recordType === 'blood_pressure' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Systolic</label>
                    <input
                      type="number"
                      value={bloodPressureForm.systolic}
                      onChange={(e) => setBloodPressureForm({...bloodPressureForm, systolic: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="120"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Diastolic</label>
                    <input
                      type="number"
                      value={bloodPressureForm.diastolic}
                      onChange={(e) => setBloodPressureForm({...bloodPressureForm, diastolic: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="80"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heart Rate (bpm)</label>
                  <input
                    type="number"
                    value={bloodPressureForm.heartRate}
                    onChange={(e) => setBloodPressureForm({...bloodPressureForm, heartRate: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="72"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                  <textarea
                    value={bloodPressureForm.notes}
                    onChange={(e) => setBloodPressureForm({...bloodPressureForm, notes: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={2}
                    placeholder="Any additional notes..."
                  />
                </div>
              </>
            )}

            {recordType === 'sugar_level' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sugar Level (mg/dL)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={sugarLevelForm.level}
                    onChange={(e) => setSugarLevelForm({...sugarLevelForm, level: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Test Type</label>
                  <select
                    value={sugarLevelForm.testType}
                    onChange={(e) => setSugarLevelForm({...sugarLevelForm, testType: e.target.value as any})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="fasting">Fasting</option>
                    <option value="random">Random</option>
                    <option value="post_meal">Post Meal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                  <textarea
                    value={sugarLevelForm.notes}
                    onChange={(e) => setSugarLevelForm({...sugarLevelForm, notes: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Any additional notes..."
                  />
                </div>
              </>
            )}

            {recordType === 'baby_movement' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Movement Count</label>
                  <input
                    type="number"
                    value={babyMovementForm.count}
                    onChange={(e) => setBabyMovementForm({...babyMovementForm, count: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    value={babyMovementForm.duration}
                    onChange={(e) => setBabyMovementForm({...babyMovementForm, duration: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                  <textarea
                    value={babyMovementForm.notes}
                    onChange={(e) => setBabyMovementForm({...babyMovementForm, notes: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    rows={2}
                    placeholder="Any additional notes..."
                  />
                </div>
              </>
            )}

            {recordType === 'weekly_update' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weeklyUpdateForm.weight}
                    onChange={(e) => setWeeklyUpdateForm({...weeklyUpdateForm, weight: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="65.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mood (1-10)</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={weeklyUpdateForm.mood}
                    onChange={(e) => setWeeklyUpdateForm({...weeklyUpdateForm, mood: parseInt(e.target.value)})}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Poor</span>
                    <span className="font-medium">{weeklyUpdateForm.mood}</span>
                    <span>Excellent</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                  <textarea
                    value={weeklyUpdateForm.notes}
                    onChange={(e) => setWeeklyUpdateForm({...weeklyUpdateForm, notes: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    placeholder="How are you feeling? Any symptoms or concerns?"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => setShowAddRecord(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddRecord}
              className="flex-1 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium"
            >
              Save Record
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'records':
        return renderRecords();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Welcome back, {patient.name}
          </h1>
          <p className="text-gray-600">
            Track your pregnancy journey and stay connected with your healthcare team
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl p-1 shadow-sm border border-gray-100 mb-6">
          <nav className="flex space-x-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-pink-500 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'records'
                  ? 'bg-pink-500 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Health Records
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'appointments'
                  ? 'bg-pink-500 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Appointments
            </button>
            <button
              onClick={() => setActiveTab('education')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'education'
                  ? 'bg-pink-500 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Education
            </button>
          </nav>
        </div>

        {renderContent()}
      </div>

      {/* Add Record Modal */}
      {showAddRecord && renderAddRecordModal()}
    </div>
  );
};

export default PatientDashboard;