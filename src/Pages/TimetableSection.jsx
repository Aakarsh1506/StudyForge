import { useState, useEffect } from "react";
import axios from "axios";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const today = new Date();

export default function TimetableSection({ userId }) {
  const [lectures, setLectures] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // NEW: Spinner state
  const [formData, setFormData] = useState({
    subject: "",
    day: dayNames[today.getDay()],
    startTime: "",
    endTime: "",
    lecturer: ""
  });

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/timetable`, {
        withCredentials: true,
      });
      setLectures(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addEvent = async () => {
    if (!formData.subject || !formData.startTime || !formData.endTime) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/timetable`, formData, {
        withCredentials: true,
      });

      setLectures([...lectures, res.data]);
      setFormData({
        subject: "",
        day: dayNames[today.getDay()],
        startTime: "",
        endTime: "",
        lecturer: ""
      });
      setShowModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteEvent = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/timetable/${id}`, {
        withCredentials: true,
      });
      setLectures(lectures.filter((lecture) => lecture.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const clearAllTimetable = async () => {
    const confirmReset = window.confirm(
      "Are you sure you want to completely erase your timetable? This will wipe your current schedule from existence."
    );
    if (!confirmReset) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/timetable/clear-all`, {
        withCredentials: true,
      });
      setLectures([]);
      alert("Current schedule erased from existence!");
    } catch (err) {
      console.error("Failed to clear timetable:", err);
      alert(err.response?.data?.message || "Failed to clear the database schedule layout.");
    }
  };

  const uploadPDF = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsProcessing(true); // START SPINNER
    const data = new FormData();
    data.append("file", file);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/timetable/upload`, data, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" }
      });
      fetchTimetable();
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to process timetable. Please try a cleaner/standard PDF.");
    } finally {
      setIsProcessing(false); // STOP SPINNER
    }
  };

  const todaysLectures = lectures.filter(
    (lecture) => lecture.day === dayNames[today.getDay()]
  );

  return (
    <section className="db-panel db-panel--left">
      <div className="db-panel__header">
        <div className="db-date-badge">
          <span className="db-date-badge__day">{dayNames[today.getDay()]}</span>
          <span className="db-date-badge__date">{today.toLocaleDateString()}</span>
        </div>
      </div>

      {todaysLectures.length === 0 ? (
        <div className="db-empty">
          <p className="db-empty__text">
            {isProcessing ? "AI is processing your timetable..." : "Your timetable is empty for today."}
          </p>
        </div>
      ) : (
        <div className="db-lectures">
          {todaysLectures.map((lecture) => (
            <div key={lecture.id} className="db-lecture-card">
              <div className="db-lecture-card__time">
                {lecture.startTime} - {lecture.endTime}
              </div>
              <div className="db-lecture-card__subject">{lecture.subject}</div>
              {lecture.lecturer && (
                <div className="db-lecture-card__lecturer">{lecture.lecturer}</div>
              )}
              <button className="db-delete-event" onClick={() => deleteEvent(lecture.id)}>×</button>
            </div>
          ))}
        </div>
      )}

      <div className="db-actions-toolbar" style={{ display: "flex", gap: "10px", marginTop: "15px", flexWrap: "wrap" }}>
        {isProcessing ? (
          <button className="db-add-btn" disabled style={{ opacity: 0.7, cursor: 'wait' }}>
            Processing AI...
          </button>
        ) : (
          <label className="db-add-btn" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center" }}>
            Upload Timetable PDF
            <input type="file" accept="application/pdf" onChange={uploadPDF} style={{ display: "none" }} />
          </label>
        )}

        <button className="db-add-btn" onClick={() => setShowModal(true)}>
          Add Extra Event
        </button>

        {lectures.length > 0 && (
          <button 
            className="db-add-btn" 
            onClick={clearAllTimetable} 
            style={{ backgroundColor: "transparent", borderColor: "#ef4444", color: "#ef4444" }}
          >
            Reset Timetable
          </button>
        )}
      </div>

      {showModal && (
        <div className="db-modal-overlay">
          <div className="db-modal">
            <h3>Add Event</h3>
            <input type="text" placeholder="Subject" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} />
            <select value={formData.day} onChange={(e) => setFormData({ ...formData, day: e.target.value })}>
              {dayNames.map((day) => <option key={day} value={day}>{day}</option>)}
            </select>
            <input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} />
            <input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} />
            <input type="text" placeholder="Faculty (Optional)" value={formData.lecturer} onChange={(e) => setFormData({ ...formData, lecturer: e.target.value })} />
            <div className="db-modal-actions">
              <button onClick={addEvent}>Save</button>
              <button onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}