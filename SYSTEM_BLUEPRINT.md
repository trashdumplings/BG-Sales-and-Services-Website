# BG Services Internal Operations Platform

## Purpose

This project should evolve from a public-facing website plus basic role-based portal into a unified internal operations platform for BG Services.

The target product is a web application that supports:

- employee management
- authentication and role-based access
- leave management
- inventory and asset management
- daily work logs
- reporting and auditability
- operational administration

The current codebase already provides a usable foundation:

- React frontend with authentication-aware routing
- FastAPI backend with PostgreSQL
- Dockerized local environment
- seeded roles for `superadmin`, `admin`, `hr`, and `employee`

## Product Vision

The end product should act as one system with multiple role-aware modules rather than separate disconnected tools.

The system should support:

- employees managing their own leave, work logs, and assigned assets
- HR managing employee records and leave workflows
- admins managing inventory, users, and reporting
- superadmins managing system configuration, audit visibility, and platform governance

## Core Business Modules

### 1. Identity and Access

This module controls who can log in and what they can do.

Primary responsibilities:

- login, logout, token refresh
- role-based routing
- user registration or controlled user creation
- permission enforcement
- session handling

Core roles:

- `superadmin`
- `admin`
- `hr`
- `manager`
- `employee`

Recommended near-term note:

The current codebase supports `superadmin`, `admin`, `hr`, and `employee`. A `manager` role should be added in a future iteration to support approval-based workflows for leave and work logs.

### 2. EMS

EMS here means Employee Management System.

Primary responsibilities:

- employee profile records
- department assignment
- position and employment status
- reporting hierarchy
- contact and emergency information
- employment dates
- attendance summary

Target outcomes:

- one canonical employee record per staff member
- employee-to-user linkage for self-service workflows
- manager hierarchy to drive approvals and team dashboards

### 3. Leave Management

Primary responsibilities:

- leave request submission
- approval and rejection workflow
- leave balances
- leave history
- role-based visibility
- policy-driven leave types

Target workflow:

1. employee submits leave request
2. manager or HR reviews request
3. approval or rejection is recorded
4. employee is notified
5. dashboard and reports reflect the current state

### 4. Inventory and Asset Management

Primary responsibilities:

- inventory catalog
- stock tracking
- low-stock alerts
- item adjustments
- asset assignment to employees
- item status lifecycle

Target outcomes:

- clear distinction between stock inventory and assigned employee assets
- traceability for who holds what asset
- low-stock and out-of-stock notification flows

### 5. Daily Work Logs

Primary responsibilities:

- daily update submission
- project/task association
- hours spent
- blockers
- manager review and comments
- reporting by employee, project, and time period

Target workflow:

1. employee creates daily work log
2. manager reviews if required
3. work logs feed dashboards and reports

### 6. Reporting and Analytics

Primary responsibilities:

- operational reports
- downloadable CSV/PDF
- role-based dashboards
- trend summaries

Initial report families:

- employee reports
- leave reports
- inventory reports
- work log reports
- attendance summaries

### 7. Administration and Audit

Primary responsibilities:

- system settings
- admin user management
- audit logging
- notification configuration
- security and policy controls

## User Roles and Responsibilities

### Superadmin

Full platform control.

Capabilities:

- manage admins and roles
- view all modules and all reports
- view audit logs
- manage system settings
- oversee platform health and configuration

### Admin

Operational administrator.

Capabilities:

- manage users
- manage inventory
- manage employee records
- access reports
- support day-to-day system administration

### HR

People operations role.

Capabilities:

- create and manage employee records
- review and approve leave
- view employee-related reports
- oversee attendance and workforce data

### Manager

Recommended future role.

Capabilities:

- review team leave requests
- review team work logs
- monitor direct reports

### Employee

Self-service user.

Capabilities:

- log in
- view own profile
- submit leave requests
- view leave balance and history
- submit daily work logs
- view assigned assets

## Target Information Architecture

Recommended top-level application navigation:

- Overview
- Employees
- Leave
- Inventory
- Work Logs
- Reports
- Admin

Role-based menu visibility:

- `employee`: Overview, My Profile, My Leave, My Work Logs, My Assets
- `manager`: Overview, Team Leave, Team Work Logs, Reports
- `hr`: Overview, Employees, Leave, Reports
- `admin`: Overview, Employees, Inventory, Reports, Admin
- `superadmin`: Overview, Employees, Leave, Inventory, Work Logs, Reports, Admin, Settings, Audit

## Target Dashboards

### Superadmin Dashboard

- system health summary
- active users summary
- pending approvals
- low-stock alerts
- recent audit activity
- quick access to settings and reports

### Admin Dashboard

- employee count
- inventory alerts
- pending operational tasks
- report shortcuts

