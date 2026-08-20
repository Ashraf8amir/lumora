# Sprint 11 — Advanced Authentication

> **Project:** Lumora
>
> **Sprint:** 11
>
> **Name:** Advanced Authentication
>
> **Status:** ⬜ Planned

---

# Goal

Deliver a complete, production-ready authentication and authorization layer
including JWT, refresh token rotation, OAuth2 social login, Redis blacklisting,
RBAC, and 2FA.

---

# Objectives

- Build auth module foundation and contracts
- Implement access JWT authentication
- Implement refresh token rotation and reuse detection
- Implement Redis token blacklisting for logout/session revocation
- Integrate Google OAuth2 authentication flow
- Implement RBAC (roles, permissions, and guards)
- Implement 2FA enrollment, verification, and recovery flows
- Harden and audit security-critical auth paths

---

# Issues

| ID      | Title                                  | Status |
| ------- | -------------------------------------- | ------ |
| LUM-024 | Setup Auth Module Foundation           | ⬜     |
| LUM-025 | Implement Access JWT Strategy          | ⬜     |
| LUM-026 | Implement Refresh Token Rotation       | ⬜     |
| LUM-027 | Integrate Redis Token Blacklisting     | ⬜     |
| LUM-028 | Integrate Google OAuth2 Login          | ⬜     |
| LUM-029 | Implement RBAC Roles and Permissions   | ⬜     |
| LUM-030 | Build RBAC Guards and Decorators       | ⬜     |
| LUM-031 | Implement 2FA Enrollment and Challenge | ⬜     |
| LUM-032 | Implement 2FA Recovery and Reset       | ⬜     |
| LUM-033 | Audit and Harden Auth Security Flows   | ⬜     |

---

# GitHub Issue Drafts

## LUM-024: Setup Auth Module Foundation

**Feature Name**  
Setup Auth Module Foundation

**Summary**  
Create the base authentication module structure, shared interfaces, DTOs, and
service contracts used by local auth, OAuth, token flows, and 2FA.

**Tasks**

- [ ] Create `AuthModule`, controller, and core service wiring
- [ ] Define auth DTOs and response contracts
- [ ] Add auth configuration schema and environment mapping
- [ ] Add initial integration points for users and redis services

**Acceptance Criteria**

- [ ] Auth module compiles and is bootstrapped in app module
- [ ] Contracts are reusable by all auth strategies
- [ ] Config validation covers required auth environment variables

**Pull Request**  
https://github.com/Ashraf8amir/lumora/pull/<PR_NUMBER>

**PR Title**  
feat(auth): setup auth module foundation (LUM-024)

**PR Description**

```md
## Summary

Set up the auth module foundation, shared contracts, and initial wiring.

---

## Changes

- Added AuthModule, controller, and service wiring
- Added auth DTOs and contracts
- Added auth config schema and env mapping
- Added initial integration points for users/redis services

---

## Why

This creates the base needed for JWT, refresh rotation, OAuth2, RBAC, and 2FA.

---

## Testing

- [ ] Build passes
- [ ] Lint passes
- [ ] Tests pass (if applicable)

---

## Checklist

- [ ] Code follows project conventions
- [ ] Documentation updated
- [ ] No breaking changes

---

Closes #<ISSUE_NUMBER>
```

---

## LUM-025: Implement Access JWT Strategy

**Feature Name**  
Implement Access JWT Strategy

**Summary**  
Implement JWT access token issuance and validation strategy, including auth
guard integration and authenticated user context extraction.

**Tasks**

- [ ] Implement JWT strategy and guard
- [ ] Generate signed access tokens on successful auth
- [ ] Add helper for token payload mapping
- [ ] Protect sample secured endpoint with JWT guard

**Acceptance Criteria**

- [ ] Valid access token authenticates protected routes
- [ ] Invalid/expired access token is rejected
- [ ] Authenticated request includes resolved user context

**Pull Request**  
https://github.com/Ashraf8amir/lumora/pull/<PR_NUMBER>

**PR Title**  
feat(auth): implement access JWT strategy (LUM-025)

**PR Description**

