CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
);

CREATE TABLE links (
    id SERIAL PRIMARY KEY,
    created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    category VARCHA(50) NOT NULL
);

CREATE TABLE link_permissions (
    id SERIAL PRIMARY KEY,
    link_id INTEGER REFERENCES links(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(10) CHECK (permission IN ('read', 'write')) NOT NULL
);