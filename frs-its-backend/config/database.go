package config

import (
	"fmt"
	"frs-its-backend/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	// Pastikan password sesuai dengan instalasi PostgreSQL kamu
	dsn := "host=localhost user=postgres password=170405 dbname=frs_db port=5432 sslmode=disable TimeZone=Asia/Jakarta"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("Gagal koneksi ke database: " + err.Error())
	}

	// Buat tabel jika belum ada
	db.AutoMigrate(&models.Student{}, &models.Course{}, &models.Enrollment{})

	DB = db
	fmt.Println("Database berhasil terkoneksi!")

	// Jalankan pengisian data awal
	seedData()
}

func seedData() {
	var studentCount int64
	DB.Model(&models.Student{}).Count(&studentCount)
	if studentCount == 0 {
		dummyStudent := models.Student{
			NRP:      "5025241001",
			Name:     "Budi Mahasiswa ITS",
			Username: "budi",
			Password: "123", // Password dummy
			MaxSKS:   24,
		}
		DB.Create(&dummyStudent)
		fmt.Println("Seeder: Data mahasiswa contoh berhasil ditambahkan!")
	} else {
		// Pastikan data mahasiswa lama otomatis terisi username dan password
		DB.Model(&models.Student{}).Where("password IS NULL OR password = ''").Updates(map[string]interface{}{
			"username": "budi",
			"password": "123",
		})
	}

	var courseCount int64
	DB.Model(&models.Course{}).Count(&courseCount)
	if courseCount == 0 {
		dummyCourses := []models.Course{
			{Code: "IF184101", Name: "Algoritma dan Pemrograman", SKS: 4, Quota: 30},
			{Code: "IF184201", Name: "Struktur Data", SKS: 4, Quota: 30},
			{Code: "IF184301", Name: "Pemrograman Berorientasi Objek", SKS: 3, Quota: 25},
			{Code: "IF184401", Name: "Sistem Basis Data", SKS: 3, Quota: 25},
			{Code: "IF184501", Name: "Jaringan Komputer", SKS: 3, Quota: 20},
		}
		DB.Create(&dummyCourses)
		fmt.Println("Seeder: Data mata kuliah contoh berhasil ditambahkan!")
	}
}
