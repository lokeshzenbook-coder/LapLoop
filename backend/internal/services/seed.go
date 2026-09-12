package services

import (
	"context"
	"fmt"
	"log"

	"golang.org/x/crypto/bcrypt"

	"marketplace/internal/models"
	"marketplace/internal/repositories"
)

// Seed inserts demo users and listings on first boot so the marketplace
// is immediately browsable. Password for all demo accounts: password123.
func Seed(ctx context.Context, store *repositories.Store) error {
	count, err := store.CountLaptops(ctx)
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	hash, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	type seedUser struct {
		name, email, location, phone string
	}
	seedUsers := []seedUser{
		{"Alex Rivera", "alex@example.com", "Berlin, Germany", "+49 170 1112233"},
		{"Mia Tanaka", "mia@example.com", "London, UK", "+44 7700 900123"},
		{"Jonas Weber", "jonas@example.com", "Munich, Germany", "+49 151 5556677"},
		{"Priya Patel", "priya@example.com", "Toronto, Canada", "+1 416 555 0199"},
	}

	userIDs := []int64{}
	for _, su := range seedUsers {
		u := &models.User{
			Name: su.name, Email: su.email, PasswordHash: string(hash),
			Location: su.location, Phone: su.phone,
		}
		id, err := store.CreateUser(ctx, u)
		if err != nil {
			return err
		}
		userIDs = append(userIDs, id)
	}

	seeds := []models.Laptop{
		{UserID: userIDs[0], Brand: "Apple", Model: "MacBook Pro 14\" M1 Pro", CPU: "Apple M1 Pro (10-core)", RAMGB: 16, StorageGB: 512, StorageType: "SSD", GPU: "Integrated 16-core GPU", Display: "14.2\" Liquid Retina XDR, 3024x1964", Condition: "excellent", AgeYears: 2, BatteryHealth: 93, Price: 1249, Location: "Berlin, Germany", Description: "Immaculate 2021 MacBook Pro 14\". Bought as a personal machine, always used with a hard shell and keyboard cover. Battery holds a full workday. Original charger and box included. Reason for selling: upgraded to the M4 Max.", Status: "active"},
		{UserID: userIDs[1], Brand: "Lenovo", Model: "ThinkPad X1 Carbon Gen 10", CPU: "Intel Core i7-1260P", RAMGB: 32, StorageGB: 1024, StorageType: "SSD", GPU: "Intel Iris Xe", Display: "14\" WUXGA IPS, 1920x1200", Condition: "good", AgeYears: 3, BatteryHealth: 87, Price: 720, Location: "London, UK", Description: "Solid business machine, zero issues. Minor scuff on the bottom lid. 32GB RAM handles multiple VMs comfortably. Includes 65W USB-C charger only (no box).", Status: "active"},
		{UserID: userIDs[2], Brand: "Dell", Model: "XPS 15 9520", CPU: "Intel Core i7-12700H", RAMGB: 16, StorageGB: 512, StorageType: "SSD", GPU: "NVIDIA RTX 3050 Ti", Display: "15.6\" FHD+ IPS, 1920x1200", Condition: "like-new", AgeYears: 1, BatteryHealth: 98, Price: 1350, Location: "Munich, Germany", Description: "Like-new XPS 15 with less than 20 battery cycles. RTX 3050 Ti for light gaming and CUDA work. Comes with charger and original packaging.", Status: "active"},
		{UserID: userIDs[3], Brand: "ASUS", Model: "ZenBook 14 OLED", CPU: "AMD Ryzen 7 5825U", RAMGB: 16, StorageGB: 512, StorageType: "SSD", GPU: "AMD Radeon Graphics", Display: "14\" OLED, 2880x1800", Condition: "fair", AgeYears: 4, BatteryHealth: 72, Price: 480, Location: "Toronto, Canada", Description: "Great OLED screen, strong Ryzen performance. Battery now only lasts ~3 hours. Hinge has a slight wobble. A honest workhorse at a fair price.", Status: "active"},
		{UserID: userIDs[0], Brand: "Apple", Model: "MacBook Air M1", CPU: "Apple M1 (8-core)", RAMGB: 8, StorageGB: 256, StorageType: "SSD", GPU: "Integrated 7-core GPU", Display: "13.3\" Retina, 2560x1600", Condition: "good", AgeYears: 3, BatteryHealth: 89, Price: 620, Location: "Berlin, Germany", Description: "Classic M1 Air, still a brilliant daily machine. Some cosmetic wear on the edges. Battery health 89%, charges to full. Selling to fund a desktop build.", Status: "active"},
		{UserID: userIDs[1], Brand: "HP", Model: "Spectre x360 14", CPU: "Intel Core i5-1135G7", RAMGB: 16, StorageGB: 512, StorageType: "SSD", GPU: "Intel Iris Xe", Display: "13.5\" OLED, 3000x2000", Condition: "excellent", AgeYears: 2, BatteryHealth: 91, Price: 690, Location: "London, UK", Description: "2-in-1 convertible in great condition. Comes with the active pen and sleeve. Perfect for note-takers and travellers.", Status: "sold"},
		{UserID: userIDs[2], Brand: "Framework", Model: "Laptop 13 DIY (11th Gen)", CPU: "Intel Core i5-1135G7", RAMGB: 16, StorageGB: 500, StorageType: "SSD", GPU: "Intel Iris Xe", Display: "13.5\" 2256x1504 3:2", Condition: "good", AgeYears: 3, BatteryHealth: 84, Price: 540, Location: "Munich, Germany", Description: "Repairable Framework 13, fully modular. Upgradable, easy to maintain — great intro to the Framework ecosystem. Includes expansion cards (USB-C, USB-A, HDMI).", Status: "active"},
		{UserID: userIDs[3], Brand: "Apple", Model: "MacBook Pro 16\" Intel", CPU: "Intel Core i9-9980HK", RAMGB: 64, StorageGB: 2048, StorageType: "SSD", GPU: "AMD Radeon Pro 5500M", Display: "16\" Retina, 3072x1920", Condition: "excellent", AgeYears: 5, BatteryHealth: 82, Price: 980, Location: "Toronto, Canada", Description: "Maxed-out Intel MacBook Pro with 64GB RAM and 2TB SSD. Ideal for audio/video work with legacy Intel-only plugs-ins. Well maintained, new battery last year.", Status: "active"},
		{UserID: userIDs[0], Brand: "Dell", Model: "Precision 5570", CPU: "Intel Core i7-12800H", RAMGB: 32, StorageGB: 1024, StorageType: "SSD", GPU: "NVIDIA RTX A1000", Display: "15.6\" UHD+ 3840x2400", Condition: "fair", AgeYears: 3, BatteryHealth: 68, Price: 850, Location: "Berlin, Germany", Description: "Workstation-class laptop, runs CAD and 3D workloads without breaking a sweat. Battery degraded, otherwise flawless. Price reflects the battery.", Status: "active"},
		{UserID: userIDs[1], Brand: "Acer", Model: "Swift 3", CPU: "AMD Ryzen 5 5500U", RAMGB: 8, StorageGB: 256, StorageType: "SSD", GPU: "AMD Radeon Graphics", Display: "14\" FHD TN, 1920x1080", Condition: "damaged", AgeYears: 4, BatteryHealth: 60, Price: 260, Location: "London, UK", Description: "Full disclosure: cracked screen glass (bottom corner) and worn battery. Works fine on an external monitor — make a great home server or budget fixer-upper.", Status: "active"},
	}

	picsumSeeds := []string{"laptop-mbp14", "laptop-x1c", "laptop-xps15", "laptop-zenbook",
		"laptop-air", "laptop-spectre", "laptop-framework", "laptop-mbp16", "laptop-precision", "laptop-swift3"}

	for i, seed := range seeds {
		id, err := store.CreateLaptop(ctx, &seed)
		if err != nil {
			return err
		}
		def := picsumSeeds[i%len(picsumSeeds)]
		imgs := []string{
			fmt.Sprintf("https://picsum.photos/seed/%s-1/900/675", def),
			fmt.Sprintf("https://picsum.photos/seed/%s-2/900/675", def),
		}
		for j, url := range imgs {
			img := &models.Image{LaptopID: id, URL: url, Position: j}
			if _, err := store.AddImage(ctx, img); err != nil {
				return err
			}
		}
	}

	log.Println("seeded demo data: 4 users, 10 laptops (login: alex@example.com / password123)")
	return nil
}
