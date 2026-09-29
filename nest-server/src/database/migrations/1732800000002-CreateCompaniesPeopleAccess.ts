import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * PART 2 — Companies, People and Access, from Data_Modeling_Complete.md
 * ("Document 6 — Complete Data Model", v3).
 *
 * Builds the 14 tables covering the platform/vendor/buyer registration and
 * access model: organization, organization_status_history,
 * vendor_target_country, vendor_bank_account, users, auth_session,
 * user_token, user_social_account, buyer_profile, buyer_address, role,
 * permission, role_permission, user_role, audit_log.
 *
 * Depends on CreateExtensionsAndDomains1732800000000 (domains, pgcrypto)
 * and CreateReferenceData1732800000001 (currency, country — FK targets).
 *
 * This is a database-only pass: no bootstrap/seed data (no PLATFORM
 * organization row, no SUPER_ADMIN user, no role/permission seed rows).
 * Encrypted columns (pan_enc, account_number_enc, tax_id_enc) are declared
 * as bytea only — KMS integration is deferred to the application layer.
 * Row-level security policies and `SET LOCAL app.org_id` wiring are deferred
 * until the authentication/request-context layer exists (Part 0.11) — the
 * schema below is RLS-ready (organization_id/user_id present on every
 * owned table) but no CREATE POLICY statements run in this pass.
 */
