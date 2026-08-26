-- The app never uses GraphQL: every client query goes through PostgREST
-- (supabase-js .from()/.rpc()) and the Edge Functions use the service role.
-- pg_graphql only existed as an unused API surface, and it is what the
-- pg_graphql_* linter warnings measure — with the extension gone, the
-- /graphql/v1 endpoint and the warnings go with it.
--
-- Reversible any time with: create extension pg_graphql;
drop extension if exists pg_graphql;
