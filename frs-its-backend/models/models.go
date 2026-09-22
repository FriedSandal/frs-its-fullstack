package models

import "time"

type Student struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	NRP      string `gorm:"unique;not null" json:"nrp"`
	Name     string `gorm:"not null" json:"name"`
	Username string `gorm:"unique" json:"username"`
	Password string `json:"password"` // Plain text tanpa enkripsi
	MaxSKS   int    `gorm:"default:24" json:"max_sks"`
}

type Course struct {
	ID    uint   `gorm:"primaryKey" json:"id"`
	Code  string `gorm:"unique;not null" json:"code"`
	Name  string `gorm:"not null" json:"name"`
	SKS   int    `gorm:"not null" json:"sks"`
	Quota int    `gorm:"not null" json:"quota"`
}

type Enrollment struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	StudentID uint      `gorm:"not null" json:"student_id"`
	CourseID  uint      `gorm:"not null" json:"course_id"`
	Student   Student   `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	Course    Course    `gorm:"foreignKey:CourseID" json:"course,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type EnrollRequest struct {
	StudentID uint `json:"student_id" binding:"required"`
	CourseID  uint `json:"course_id" binding:"required"`
}

// Struct untuk payload login
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}
