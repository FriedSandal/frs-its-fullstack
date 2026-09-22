package controllers

import (
	"fmt"
	"frs-its-backend/config"
	"frs-its-backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

// @Summary Mengambil mata kuliah (Enroll FRS)
// @Tags FRS
// @Accept json
// @Produce json
// @Param request body models.EnrollRequest true "Data Mahasiswa dan Matkul"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /api/frs/enroll [post]
func EnrollCourse(c *gin.Context) {
	var req models.EnrollRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format data tidak valid"})
		return
	}

	// 1. Cek kuota mata kuliah
	var course models.Course
	if err := config.DB.First(&course, req.CourseID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Mata kuliah tidak ditemukan"})
		return
	}

	var enrolledCount int64
	config.DB.Model(&models.Enrollment{}).Where("course_id = ?", req.CourseID).Count(&enrolledCount)
	if int(enrolledCount) >= course.Quota {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Kuota kelas sudah penuh!"})
		return
	}

	// 2. Cek apakah sudah pernah ambil
	var existing models.Enrollment
	if err := config.DB.Where("student_id = ? AND course_id = ?", req.StudentID, req.CourseID).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Mata kuliah sudah diambil"})
		return
	}

	// Tambahkan pengecekan ini sebelum step 3 (simpan enrollment)

	// Hitung total SKS yang sudah diambil saat ini
	var currentEnrollments []models.Enrollment
	config.DB.Preload("Course").Where("student_id = ?", req.StudentID).Find(&currentEnrollments)

	totalSKS := 0
	for _, e := range currentEnrollments {
		totalSKS += e.Course.SKS
	}

	// Ambil data student untuk cek batas MaxSKS
	var student models.Student
	if err := config.DB.First(&student, req.StudentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Mahasiswa tidak ditemukan"})
		return
	}

	// Tolak jika melebihi batas
	if totalSKS+course.SKS > student.MaxSKS {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("SKS melebihi batas maksimum (%d SKS)!", student.MaxSKS),
		})
		return
	}

	// 3. Simpan enrollment
	enrollment := models.Enrollment{
		StudentID: req.StudentID,
		CourseID:  req.CourseID,
	}

	if err := config.DB.Create(&enrollment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan FRS"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Berhasil mengambil mata kuliah!", "data": enrollment})
}

// @Summary Mendapatkan daftar FRS mahasiswa
// @Tags FRS
// @Produce json
// @Param student_id path int true "ID Mahasiswa"
// @Success 200 {object} map[string]interface{}
// @Router /api/frs/{student_id} [get]
func GetStudentFRS(c *gin.Context) {
	studentID := c.Param("student_id")
	var enrollments []models.Enrollment

	// Mengambil data enrollment beserta detail Course-nya (Preload)
	config.DB.Preload("Course").Where("student_id = ?", studentID).Find(&enrollments)

	totalSKS := 0
	for _, e := range enrollments {
		totalSKS += e.Course.SKS
	}

	c.JSON(http.StatusOK, gin.H{
		"enrollments": enrollments,
		"total_sks":   totalSKS,
	})
}

// @Summary Membatalkan mata kuliah (Drop)
// @Tags FRS
// @Param id path int true "Enrollment ID"
// @Success 200 {object} map[string]interface{}
// @Router /api/frs/{id} [delete]
func DropCourse(c *gin.Context) {
	id := c.Param("id")
	if err := config.DB.Delete(&models.Enrollment{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membatalkan mata kuliah"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Mata kuliah berhasil dibatalkan"})
}
