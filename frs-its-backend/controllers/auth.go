package controllers

import (
	"frs-its-backend/config"
	"frs-its-backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

// @Summary Login Mahasiswa Sederhana
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body models.LoginRequest true "Username dan Password"
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Router /api/login [post]
func Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format input tidak valid"})
		return
	}

	var student models.Student
	// Mencocokkan username (bisa username atau NRP) dan password plain text langsung
	err := config.DB.Where("(username = ? OR nrp = ?) AND password = ?", req.Username, req.Username, req.Password).First(&student).Error
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Username/NRP atau password salah!"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login berhasil!",
		"student": student,
	})
}
