package models

import "time"

type Condition string

const (
	ConditionLikeNew   Condition = "like-new"
	ConditionExcellent Condition = "excellent"
	ConditionGood      Condition = "good"
	ConditionFair      Condition = "fair"
	ConditionDamaged   Condition = "damaged"
)

var ValidConditions = map[Condition]bool{
	ConditionLikeNew: true, ConditionExcellent: true, ConditionGood: true,
	ConditionFair: true, ConditionDamaged: true,
}

type Status string

const (
	StatusActive   Status = "active"
	StatusSold     Status = "sold"
	StatusInactive Status = "inactive"
)

var ValidStatuses = map[Status]bool{
	StatusActive: true, StatusSold: true, StatusInactive: true,
}

type User struct {
	ID           int64     `json:"id"`
	Name         string    `json:"name"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Location     string    `json:"location"`
	Phone        string    `json:"phone"`
	CreatedAt    time.Time `json:"createdAt"`
}

type PublicUser struct {
	ID       int64  `json:"id"`
	Name     string `json:"name"`
	Location string `json:"location"`
}

type Image struct {
	ID       int64  `json:"id"`
	LaptopID int64  `json:"laptopId"`
	URL      string `json:"url"`
	Key      string `json:"-"`
	Position int    `json:"position"`
}

type Laptop struct {
	ID            int64       `json:"id"`
	UserID        int64       `json:"-"`
	Brand         string      `json:"brand"`
	Model         string      `json:"model"`
	CPU           string      `json:"cpu"`
	RAMGB         int         `json:"ramGB"`
	StorageGB     int         `json:"storageGB"`
	StorageType   string      `json:"storageType"`
	GPU           string      `json:"gpu"`
	Display       string      `json:"display"`
	Condition     string      `json:"condition"`
	AgeYears      int         `json:"ageYears"`
	BatteryHealth int         `json:"batteryHealth"`
	Price         float64     `json:"price"`
	Location      string      `json:"location"`
	Description   string      `json:"description"`
	Status        string      `json:"status"`
	Views         int         `json:"views"`
	IsFavorite    bool        `json:"isFavorite,omitempty"`
	Seller        *PublicUser `json:"seller,omitempty"`
	Images        []Image     `json:"images,omitempty"`
	CreatedAt     time.Time   `json:"createdAt"`
	UpdatedAt     time.Time   `json:"updatedAt"`
}

type Favorite struct {
	UserID    int64     `json:"user_id"`
	LaptopID  int64     `json:"laptop_id"`
	CreatedAt time.Time `json:"created_at"`
}

type Inquiry struct {
	ID        int64     `json:"id"`
	LaptopID  int64     `json:"laptopId"`
	UserID    int64     `json:"userId"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Message   string    `json:"message"`
	CreatedAt time.Time `json:"createdAt"`
}

type Filter struct {
	Query      string
	Brand      string
	CPU        string
	Condition  string
	Location   string
	MinRAM     int
	MaxRAM     int
	MinStorage int
	MinPrice   float64
	MaxPrice   float64
	Sort       string
	Page       int
	Limit      int
}

func (f *Filter) Offset() int {
	if f.Page < 1 {
		f.Page = 1
	}
	return (f.Page - 1) * f.Limit
}
