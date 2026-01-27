import React from "react";

import FullCalendar from "@fullcalendar/react";

import dayGridPlugin from "@fullcalendar/daygrid";

import timeGridPlugin from "@fullcalendar/timegrid";

import interactionPlugin, { Draggable } from "@fullcalendar/interaction";

import * as bootstrap from "bootstrap";

import "bootstrap/dist/css/bootstrap.min.css";

import "./index.css";

function Calendar() {
  //Event setting

  //details inside

  const events = [
    {
      title: "The title",

      start: "2026-01-04T08:00:00",

      end: "2026-01-04T010:00:00",
    },
  ];

  return (
    <>
      <div>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={"dayGridMonth"}
          headerToolbar={{
            start: "dayGridMonth, timeGridWeek, timeGridDay", // will normally be on the left. if RTL, will be on the right

            center: "title",

            end: "today prev,next", // will normally be on the right. if RTL, will be on the left
          }}
          // height={"90vh"}
          events={events}
          eventDidMount={(info) => {
            return new bootstrap.Popover(info.el, {
              title: info.event.title,

              placement: "auto",

              trigger: "hover",

              customClass: "popoverStyle",

              content:
                "<p>Please subscribe <strong>Bootstrap popover</strong>.</p>",

              html: true,
            });
          }}
        />
      </div>
    </>
  );
}

export default Calendar;
