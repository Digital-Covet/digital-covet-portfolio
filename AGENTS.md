<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


# 1. Environment Identification Protocol

## NON-NEGOTIABLE RULE

The Agent MUST NEVER assume the environment type.

Before proposing, generating, or executing ANY database-related command, the Agent MUST first verify the runtime environment.

Required verification steps:

```bash
echo $NODE_ENV
echo $APP_ENV
echo $DATABASE_URL
```

The Agent MUST additionally inspect:

- `.env`
- `.env.local`
- `.env.production`
- `.env.staging`
- deployment configuration files
- Prisma datasource configuration
- CI/CD environment definitions

If the environment cannot be conclusively identified:

# DEFAULT TO PRODUCTION

Ambiguous environments MUST be treated as:

- Restricted Production Environments
- Non-resettable
- Non-destructive
- Human approval required

The Agent MUST refuse destructive actions under ambiguity.



# 2. Forbidden Actions ("Never" List)

The following actions are FORBIDDEN unless the Mandatory Confirmation Workflow is completed successfully.

## Prisma / Database Destruction

NEVER run:

```bash
prisma db push --force-reset
prisma db push --accept-data-loss
```

NEVER suggest:

```bash
prisma db push
```

for any environment except:

- disposable local development databases
- ephemeral shadow databases
- explicitly confirmed scratch environments

Preferred workflow:

```bash
prisma migrate dev
prisma migrate deploy
```



## Dangerous Shell Flags

NEVER execute commands containing:

```bash
--force
--force-reset
-f
```

unless:

1. The exact impact has been explained.
2. The environment has been verified.
3. Human confirmation has been explicitly received.



## Forbidden SQL Operations

NEVER execute or generate automated execution for:

```sql
DROP DATABASE
DROP SCHEMA
DROP TABLE
TRUNCATE TABLE
DELETE FROM <table> WITHOUT WHERE
```

without explicit multi-step human confirmation.



## Environment & Secret Modification

The Agent MUST NEVER modify:

- `.env`
- `.env.*`
- secrets
- API keys
- cloud credentials
- CI/CD secrets
- infrastructure credentials

without FIRST presenting:

1. A complete summary of proposed changes
2. The reason for the change
3. Expected impact
4. Rollback instructions

No secret rotation or credential overwrite may occur automatically.



# 3. Mandatory Confirmation Workflow

## High-Risk Command Definition

The following are classified as HIGH-RISK:

- Database schema resets
- Migration rewrites
- Destructive Prisma operations
- Bulk deletes
- Infrastructure changes
- Secret rotation
- Production deployments
- Data migrations
- Terraform apply/destroy
- Kubernetes destructive operations
- Docker volume deletion
- Any irreversible filesystem operation



## REQUIRED RISK ASSESSMENT BLOCK

Before any HIGH-RISK command is executed, the Agent MUST stop and output:

```text
================ RISK ASSESSMENT ================

Command:
<exact command>

Environment:
<detected environment>

Potential Impact:
- <what may be deleted>
- <what may become unavailable>
- <affected systems>

Reversible:
YES | NO | PARTIAL

Rollback Method:
<rollback procedure or "NONE">

Required Human Confirmation:
Type exactly:
"I UNDERSTAND THE RISK AND APPROVE"

=================================================
```

The Agent MUST NOT continue until the exact confirmation string is received.

Any deviation invalidates approval.



# 4. Prisma-Specific Safety Rules

## Approved Usage

### Local Development ONLY

```bash
prisma migrate dev
```

Allowed exclusively for:

- local developer machines
- isolated local containers
- disposable databases



## Production / Shared Environments

ONLY use:

```bash
prisma migrate deploy
```

after migrations have been reviewed and committed.

## Explicitly Forbidden

The Agent MUST NEVER use:

```bash
prisma db push
```

against:

- production
- staging
- shared development
- QA
- preview environments
- cloud databases
- unknown databases

`db push` is permitted ONLY for fresh local shadow databases with zero persistence requirements.



## Migration Safety Requirements

Before applying migrations, the Agent MUST:

1. Review generated SQL
2. Detect destructive alterations
3. Identify column drops
4. Identify type coercion risks
5. Warn about lock contention
6. Confirm backup availability
7. Confirm rollback strategy

If rollback is impossible, the Agent MUST state this explicitly.

# 5. Operational Safety Principles

## Principle: Explain Before Execute

The Agent MUST explain dangerous commands before proposing execution.

## Principle: No Silent Assumptions

The Agent MUST explicitly state:

- detected environment
- confidence level
- uncertainty
- destructive potential


## Principle: Human Authority Required

The Agent is NEVER authorized to independently:

- destroy data
- reset databases
- rotate credentials
- modify production infrastructure
- bypass confirmation workflows

# 7. Failure Handling

If the Agent detects:

- ambiguous infrastructure
- missing backups
- conflicting environment indicators
- unexpected production credentials
- insufficient permissions
- unsafe migration plans

the Agent MUST:

1. STOP execution
2. Explain the risk
3. Request human review
4. Refuse speculative destructive actions
