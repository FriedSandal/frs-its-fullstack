-- Skema Tabel Mahasiswa
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    nrp VARCHAR(15) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE,
    password VARCHAR(100),
    max_sks INT DEFAULT 24
);

-- Skema Tabel Mata Kuliah
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    sks INT NOT NULL,
    quota INT NOT NULL
);

-- Skema Tabel Transaksi FRS (Enrollments)
CREATE TABLE IF NOT EXISTS enrollments (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    course_id INT REFERENCES courses(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_course UNIQUE(student_id, course_id)
);

-- Data Awal (Dummy Seeder)
INSERT INTO students (nrp, name, username, password, max_sks)
VALUES ('5025241001', 'Budi Mahasiswa ITS', 'budi', '123', 24)
ON CONFLICT (nrp) DO NOTHING;

INSERT INTO courses (code, name, sks, quota) VALUES
('IF184101', 'Algoritma dan Pemrograman', 4, 30),
('IF184201', 'Struktur Data', 4, 30),
('IF184301', 'Pemrograman Berorientasi Objek', 3, 25),
('IF184401', 'Sistem Basis Data', 3, 25),
('IF184501', 'Jaringan Komputer', 3, 20)
ON CONFLICT (code) DO NOTHING;