```md
## Summary

Implemented JWT access token issuance, validation, and guard integration.

---

## Changes

- Added JWT strategy and auth guard
- Added access token generation flow
- Added token payload mapping helper
- Protected secured endpoint using JWT guard

---

## Why

Access JWT is the core authentication mechanism for protected APIs.

---

## Testing

- [ ] Build passes
- [ ] Lint passes
- [ ] Tests pass (if applicable)

---

## Checklist

- [ ] Code follows project conventions
- [ ] Documentation updated
- [ ] No breaking changes

---

Closes #<ISSUE_NUMBER>
```

---

## LUM-026: Implement Refresh Token Rotation

**Feature Name**  
Implement Refresh Token Rotation

**Summary**  
Implement refresh token issuance, secure storage strategy, rotation on refresh,
and reuse-detection behavior for compromised token scenarios.

**Tasks**

- [ ] Add refresh token model/hash handling
- [ ] Implement refresh endpoint with token rotation
- [ ] Invalidate old token on successful rotation
- [ ] Add refresh token reuse-detection flow

**Acceptance Criteria**

- [ ] Every refresh returns a new refresh token pair
- [ ] Reusing an old token is detected and blocked
- [ ] Session is invalidated on detected token reuse

**Pull Request**  
https://github.com/Ashraf8amir/lumora/pull/<PR_NUMBER>

**PR Title**  
feat(auth): implement refresh token rotation (LUM-026)

**PR Description**

```md
## Summary

Implemented refresh token rotation with secure invalidation and reuse detection.

---

## Changes

- Added refresh token hash/storage handling
- Added refresh endpoint with rotation logic
- Invalidated old refresh token after rotation
- Added compromised-token reuse detection flow

---

## Why

Rotation reduces token replay risk and enables compromised session handling.

---

## Testing

- [ ] Build passes
- [ ] Lint passes
- [ ] Tests pass (if applicable)

---

## Checklist

- [ ] Code follows project conventions
- [ ] Documentation updated
- [ ] No breaking changes

---

Closes #<ISSUE_NUMBER>
```

---

## LUM-027: Integrate Redis Token Blacklisting

**Feature Name**  
Integrate Redis Token Blacklisting

**Summary**  
Integrate Redis-based blacklisting for access and refresh token revocation to
support logout, global sign-out, and compromised session shutdown.

**Tasks**

- [ ] Add redis-backed blacklist service
- [ ] Blacklist tokens on logout and forced revoke operations
- [ ] Check blacklist during token validation pipeline
- [ ] Set blacklist TTL based on token expiration

**Acceptance Criteria**

- [ ] Blacklisted tokens cannot access protected routes
- [ ] Logout revokes active token(s) immediately
- [ ] Blacklist entries expire automatically using TTL

**Pull Request**  
https://github.com/Ashraf8amir/lumora/pull/<PR_NUMBER>

**PR Title**  
feat(auth): integrate redis token blacklisting (LUM-027)

**PR Description**

```md
## Summary

Integrated Redis token blacklisting for token revocation and logout flows.

---

## Changes

- Added Redis-backed blacklist service
- Blacklisted tokens on logout/revocation
- Added blacklist checks to token validation path
- Added TTL alignment with token expiration

---

## Why

Blacklist support enables immediate token revocation and safer session control.

---

## Testing

- [ ] Build passes
- [ ] Lint passes
- [ ] Tests pass (if applicable)

---

## Checklist

- [ ] Code follows project conventions
- [ ] Documentation updated
- [ ] No breaking changes

---

Closes #<ISSUE_NUMBER>
```

---

## LUM-028: Integrate Google OAuth2 Login

**Feature Name**  
Integrate Google OAuth2 Login

**Summary**  
Add Google OAuth2 authentication flow for sign-in/sign-up with safe account
linking and token issuance compatible with existing auth architecture.

**Tasks**

- [ ] Configure Google OAuth2 strategy and callback route
- [ ] Map Google profile to local user model
- [ ] Implement account linking and first-login provisioning
- [ ] Return standard Lumora auth token response

**Acceptance Criteria**

- [ ] User can authenticate via Google OAuth2 callback flow
- [ ] Existing account linking works without duplicate users
- [ ] OAuth login returns valid access/refresh token pair

**Pull Request**  
https://github.com/Ashraf8amir/lumora/pull/<PR_NUMBER>

**PR Title**  
feat(auth): integrate Google OAuth2 login (LUM-028)

**PR Description**

