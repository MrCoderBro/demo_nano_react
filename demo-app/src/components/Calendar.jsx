import React from "react";

function Calendar() {
  return (
    <div>
      <FullCalendar
        initialView="dayGridMonth"
        plugins={[dayGridPlugin, interactionPlugin, timegridPlugin]}
        headerToolbar={{
          start: "dayGridMonth,timeGridWeek,timeGridDay",
          center: "title",
          end: "prev,next today",
        }}
        editable={true}
      />
    </div>
  );
}

export default Calendar;
