-- enable the "vector" extension.
create extension vector
with
  schema extensions;

alter table briefs add column embedding extensions.vector(384);