```md
## Summary

Integrated Google OAuth2 sign-in/sign-up flow with account linking support.

---

## Changes

- Added Google OAuth2 strategy and callback endpoint
- Added profile mapping to local user model
- Added account linking/first-login provisioning flow
- Returned standard Lumora auth token response

---

## Why

OAuth2 login provides a secure social-auth option without duplicating users.

---

## Testing

- [ ] Build passes
- [ ] Lint passes
- [ ] Tests pass (if applicable)

---

## Checklist

- [ ] Code follows project conventions
- [ ] Documentation updated
- [ ] No breaking changes

---

Closes #<ISSUE_NUMBER>
```

---

## LUM-029: Implement RBAC Roles and Permissions

**Feature Name**  
Implement RBAC Roles and Permissions

**Summary**  
Implement role and permission entities/mappings and assignment flows required
for policy-based authorization checks.

**Tasks**

- [ ] Define role and permission models
- [ ] Seed baseline roles and permissions
- [ ] Add role/permission assignment APIs or internal services
- [ ] Add user-role and role-permission mapping logic

**Acceptance Criteria**

- [ ] Roles and permissions are persisted and queryable
- [ ] User can be assigned one or more roles
- [ ] Permissions resolve correctly from assigned roles

**Pull Request**  
https://github.com/Ashraf8amir/lumora/pull/<PR_NUMBER>

**PR Title**  
feat(auth): implement RBAC roles and permissions (LUM-029)

**PR Description**

```md
## Summary

Implemented RBAC data model and assignment logic for roles and permissions.

---

## Changes

- Added role and permission models
- Added baseline role/permission seed data
- Added role/permission assignment services/APIs
- Added user-role and role-permission mapping logic

---

## Why

RBAC modeling is required before enforcing authorization at route level.

---

## Testing

- [ ] Build passes
- [ ] Lint passes
- [ ] Tests pass (if applicable)

---

## Checklist

- [ ] Code follows project conventions
- [ ] Documentation updated
- [ ] No breaking changes

---

Closes #<ISSUE_NUMBER>
```

---

## LUM-030: Build RBAC Guards and Decorators

**Feature Name**  
Build RBAC Guards and Decorators

**Summary**  
Build framework-level RBAC decorators and guards to enforce role/permission
requirements on protected routes.

**Tasks**

- [ ] Implement `@Roles()` and/or `@Permissions()` decorators
- [ ] Implement guard(s) to evaluate route metadata
- [ ] Integrate guards with JWT-authenticated user context
- [ ] Add sample protected endpoints by role/permission

**Acceptance Criteria**

- [ ] Unauthorized roles are denied with proper error response
- [ ] Authorized roles can access protected routes
- [ ] Route metadata accurately drives authorization checks

**Pull Request**  
https://github.com/Ashraf8amir/lumora/pull/<PR_NUMBER>

**PR Title**  
feat(auth): build RBAC guards and decorators (LUM-030)

**PR Description**

```md
## Summary

Built RBAC decorators and guards to enforce role/permission route protection.

---

## Changes

- Added @Roles/@Permissions decorators
- Added RBAC guard evaluation logic
- Wired guards with JWT-authenticated user context
- Added sample role/permission-protected endpoints

---

## Why

This enforces authorization policies consistently across protected routes.

---

## Testing

- [ ] Build passes
- [ ] Lint passes
- [ ] Tests pass (if applicable)

---

## Checklist

- [ ] Code follows project conventions
- [ ] Documentation updated
- [ ] No breaking changes

---

Closes #<ISSUE_NUMBER>
```

---

## LUM-031: Implement 2FA Enrollment and Challenge

**Feature Name**  
Implement 2FA Enrollment and Challenge

**Summary**  
Implement TOTP-based 2FA setup, QR enrollment, verification challenge during
login, and secure enable/disable flows.

**Tasks**

- [ ] Generate and store encrypted 2FA secret
- [ ] Provide provisioning URI / QR setup data
- [ ] Verify OTP code to enable 2FA
- [ ] Enforce second-factor challenge at login

**Acceptance Criteria**

- [ ] User can enroll in 2FA and verify setup code
- [ ] 2FA-enabled user must pass OTP challenge at login
- [ ] Invalid OTP attempts are rejected

**Pull Request**  
https://github.com/Ashraf8amir/lumora/pull/<PR_NUMBER>

**PR Title**  
feat(auth): implement 2FA enrollment and challenge (LUM-031)

**PR Description**