export class CreateCompaniesPeopleAccess1732800000002 implements MigrationInterface {
  name = 'CreateCompaniesPeopleAccess1732800000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ------------------------------------------------------------------
    // 2.1 organization
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE organization (
        id                        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        public_id                 uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
        org_type                  text NOT NULL,
        legal_name                text NOT NULL,
        display_name              text NOT NULL,
        email                     text NOT NULL,
        phone                     text,
        source_country            d_country REFERENCES country (code),
        source_currency           d_ccy REFERENCES currency (code),
        settlement_currency       d_ccy REFERENCES currency (code),
        address_line1             text,
        address_line2             text,
        city                      text,
        state                     text,
        postal_code               text,
        country                   d_country REFERENCES country (code),
        gstin                     text,
        iec_code                  text,
        pan_enc                   bytea,
        requires_second_approver  boolean NOT NULL DEFAULT true,
        status                    text NOT NULL DEFAULT 'PENDING',
        approved_by               bigint,
        approved_at               timestamptz,
        row_version               int NOT NULL DEFAULT 1,
        created_at                timestamptz NOT NULL DEFAULT now(),
        updated_at                timestamptz NOT NULL DEFAULT now(),
        CHECK (org_type IN ('PLATFORM','VENDOR')),
        CHECK (status IN ('PENDING','APPROVED','SUSPENDED','BLOCKED'))
      )
    `);
    // Only one platform row can ever exist.
    await queryRunner.query(`
      CREATE UNIQUE INDEX organization_one_platform ON organization ((true)) WHERE org_type = 'PLATFORM'
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX organization_gstin_uq ON organization (gstin) WHERE gstin IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX organization_by_status ON organization (status)
    `);
    await queryRunner.query(`
      CREATE INDEX organization_source_country_idx ON organization (source_country)
    `);
    await queryRunner.query(`
      CREATE INDEX organization_country_idx ON organization (country)
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_organization_updated BEFORE UPDATE ON organization
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    // ------------------------------------------------------------------
    // 2.2 organization_status_history (append-only, G-06)
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE organization_status_history (
        id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        organization_id  bigint NOT NULL REFERENCES organization (id),
        from_status      text,
        to_status        text NOT NULL,
        changed_by       bigint,
        reason           text,
        created_at       timestamptz NOT NULL DEFAULT now(),
        CHECK (to_status NOT IN ('SUSPENDED','BLOCKED') OR coalesce(btrim(reason), '') <> '')
      )
    `);
    await queryRunner.query(`
      CREATE INDEX osh_by_org ON organization_status_history (organization_id, created_at)
    `);

    // ------------------------------------------------------------------
    // 2.3 vendor_target_country
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE vendor_target_country (
        id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        organization_id  bigint NOT NULL REFERENCES organization (id),
        target_country   d_country NOT NULL REFERENCES country (code),
        target_currency  d_ccy NOT NULL REFERENCES currency (code),
        is_active        boolean NOT NULL DEFAULT true,
        created_at       timestamptz NOT NULL DEFAULT now(),
        updated_at       timestamptz NOT NULL DEFAULT now(),
        UNIQUE (organization_id, target_country)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX vtc_target_country_idx ON vendor_target_country (target_country)
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_vendor_target_country_updated BEFORE UPDATE ON vendor_target_country
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    // ------------------------------------------------------------------
    // 2.4 vendor_bank_account (G-02)
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE vendor_bank_account (
        id                    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        organization_id       bigint NOT NULL REFERENCES organization (id),
        account_holder_name   text NOT NULL,
        account_number_enc    bytea NOT NULL,
        account_number_last4  char(4) NOT NULL,
        ifsc_code             text,
        swift_code            text,
        bank_name             text NOT NULL,
        branch                text,
        currency              d_ccy NOT NULL REFERENCES currency (code),
        verification_status   text NOT NULL DEFAULT 'PENDING',
        verified_at           timestamptz,
        is_primary            boolean NOT NULL DEFAULT false,
        status                text NOT NULL DEFAULT 'ACTIVE',
        created_by            bigint,
        created_at            timestamptz NOT NULL DEFAULT now(),
        updated_at            timestamptz NOT NULL DEFAULT now(),
        CHECK (verification_status IN ('PENDING','VERIFIED','FAILED')),
        CHECK (status IN ('ACTIVE','INACTIVE')),
        CHECK (ifsc_code IS NOT NULL OR swift_code IS NOT NULL)
      )
    `);
    // Only one ACTIVE primary bank account per vendor — payouts have exactly
    // one unambiguous destination.
    await queryRunner.query(`
      CREATE UNIQUE INDEX vba_one_primary ON vendor_bank_account (organization_id)
        WHERE is_primary AND status = 'ACTIVE'
    `);
    await queryRunner.query(`
      CREATE INDEX vba_by_org ON vendor_bank_account (organization_id)
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_vendor_bank_account_updated BEFORE UPDATE ON vendor_bank_account
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    // ------------------------------------------------------------------
    // 2.5 users (renamed from `user`, M-01 — `user` is a reserved word)
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE users (
        id                   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        public_id            uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
        user_type            text NOT NULL,
        organization_id      bigint REFERENCES organization (id),
        full_name            text NOT NULL,
        email                text NOT NULL,
        phone                text,
        password_hash        text,
        auth_provider        text NOT NULL DEFAULT 'LOCAL',
        email_verified       boolean NOT NULL DEFAULT false,
        status               text NOT NULL DEFAULT 'PENDING',
        failed_login_count   int NOT NULL DEFAULT 0,
        locked_until         timestamptz,
        password_changed_at  timestamptz,
        last_login_at        timestamptz,
        anonymised_at        timestamptz,
        created_at           timestamptz NOT NULL DEFAULT now(),
        updated_at           timestamptz NOT NULL DEFAULT now(),
        CHECK (user_type IN ('PLATFORM','VENDOR','BUYER')),
        CHECK (auth_provider IN ('LOCAL','GOOGLE')),
        CHECK (status IN ('PENDING','ACTIVE','BLOCKED','ANONYMISED')),
        CHECK ((user_type = 'BUYER' AND organization_id IS NULL) OR
               (user_type <> 'BUYER' AND organization_id IS NOT NULL))
      )
    `);
    // Case-insensitive email uniqueness (H-11): Rahul@x.com and rahul@x.com
    // are one person — Google-login linking depends on this.
    await queryRunner.query(`
      CREATE UNIQUE INDEX users_email_uq ON users (lower(email))
    `);
    await queryRunner.query(`
      CREATE INDEX users_by_org ON users (organization_id) WHERE organization_id IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);
    // A PLATFORM user's organization must be the (one) PLATFORM org, and a
    // VENDOR user's organization must be a VENDOR org. BUYER users have no
    // organization at all, already enforced by the CHECK above.
    await queryRunner.query(`
      CREATE FUNCTION check_user_org_type_match() RETURNS trigger LANGUAGE plpgsql AS $$
      DECLARE
        org_type_found text;
      BEGIN
        IF NEW.organization_id IS NULL THEN
          RETURN NEW;
        END IF;

        SELECT org_type INTO org_type_found FROM organization WHERE id = NEW.organization_id;

        IF NEW.user_type = 'PLATFORM' AND org_type_found <> 'PLATFORM' THEN
          RAISE EXCEPTION 'A PLATFORM user must belong to the PLATFORM organization';
        END IF;

        IF NEW.user_type = 'VENDOR' AND org_type_found <> 'VENDOR' THEN
          RAISE EXCEPTION 'A VENDOR user must belong to a VENDOR organization';
        END IF;

        RETURN NEW;
      END $$;
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_users_org_type_match BEFORE INSERT OR UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION check_user_org_type_match();
    `);

    // Deferred foreign keys: organization/organization_status_history
    // columns that point at users(id), added now that users exists.
    await queryRunner.query(`
      ALTER TABLE organization ADD CONSTRAINT organization_approved_by_fkey
        FOREIGN KEY (approved_by) REFERENCES users (id)
    `);
    await queryRunner.query(`
      ALTER TABLE organization_status_history ADD CONSTRAINT osh_changed_by_fkey
        FOREIGN KEY (changed_by) REFERENCES users (id)
    `);
    await queryRunner.query(`
      ALTER TABLE vendor_bank_account ADD CONSTRAINT vba_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES users (id)
    `);

    // ------------------------------------------------------------------
    // 2.6 auth_session (G-07)
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE auth_session (
        id                   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id              bigint NOT NULL REFERENCES users (id),
        refresh_token_hash   text NOT NULL UNIQUE,
        user_agent           text,
        ip                   inet,
        created_at           timestamptz NOT NULL DEFAULT now(),
        last_used_at         timestamptz,
        expires_at           timestamptz NOT NULL,
        revoked_at           timestamptz,
        revoked_reason       text,
        CHECK (revoked_reason IS NULL OR revoked_reason IN ('LOGOUT','USER_BLOCKED','PASSWORD_CHANGED','ADMIN'))
      )
    `);
    // "Log out of all devices" and "blocking a user ends their live
    // sessions" both read/write exactly this partial index.
    await queryRunner.query(`
      CREATE INDEX auth_session_live ON auth_session (user_id) WHERE revoked_at IS NULL
    `);

    // ------------------------------------------------------------------
    // 2.7 user_token
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE user_token (
        id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id     bigint NOT NULL REFERENCES users (id),
        token_type  text NOT NULL,
        token_hash  text NOT NULL UNIQUE,
        expires_at  timestamptz NOT NULL,
        used_at     timestamptz,
        created_at  timestamptz NOT NULL DEFAULT now(),
        CHECK (token_type IN ('EMAIL_VERIFY','PASSWORD_RESET','OTP','INVITE'))
      )
    `);
    await queryRunner.query(`
      CREATE INDEX user_token_open ON user_token (user_id, token_type) WHERE used_at IS NULL
    `);

    // ------------------------------------------------------------------
    // 2.8 user_social_account
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE user_social_account (
        id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id            bigint NOT NULL REFERENCES users (id),
        provider           text NOT NULL,
        provider_user_id   text NOT NULL,
        provider_email     text,
        linked_at          timestamptz NOT NULL DEFAULT now(),
        CHECK (provider IN ('GOOGLE')),
        UNIQUE (provider, provider_user_id),
        UNIQUE (user_id, provider)
      )
    `);

    // ------------------------------------------------------------------
    // 2.9 buyer_profile
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE buyer_profile (
        user_id              bigint PRIMARY KEY REFERENCES users (id),
        buyer_type           text NOT NULL DEFAULT 'INDIVIDUAL',
        company_name         text,
        country              d_country REFERENCES country (code),
        preferred_currency   d_ccy REFERENCES currency (code),
        preferred_language   text,
        tax_id_enc           bytea,
        is_verified          boolean NOT NULL DEFAULT false,
        created_at           timestamptz NOT NULL DEFAULT now(),
        updated_at           timestamptz NOT NULL DEFAULT now(),
        CHECK (buyer_type IN ('INDIVIDUAL','BUSINESS')),
        CHECK (buyer_type = 'INDIVIDUAL' OR coalesce(btrim(company_name), '') <> '')
      )
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_buyer_profile_updated BEFORE UPDATE ON buyer_profile
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    // ------------------------------------------------------------------
    // 2.10 buyer_address
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE buyer_address (
        id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id        bigint NOT NULL REFERENCES users (id),
        label          text,
        contact_name   text NOT NULL,
        contact_phone  text NOT NULL,
        address_line1  text NOT NULL,
        address_line2  text,
        city           text NOT NULL,
        state          text,
        postal_code    text,
        country        d_country NOT NULL REFERENCES country (code),
        is_default     boolean NOT NULL DEFAULT false,
        status         text NOT NULL DEFAULT 'ACTIVE',
        created_at     timestamptz NOT NULL DEFAULT now(),
        updated_at     timestamptz NOT NULL DEFAULT now(),
        CHECK (status IN ('ACTIVE','ARCHIVED'))
      )
    `);
    // Exactly one default address per buyer among their active addresses.
    await queryRunner.query(`
      CREATE UNIQUE INDEX buyer_address_one_default ON buyer_address (user_id)
        WHERE is_default AND status = 'ACTIVE'
    `);
    await queryRunner.query(`
      CREATE INDEX buyer_address_by_user ON buyer_address (user_id)
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_buyer_address_updated BEFORE UPDATE ON buyer_address
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    // ------------------------------------------------------------------
    // 2.11 role, permission, role_permission
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE role (
        id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        code         text NOT NULL UNIQUE,
        name         text NOT NULL,
        scope_type   text NOT NULL,
        is_system    boolean NOT NULL DEFAULT false,
        description  text,
        CHECK (scope_type IN ('PLATFORM','VENDOR','BUYER'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE permission (
        id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        code         text NOT NULL UNIQUE,
        module       text NOT NULL,
        description  text
      )
    `);

    await queryRunner.query(`
      CREATE TABLE role_permission (
        role_id        bigint NOT NULL REFERENCES role (id),
        permission_id  bigint NOT NULL REFERENCES permission (id),
        PRIMARY KEY (role_id, permission_id)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX role_permission_by_permission ON role_permission (permission_id)
    `);

    // ------------------------------------------------------------------
    // 2.12 user_role
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE user_role (
        id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id       bigint NOT NULL REFERENCES users (id),
        role_id       bigint NOT NULL REFERENCES role (id),
        assigned_by   bigint REFERENCES users (id),
        assigned_at   timestamptz NOT NULL DEFAULT now(),
        UNIQUE (user_id, role_id)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX user_role_by_role ON user_role (role_id)
    `);
    // A VENDOR-scope role can only go to a user whose own organization is a
    // VENDOR org, and a PLATFORM-scope role only to a PLATFORM user. Note:
    // "maker cannot approve their own product" (Maker != Checker at the
    // point of approval) is deliberately NOT enforced here — per Part 2.12's
    // "Why", the same person may legitimately hold both VENDOR_MAKER and
    // VENDOR_CHECKER roles; the actual self-approval block belongs on the
    // product approval statement itself (Part 3.1, not built in this pass).
    await queryRunner.query(`
      CREATE FUNCTION check_user_role_scope_match() RETURNS trigger LANGUAGE plpgsql AS $$
      DECLARE
        role_scope    text;
        target_user   record;
        org_type_found text;
      BEGIN
        SELECT scope_type INTO role_scope FROM role WHERE id = NEW.role_id;
        SELECT user_type, organization_id INTO target_user FROM users WHERE id = NEW.user_id;

        IF role_scope = 'BUYER' THEN
          IF target_user.user_type <> 'BUYER' THEN
            RAISE EXCEPTION 'A BUYER-scope role can only be assigned to a BUYER user';
          END IF;
          RETURN NEW;
        END IF;

        IF target_user.organization_id IS NULL THEN
          RAISE EXCEPTION 'A % role requires the user to belong to an organization', role_scope;
        END IF;

        SELECT org_type INTO org_type_found FROM organization WHERE id = target_user.organization_id;

        IF role_scope = 'VENDOR' AND org_type_found <> 'VENDOR' THEN
          RAISE EXCEPTION 'A VENDOR-scope role requires a VENDOR organization';
        END IF;

        IF role_scope = 'PLATFORM' AND org_type_found <> 'PLATFORM' THEN
          RAISE EXCEPTION 'A PLATFORM-scope role requires the PLATFORM organization';
        END IF;

        RETURN NEW;
      END $$;
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_user_role_scope_match BEFORE INSERT OR UPDATE ON user_role
        FOR EACH ROW EXECUTE FUNCTION check_user_role_scope_match();
    `);

    // ------------------------------------------------------------------
    // 2.13 audit_log (append-only, G-06)
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE audit_log (
        id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        actor_user_id  bigint REFERENCES users (id),
        actor_org_id   bigint REFERENCES organization (id),
        action         text NOT NULL,
        entity_type    text NOT NULL,
        entity_id      bigint NOT NULL,
        before         jsonb,
        after          jsonb,
        ip             inet,
        user_agent     text,
        created_at     timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX audit_by_entity ON audit_log (entity_type, entity_id, created_at)
    `);
    await queryRunner.query(`
      CREATE INDEX audit_by_actor ON audit_log (actor_user_id, created_at)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS audit_log`);

    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_user_role_scope_match ON user_role`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS check_user_role_scope_match`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_role`);
    await queryRunner.query(`DROP TABLE IF EXISTS role_permission`);
    await queryRunner.query(`DROP TABLE IF EXISTS permission`);
    await queryRunner.query(`DROP TABLE IF EXISTS role`);

    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_buyer_address_updated ON buyer_address`);
    await queryRunner.query(`DROP TABLE IF EXISTS buyer_address`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_buyer_profile_updated ON buyer_profile`);
    await queryRunner.query(`DROP TABLE IF EXISTS buyer_profile`);

    await queryRunner.query(`DROP TABLE IF EXISTS user_social_account`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_token`);
    await queryRunner.query(`DROP TABLE IF EXISTS auth_session`);

    await queryRunner.query(`ALTER TABLE vendor_bank_account DROP CONSTRAINT IF EXISTS vba_created_by_fkey`);
    await queryRunner.query(
      `ALTER TABLE organization_status_history DROP CONSTRAINT IF EXISTS osh_changed_by_fkey`,
    );
    await queryRunner.query(`ALTER TABLE organization DROP CONSTRAINT IF EXISTS organization_approved_by_fkey`);

    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_users_org_type_match ON users`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS check_user_org_type_match`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_users_updated ON users`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);

    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_vendor_bank_account_updated ON vendor_bank_account`);
    await queryRunner.query(`DROP TABLE IF EXISTS vendor_bank_account`);

    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_vendor_target_country_updated ON vendor_target_country`);
    await queryRunner.query(`DROP TABLE IF EXISTS vendor_target_country`);

    await queryRunner.query(`DROP TABLE IF EXISTS organization_status_history`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_organization_updated ON organization`);
    await queryRunner.query(`DROP TABLE IF EXISTS organization`);
  }
}
