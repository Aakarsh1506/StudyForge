import { useState, useEffect } from "react";

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

const today = new Date();

export default function TimetableSection() {
  const [lectures, setLectures] = useState(() =>
    JSON.parse(localStorage.getItem("sf-timetable") || "[]")
  );

  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    subject: "",
    day: dayNames[today.getDay()],
    startTime: "",
    endTime: "",
    lecturer: ""
  });

  useEffect(() => {
    localStorage.setItem(
      "sf-timetable",
      JSON.stringify(lectures)
    );
  }, [lectures]);

  const addEvent = () => {
    if (
      !formData.subject ||
      !formData.startTime ||
      !formData.endTime
    ) {
      alert("Please fill all required fields");
      return;
    }

    setLectures([
      ...lectures,
      {
        id: Date.now(),
        ...formData
      }
    ]);

    setFormData({
      subject: "",
      day: dayNames[today.getDay()],
      startTime: "",
      endTime: "",
      lecturer: ""
    });

    setShowModal(false);
  };

  const deleteEvent = (id) => {
    setLectures(
      lectures.filter((lecture) => lecture.id !== id)
    );
  };

  const todaysLectures = lectures.filter(
    (lecture) =>
      lecture.day === dayNames[today.getDay()]
  );

  return (
    <section className="db-panel db-panel--left">
      <div className="db-panel__header">
        <div className="db-date-badge">
          <span className="db-date-badge__day">
            {dayNames[today.getDay()]}
          </span>

          <span className="db-date-badge__date">
            {today.toLocaleDateString()}
          </span>
        </div>
      </div>

      {todaysLectures.length === 0 ? (
        <div
          className="db-empty"
          onClick={() => setShowModal(true)}
          style={{ cursor: "pointer" }}
        >
          <div className="db-empty__icon">+</div>

          <p className="db-empty__text">
            Add your timetable
          </p>
        </div>
      ) : (
        <>
          <div className="db-lectures">
            {todaysLectures.map((lecture) => (
              <div
                key={lecture.id}
                className="db-lecture-card"
              >
                <div className="db-lecture-card__time">
                  {lecture.startTime} - {lecture.endTime}
                </div>

                <div className="db-lecture-card__subject">
                  {lecture.subject}
                </div>

                {lecture.lecturer && (
                  <div className="db-lecture-card__lecturer">
                    {lecture.lecturer}
                  </div>
                )}

                <button
                  className="db-delete-event"
                  onClick={() =>
                    deleteEvent(lecture.id)
                  }
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <button
            className="db-add-btn"
            onClick={() => setShowModal(true)}
          >
            <span className="db-add-btn__icon">
              +
            </span>
            Add Event
          </button>
        </>
      )}

      {showModal && (
        <div className="db-modal-overlay">
          <div className="db-modal">
            <h3>Add Event</h3>

            <input
              type="text"
              placeholder="Subject"
              value={formData.subject}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  subject: e.target.value
                })
              }
            />

            <select
              value={formData.day}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  day: e.target.value
                })
              }
            >
              {dayNames.map((day) => (
                <option
                  key={day}
                  value={day}
                >
                  {day}
                </option>
              ))}
            </select>

            <input
              type="time"
              value={formData.startTime}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  startTime: e.target.value
                })
              }
            />

            <input
              type="time"
              value={formData.endTime}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  endTime: e.target.value
                })
              }
            />

            <input
              type="text"
              placeholder="Faculty (Optional)"
              value={formData.lecturer}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  lecturer: e.target.value
                })
              }
            />

            <div className="db-modal-actions">
              <button onClick={addEvent}>
                Save
              </button>

              <button
                onClick={() =>
                  setShowModal(false)
                }
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}