```md
## Summary

Implemented TOTP-based 2FA enrollment, verification, and login challenge flow.

---

## Changes

- Added encrypted 2FA secret generation/storage
- Added provisioning URI/QR setup support
- Added OTP verification for enabling 2FA
- Enforced second-factor challenge during login

---

## Why

2FA significantly improves account security against credential compromise.

---

## Testing

- [ ] Build passes
- [ ] Lint passes
- [ ] Tests pass (if applicable)

---

## Checklist

- [ ] Code follows project conventions
- [ ] Documentation updated
- [ ] No breaking changes

---

Closes #<ISSUE_NUMBER>
```

---

## LUM-032: Implement 2FA Recovery and Reset

**Feature Name**  
Implement 2FA Recovery and Reset

**Summary**  
Implement secure recovery codes and operational flows to recover access when a
user loses authenticator access, including controlled 2FA reset.

**Tasks**

- [ ] Generate one-time recovery codes
- [ ] Store hashed recovery codes
- [ ] Implement recovery-code login fallback
- [ ] Implement secured 2FA reset path

**Acceptance Criteria**

- [ ] Recovery codes can be used only once
- [ ] Used recovery code is invalidated immediately
- [ ] 2FA reset requires strong re-verification checks

**Pull Request**  
https://github.com/Ashraf8amir/lumora/pull/<PR_NUMBER>

**PR Title**  
feat(auth): implement 2FA recovery and reset (LUM-032)

**PR Description**

```md
## Summary

Implemented recovery-code and secured reset flows for 2FA account recovery.

---

## Changes

- Added one-time recovery code generation
- Added hashed recovery code storage/validation
- Added recovery-code fallback login flow
- Added secured 2FA reset workflow

---

## Why

Recovery flows prevent account lockout while keeping 2FA controls safe.

---

## Testing

- [ ] Build passes
- [ ] Lint passes
- [ ] Tests pass (if applicable)

---

## Checklist

- [ ] Code follows project conventions
- [ ] Documentation updated
- [ ] No breaking changes

---

Closes #<ISSUE_NUMBER>
```

---

## LUM-033: Audit and Harden Auth Security Flows

**Feature Name**  
Audit and Harden Auth Security Flows

**Summary**  
Audit end-to-end auth flows and apply security hardening controls including
rate limits, event logging, and sensitive-flow abuse protection.

**Tasks**

- [ ] Add targeted rate limits for login, refresh, and 2FA endpoints
- [ ] Add security audit logs for critical auth events
- [ ] Validate brute-force and replay protections
- [ ] Add final auth flow threat checklist and remediation items

**Acceptance Criteria**

- [ ] Auth endpoints are rate-limited by risk profile
- [ ] Security events are traceable in logs
- [ ] Replay/reuse/abuse scenarios are covered with controls

**Pull Request**  
https://github.com/Ashraf8amir/lumora/pull/<PR_NUMBER>

**PR Title**  
feat(auth): audit and harden auth security flows (LUM-033)

**PR Description**

```md
## Summary

Audited and hardened critical auth flows with protections and security logging.

---

## Changes

- Added risk-based rate limits on auth endpoints
- Added critical auth security audit logging
- Added replay/reuse/brute-force protection checks
- Added final auth threat checklist and fixes

---

## Why

Hardening reduces abuse risk and improves traceability in security incidents.

---

## Testing

- [ ] Build passes
- [ ] Lint passes
- [ ] Tests pass (if applicable)

---

## Checklist

- [ ] Code follows project conventions
- [ ] Documentation updated
- [ ] No breaking changes

---

Closes #<ISSUE_NUMBER>
```

---

# Progress

Completed: **0 / 10**

---

# Deliverables

At the end of this sprint, Lumora should have:

- Access JWT authentication
- Refresh token rotation with reuse detection
- Redis token revocation/blacklisting
- Google OAuth2 login
- RBAC enforcement (roles + permissions + guards)
- 2FA enrollment, challenge, and recovery flows
- Hardened and audited auth critical path

---

# Notes

- Open each issue using the **Feature** issue template in `.github/ISSUE_TEMPLATE/feature.yml`.
- For each PR, use `.github/PULL_REQUEST_TEMPLATE.md` and set `Closes #<issue-number>`.
- Replace each `<PR_NUMBER>` link once the PR is opened.

---

# Sprint Result

**Status:** ⬜ Planned
