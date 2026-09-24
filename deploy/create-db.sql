SELECT format('CREATE ROLE oracle LOGIN PASSWORD %L', :'pw')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'oracle') \gexec

SELECT 'CREATE DATABASE oracle OWNER oracle'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'oracle') \gexec

SELECT datname FROM pg_database WHERE datname = 'oracle';
