# 51-Database-Architecture.md

# Database Architecture

> Project: Lumora

> Version: 1.0

> Database: MongoDB

> ODM: Mongoose

> Status: Approved

---

# Purpose

Defines how MongoDB and Mongoose are organized inside Lumora.

Goals

- Clean Separation
- Reusable Components
- Easy Testing
- High Performance
- Scalability

---

# Principles

- Business modules never communicate directly with MongoDB.
- Repositories own all database operations.
- Schemas belong to Infrastructure Layer.
- Domain Layer knows nothing about Mongoose.
- Database configuration belongs to Core.

---

# Architecture

Application

↓

Repository Interface

↓

Mongo Repository

↓

Mongoose Schema

↓

MongoDB

---

# Responsibilities

Application Layer

Business Logic

---

Repository

Persistence Logic

---

Schema

Database Mapping

---

MongoDB

Data Storage

---

# Folder Structure

modules/

product/

infrastructure/

schemas/

repositories/

mappers/

---

# Rules

Never inject Model inside Application Services.

Never expose Mongoose Documents.

Never return Schema objects.

Always map Schema → Domain Entity.

Always map Domain Entity → Response DTO.

---

# Database Lifecycle

Request

↓

Application Service

↓

Repository

↓

Schema

↓

MongoDB

↓

Repository

↓

Mapper

↓

Domain Entity

↓

Application

↓

Response DTO

---

# Change Log

| Version | Description     |
| ------- | --------------- |
| 1.0     | Initial Version |
