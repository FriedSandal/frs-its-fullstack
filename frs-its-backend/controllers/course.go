package controllers

import (
	"frs-its-backend/config"
	"frs-its-backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

// @Summary Mendapatkan daftar semua mata kuliah
// @Tags Course
// @Produce json
// @Success 200 {array} models.Course
// @Router /api/courses [get]
func GetCourses(c *gin.Context) {
	var courses []models.Course
	if err := config.DB.Find(&courses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil daftar mata kuliah"})
		return
	}
	c.JSON(http.StatusOK, courses)
}
