# Project Structure

## Overview

Lumora follows a modular and scalable architecture based on NestJS best practices.

The project is designed to be:

- Modular
- Scalable
- Maintainable
- Testable
- Production Ready

The structure separates infrastructure, business logic, shared components, and application modules to keep responsibilities clear and reduce coupling.

---

# Root Structure

```text
lumora/

docs/
scripts/
src/
test/
uploads/
```

---

# Source Structure

```text
src/

app/
common/
core/
modules/
shared/
types/
```

Each directory has a specific responsibility.

---

# app

The application entry layer.

This directory contains the application's bootstrap process and root module.

It is responsible for starting the application and connecting all major components together.

Nothing inside this folder should contain business logic.

---

# core

Core contains infrastructure components that are shared across the entire application.

Examples include:

- Database
- Configuration
- Redis
- Logger
- Queue
- Storage
- Security
- Swagger
- Validation

Everything inside `core` is initialized once and reused throughout the application.

---

# common

Common contains reusable framework-level utilities.

Examples include:

- Guards
- Pipes
- Filters
- Interceptors
- Decorators
- Exceptions
- Constants
- Enums
- Helpers

These components are generic and can be used by any module.

---

# modules

Modules represent the business features of Lumora.

Examples:

- Authentication
- Users
- Products
- Categories
- Orders
- Payments
- Notifications

Each module owns its own controllers, services, schemas, DTOs, and business logic.

---

# shared

Shared contains reusable application components that are not tied to infrastructure.

Examples:

- Base DTOs
- Pagination
- Generic Responses
- Value Objects
- Shared Services
- Repository Contracts

Everything here should be reusable across multiple business modules.

---

# types

Contains global TypeScript type definitions.

Examples:

- Utility Types
- Global Interfaces
- Custom Type Aliases

---

# Architecture Principles

The project follows these principles:

- Single Responsibility Principle (SRP)
- Dependency Injection
- Separation of Concerns
- Feature-Based Modules
- Reusable Infrastructure
- Clean Code
- SOLID Principles

---

# Goals

This architecture aims to:

- simplify development
- improve maintainability
- support future scaling
- reduce coupling
- encourage clean code
- provide enterprise-level project organization