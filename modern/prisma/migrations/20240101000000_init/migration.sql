-- CaseFlow Initial Migration
-- This file is a placeholder. Run `prisma migrate dev` to generate the actual migration.
-- In production, run `prisma migrate deploy` which uses generated migrations.

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('Open_New', 'Open_Assigned', 'Open_Pending Input', 'Closed_Closed', 'Closed_Rejected', 'Closed_Duplicate');
CREATE TYPE "CasePriority" AS ENUM ('P1', 'P2', 'P3');
CREATE TYPE "CaseState" AS ENUM ('Open', 'Closed');
CREATE TYPE "CaseChannel" AS ENUM ('Email', 'WhatsApp', 'Phone', 'Portal', 'Manual');