### HR Dashboard

- employees on leave today
- pending leave approvals
- attendance summary
- employee onboarding/offboarding summary

### Employee Dashboard

- leave balance
- pending leave requests
- today’s work log status
- assigned assets
- announcements

## Target Data Model

### Existing Core Tables

Already present in the backend:

- `users`
- `superadmins`
- `employees`
- `departments`
- `projects`
- `project_assignments`
- `attendances`
- `leave_requests`
- `inventory_items`
- `notifications`
- `audit_logs`
- `system_settings`

### Recommended New Tables

Needed for the planned product:

- `inventory_assignments`
- `inventory_transactions`
- `work_logs`
- `work_log_comments`
- `work_log_attachments`
- `holidays`
- `leave_policies`
- `employee_documents`
- `announcements`
- `teams` or `reporting_lines`

### Recommended Key Relationships

- `users` 1:1 `employees` for staff users
- `employees` many:1 `departments`
- `employees` many:1 `manager employee`
- `employees` many:many `projects` via `project_assignments`
- `employees` 1:many `leave_requests`
- `employees` 1:many `work_logs`
- `employees` 1:many `inventory_assignments`
- `users` 1:many `notifications`
- `users` 1:many `audit_logs`

## Target Backend Architecture

The current backend is a single FastAPI application in [server/main.py](c:/Users/hp/Desktop/bgsale_website/server/main.py). That is acceptable for MVP delivery, but the code should be modularized.

Recommended backend structure:

- `server/modules/auth`
- `server/modules/employees`
- `server/modules/leave`
- `server/modules/inventory`
- `server/modules/worklogs`
- `server/modules/reports`
- `server/modules/admin`
- `server/db`
- `server/models`
- `server/schemas`
- `server/services`

Recommended internal layering:

- routes
- schemas
- domain services
- persistence/model layer
- notification/audit utilities

## Target Frontend Architecture

The current frontend has route-level role gating and placeholder dashboards. It should evolve into a module-based application.

Recommended frontend structure:

- `src/pages/auth`
- `src/pages/dashboard`
- `src/pages/employees`
- `src/pages/leave`
- `src/pages/inventory`
- `src/pages/worklogs`
- `src/pages/reports`
- `src/pages/admin`
- `src/components/layout`
- `src/components/forms`
- `src/components/tables`
- `src/components/widgets`
- `src/hooks`
- `src/services`

Recommended frontend patterns:

- role-aware sidebar
- route guards by role and permission
- reusable table and form components
- module dashboards
- API service layer separated from view components

## Notifications Strategy

The current backend already contains email scheduling hooks and a `notifications` model. This should become a unified notification layer.

Notification channels:

- in-app notifications
- email notifications

Events that should notify users:

- leave request submitted
- leave request approved/rejected
- low stock inventory alert
- asset assigned or returned
- work log review requested
- system announcements

## Audit Strategy

Every privileged or workflow-significant action should create an audit event.

Examples:

- login/logout
- user creation and role changes
- employee record updates
- leave approval/rejection
- inventory stock changes
- asset assignment and return
- settings changes

## Reports Strategy

Reports should start simple and expand gradually.

Recommended MVP reports:

- employees by department and status
- leave requests by status/date/type
- inventory status and low-stock report
- work logs by employee/date/project

Export formats:

- CSV first
- PDF second

## Delivery Phases

### Phase 1. Stabilize Foundation

- finalize auth and role flows
- improve dashboard shell and navigation
- modularize backend structure
- ensure audit and notification utilities are reusable

### Phase 2. Complete Leave Management

- frontend leave flows
- approval UI
- leave balances
- leave history
- dashboard widgets

### Phase 3. Complete Inventory

- full inventory UI
- adjustments
- asset assignment
- low stock dashboard/reporting

### Phase 4. Add Daily Work Logs

- data model
- CRUD APIs
- employee submission UI
- manager review UI
- reporting

### Phase 5. Expand EMS

- richer employee profile model
- manager hierarchy
- attendance improvements
- documents and onboarding/offboarding data

### Phase 6. Reporting and Admin Polish

- advanced reports
- settings UI
- notifications center
- superadmin operational console

## MVP Recommendation

The strongest MVP for this project is:

- secure login and role-based dashboards
- employee management
- leave management
- inventory management
- daily work logs
- audit logging
- basic reports

This is a meaningful and deployable internal operations platform without overextending into payroll or highly specialized HR functions too early.

## Success Criteria

The system can be considered product-ready for internal MVP use when:

- each role can log in and access only relevant modules
- employees can submit leave and work logs
- HR/Admin can manage employees and review leave
- inventory is tracked and visible
- reports reflect real operational data
- admin actions are auditable
- the system runs consistently via Docker in local and staging environments
