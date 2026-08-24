# Presence Guardian

Build a new feature inside my existing project "Nirikshan – Smart Inspection Platform". Do NOT redesign the entire application. Match the existing UI, colors, components and navigation.

Create two new modules:

====================================================

MODULE 1 – Staff Attendance Verification

====================================================

Purpose:

Reduce proxy and false attendance by verifying staff presence using multiple validation layers.

Features:

• Secure Login (Supabase Auth)

• Daily Check-In

• Daily Check-Out

• GPS Location Capture

• Timestamp Recording

• Face Verification placeholder (camera capture)

• Random Verification requests during working hours

• Attendance History

• Working Hours Calculation

Attendance Status Logic:

🟢 Verified

- Check-in completed

- Check-out completed

- GPS valid

- Random verification passed

🟡 Requires Review

- Late check-in

- GPS mismatch

- Missing random verification

- Long inactive duration

🔴 Inspection Priority

- Multiple failed verifications

- Repeated GPS mismatch

- Proxy attendance suspicion

- Missing checkout multiple times

Dashboard Cards:

Total Employees

Present Today

Requires Review

Inspection Priority

Add charts showing:

• Daily Attendance

• Verification Success

• Attendance Trends

====================================================

MODULE 2 – Activity Verification

====================================================

Purpose:

Digitally verify whether government activities have actually been conducted.

Features:

• Start Inspection

• Select Activity

• Capture Photos

• Record Video

• GPS Auto Capture

• Timestamp Auto Capture

• Responsible Staff Selection

• Beneficiary Count

• Notes

• Submit Inspection

Inspection Status:

🟢 Completed

🟡 Partially Completed

🔴 Not Verified

Inspection Timeline:

Created

Evidence Captured

Submitted

Verified

Inspection Details Page:

Activity Name

Department

Officer

Location

Date

Time

Evidence Gallery

Beneficiary Count

Remarks

Status Badge

====================================================

ADMIN DASHBOARD

====================================================

Show:

Attendance Analytics

Activity Analytics

Employees requiring review

Activities not verified

Inspection Priority List

Recent Attendance Logs

Recent Activity Logs

Charts using Recharts.

====================================================

DATABASE (SUPABASE)

====================================================

Create tables:

employees

attendance

attendance_verifications

activities

activity_evidence

inspections

beneficiaries

profiles

Use Row Level Security.

====================================================

DESIGN

====================================================

Keep the existing design.

Use:

- React

- Next.js

- TypeScript

- Tailwind

- shadcn/ui

- Framer Motion

- Lucide Icons

- Responsive Design

- Dark Mode Support

Maintain a premium government dashboard aesthetic with clean cards, subtle animations, and professional UI. Do not generate placeholder pages—implement complete working screens with realistic sample data and Supabase-ready integration.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ac5ab6d2-b114-4d7e-94cc-027852cb51fd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
