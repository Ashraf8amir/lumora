# Coding-Standards.md

# Coding Standards

> Project: Lumora

> Version: 1.0

> Status: Approved

---

# Purpose

Defines the official coding standards used throughout the Lumora project.

These standards ensure:

- Consistency
- Readability
- Maintainability
- Scalability

---

# General Principles

- Follow SOLID Principles.
- Keep functions small and focused.
- Prefer composition over inheritance.
- Avoid duplicated code.
- Never expose database models directly.
- Business logic belongs to the Application Layer.
- Infrastructure should never leak into the Domain Layer.

---

# Naming Convention

Use

PascalCase

For

Classes

DTOs

Enums

Interfaces (without I prefix)

Modules

---

camelCase

For

Variables

Functions

Methods

Properties

---

UPPER_SNAKE_CASE

For

Environment Variables

Constants

---

kebab-case

For

Folders

File Names

---

# File Naming

Correct

create-product.dto.ts

product.controller.ts

product.repository.ts

product.mapper.ts

product.service.ts

---

Wrong

ProductController.ts

CreateDTO.ts

MyRepository.ts

---

# Folder Naming

Correct

product/

create-order/

payment/

---

Wrong

Products/

OrderModule/

CreateOrder/

---

# Module Naming

Each module should be singular.

Correct

product

order

customer

brand

---

Wrong

products

orders

customers

---

# Class Naming

Controller

ProductController

Repository

ProductRepository

Service

ProductService

Module

ProductModule

Mapper

ProductMapper

Factory

ProductFactory

Strategy

JwtStrategy

Guard

JwtAuthGuard

Filter

HttpExceptionFilter

Interceptor

LoggingInterceptor

Pipe

ParseObjectIdPipe

Decorator

CurrentUserDecorator

---

# Interface Naming

Do NOT prefix interfaces with I.

Correct

UserRepository

CacheProvider

StorageProvider

Wrong

IUserRepository

ICacheProvider

---

# Enum Naming

Singular

Correct

OrderStatus

PaymentStatus

Role

Language

---

Wrong

Statuses

RolesEnum

OrderStatuses

---

# DTO Naming

CreateProductDto

UpdateProductDto

ProductResponseDto

FilterProductDto

PaginationDto

---

# Entity Naming

Product

Order

Customer

Brand

Category

---

# Repository Naming

ProductRepository

MongoProductRepository

CacheProductRepository

---

# Mapper Naming

ProductMapper

OrderMapper

CustomerMapper

---

# Service Naming

AuthenticationService

InventoryService

PaymentService

NotificationService

---

Avoid

UtilsService

HelperService

CommonService

---

# Method Naming

Use verbs.

Correct

create()

update()

delete()

findById()

findByEmail()

search()

activate()

archive()

---

Wrong

product()

saveData()

run()

executeSomething()

---

# Variable Naming

Use meaningful names.

Correct

customerId

orderNumber

totalPrice

paymentStatus

---

Wrong

id

data

obj

value

x

---

# Import Order

1. Node Modules

2. Internal Aliases

3. Relative Imports

Example

import { Injectable } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { ProductRepository } from '@/modules/product';

import { Product } from '../domain/entities/product.entity';

---

# Final Checklist

Before every Pull Request

✔ ESLint passes

✔ Tests pass

✔ Swagger updated

✔ No console.log()

✔ No TODO left

✔ DTO validated

✔ Business rules covered

✔ Error handling implemented

✔ Logging added if required
