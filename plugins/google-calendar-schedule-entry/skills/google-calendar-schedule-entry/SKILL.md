---
name: "google-calendar-schedule-entry"
description: "Add course schedules, homework or exam deadlines, and other due dates (e.g. vehicle inspection) to SeanYeh's Google Calendar following his Deadline-calendar and per-week class rules."
---

# Google Calendar schedule entry

Use this whenever the user shares a course schedule, syllabus table, assignment notice, exam date or any other due date (screenshot or text) and wants it on the calendar.

## Calendars

- Primary calendar: the user's primary calendar (calendar id `primary`). Holds classes, exams, oral reports, demos and other timed events.
- Deadline calendar: 「葉修安 Deadline」. Holds every submission or due-date item (homework, report uploads, registrations, vehicle inspection, and so on). Find its id by name with list_calendars before creating events.
- Time zone is Asia/Taipei.

## Step 1: Check before creating

1. Search both calendars for the course or item over the whole relevant range (list_events with fullText on the course name and on keywords such as HW, Exam, 考, the item name).
2. Find the course's recurring class event on the primary calendar (its weekly time and default location).
3. Never recreate something that already exists. Report what was already there and skip it.

## Step 2: Deadlines go on the Deadline calendar as two all-day events

For each due-date item create exactly two all-day events on the Deadline calendar, both with availability FREE:

| Event | Span | Reminders |
|---|---|---|
| `<name> 期間` | release date through due date (all-day, end = day after due date) | none (useDefaultReminders false, no overrides) |
| `<name> 截止 HH:MM` | the due date only | calendar default reminders |

- Title time is the real due time: `截止 23:59` by default, `截止 12:00` for noon deadlines, and so on.
- `<name>` starts with a short course or subject prefix, e.g. 作業系統 HW01, 網程 1st Project Review 簡報, 淨零 創意點子期中版, 機車 038-MJX 定檢.
- Description: what it is, release date, due date and time, submission method and file format or naming rules, penalties if stated.
- Never represent a deadline as a single timed event.
- If the release date is not given, choose a sensible start (first class of the term, the end of the previous stage, or the day the notice was received) and say in the description how it was chosen.
- If the wording is ambiguous (e.g. 「11/09 前」), pick the earlier interpretation, note it in the description, and mention it in the reply.
- All-day date handling: the API may shift an all-day date one day early when given a +08:00 midnight. Pass dates as `YYYY-MM-DDT00:00:00Z` with allDay true, and check the returned start.date; fix it immediately if it is off.

## Step 3: Classes are edited in place, not duplicated

When the course already has a weekly recurring event, update each week's instance (instance id `<recurringEventId>_<YYYYMMDD>T<HHMMSS>Z` in UTC) instead of creating new events.

- Description format:
  ```
  週X N-M 節
  Week n：<lecture topic, keep both Chinese and English titles and chapter>
  <notes: Quiz, Video, no class, HW due, etc.>
  ```
- Location: change the instance location when the schedule says that week is in a different room. For asynchronous or online weeks write `E3 非同步` or `Online`.
- Title tag: for weeks with an exam, quiz, oral report, project review, demo or asynchronous class, append the tag in full-width parentheses, e.g. `作業系統概論（Quiz）`, `淨零排放與實務（期中口頭報告 1）`, `機器學習概論與實作（E3 非同步）`.
- If the schedule has an extra recurring session with no event yet (e.g. a Friday online or video slot), create one recurring event with RRULE and EXDATE for the weeks the schedule says have no class.
- Fill in every week of the term, past weeks included, when the user asks for the whole schedule.

## Step 4: Exams and major presentations

- Use reminders of 1 week and 1 day before (popup 10080 and 1440 minutes).
- If the exam time is not announced, use the class time slot and add 「時間地點依上課時段，實際以老師公告為準」 to the description.
- If the class instance for that day exists, mark it there; if a separate exam event was already created earlier, keep it rather than duplicating.

## Step 5: Items without a date

Do not create events for homework or assignments whose due date is not published (e.g. HW02, Ass. 1). Note 「截止日未公布」 in the relevant week's class description and tell the user to send the date later.

## Reply to the user

In Traditional Chinese, short:
- what was added to the Deadline calendar,
- what was added or changed on the primary calendar,
- what was skipped because it already existed,
- any assumption made (inferred start dates, ambiguous due dates, guessed exam times) and anything left out because it has no date.
Offer one useful next step only if there is a real one (e.g. an extra early reminder before a hard real-world deadline).