const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'PMS.db');
const db = new DatabaseSync(dbPath);

console.log(`Connecting/Creating SQLite database at: ${dbPath}`);

// Create Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    UserName TEXT UNIQUE NOT NULL,
    Password TEXT NOT NULL,
    Role TEXT NOT NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS Vehicle (
    Plate_Number TEXT PRIMARY KEY,
    Brand TEXT NOT NULL,
    Model TEXT NOT NULL,
    Year INTEGER NOT NULL,
    Vehicle_Type TEXT NOT NULL,
    Purchase_Price REAL NOT NULL,
    Status TEXT NOT NULL,
    Registered_By INTEGER,
    FOREIGN KEY(Registered_By) REFERENCES Users(id) ON DELETE SET NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS Customer (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    FirstName TEXT NOT NULL,
    LastName TEXT NOT NULL,
    Email TEXT UNIQUE NOT NULL,
    PhoneNumber TEXT NOT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    Status TEXT NOT NULL,
    Registered_By INTEGER,
    FOREIGN KEY(Registered_By) REFERENCES Users(id) ON DELETE SET NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS Promotion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    Title TEXT NOT NULL,
    Description TEXT,
    Discount_Type TEXT NOT NULL,
    Discount_Value REAL NOT NULL,
    Start_Date TEXT NOT NULL,
    End_Date TEXT NOT NULL,
    Status TEXT NOT NULL,
    Created_By INTEGER,
    FOREIGN KEY(Created_By) REFERENCES Users(id) ON DELETE SET NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS Promotion_Vehicle (
    Promotion_Id INTEGER,
    Vehicle_Plate_Number TEXT,
    Performance TEXT NOT NULL,
    PRIMARY KEY(Promotion_Id, Vehicle_Plate_Number),
    FOREIGN KEY(Promotion_Id) REFERENCES Promotion(id) ON DELETE CASCADE,
    FOREIGN KEY(Vehicle_Plate_Number) REFERENCES Vehicle(Plate_Number) ON DELETE CASCADE
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS Customer_Interest (
    Customer_Id INTEGER,
    Vehicle_Plate_Number TEXT,
    PRIMARY KEY(Customer_Id, Vehicle_Plate_Number),
    FOREIGN KEY(Customer_Id) REFERENCES Customer(id) ON DELETE CASCADE,
    FOREIGN KEY(Vehicle_Plate_Number) REFERENCES Vehicle(Plate_Number) ON DELETE CASCADE
  );
`);

// Seed Data helper
const getUsersCount = db.prepare("SELECT COUNT(*) as count FROM Users").get();
if (getUsersCount.count === 0) {
  console.log("Seeding initial data...");

  // Seed Users
  const insertUser = db.prepare("INSERT INTO Users (UserName, Password, Role) VALUES (?, ?, ?)");
  const adminHash = bcrypt.hashSync('admin123', 10);
  const agentHash = bcrypt.hashSync('agent123', 10);
  
  insertUser.run('admin', adminHash, 'Admin');
  insertUser.run('agent1', agentHash, 'Agent');

  console.log("Users seeded successfully!");

  // Seed Vehicles
  const insertVehicle = db.prepare(`
    INSERT INTO Vehicle (Plate_Number, Brand, Model, Year, Vehicle_Type, Purchase_Price, Status, Registered_By)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertVehicle.run('RAA 101 A', 'Toyota', 'Rav4', 2020, 'SUV', 25000, 'Available', 1);
  insertVehicle.run('RAB 202 B', 'Hyundai', 'Tucson', 2021, 'SUV', 28000, 'Available', 1);
  insertVehicle.run('RAC 303 C', 'Mercedes', 'C-Class', 2019, 'Sedan', 35000, 'Available', 2);
  insertVehicle.run('RAD 404 D', 'Toyota', 'Land Cruiser', 2022, 'SUV', 65000, 'Available', 1);
  insertVehicle.run('RAE 505 E', 'BMW', 'X5', 2020, 'SUV', 45000, 'Available', 2);

  console.log("Vehicles seeded successfully!");

  // Seed Customers
  const insertCustomer = db.prepare(`
    INSERT INTO Customer (FirstName, LastName, Email, PhoneNumber, Status, Registered_By)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertCustomer.run('Jean', 'Rwandarugari', 'jean@gmail.com', '0788123456', 'Active', 1);
  insertCustomer.run('Marie', 'Uwimana', 'marie@gmail.com', '0788654321', 'Active', 2);
  insertCustomer.run('Eric', 'Mugisha', 'eric@gmail.com', '0788112233', 'Blocked', 1);
  insertCustomer.run('Alice', 'Mutoni', 'alice@gmail.com', '0789000000', 'Inactive', 1);

  console.log("Customers seeded successfully!");

  // Seed Promotions
  const insertPromotion = db.prepare(`
    INSERT INTO Promotion (Title, Description, Discount_Type, Discount_Value, Start_Date, End_Date, Status, Created_By)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertPromotion.run('New Year sale', 'Huge discounts for New Year!', 'percentage', 10, '2026-01-01', '2026-01-15', 'Active', 1);
  insertPromotion.run('Holiday Price Slash', 'Flat rate drop for holidays', 'FLAT_RATE', 1500, '2026-06-01', '2026-06-30', 'Active', 1);
  insertPromotion.run('Weekend Flash Sale', 'Quick drop for the weekend', 'percentage', 5, '2026-06-06', '2026-06-08', 'Active', 2);
  insertPromotion.run('Clearance Discount Offer', 'Clean up the old fleet models', 'amount', 3000, '2026-07-01', '2026-07-31', 'Draft', 1);

  console.log("Promotions seeded successfully!");

  // Seed Promotion_Vehicle
  const insertPromoVehicle = db.prepare(`
    INSERT INTO Promotion_Vehicle (Promotion_Id, Vehicle_Plate_Number, Performance)
    VALUES (?, ?, ?)
  `);
  insertPromoVehicle.run(1, 'RAA 101 A', 'High');
  insertPromoVehicle.run(2, 'RAB 202 B', 'Medium');
  insertPromoVehicle.run(3, 'RAC 303 C', 'Low');
  insertPromoVehicle.run(1, 'RAD 404 D', 'High');
  insertPromoVehicle.run(2, 'RAE 505 E', 'Medium');

  console.log("Promotion-Vehicle links seeded!");

  // Seed Customer_Interest
  const insertCustomerInterest = db.prepare(`
    INSERT INTO Customer_Interest (Customer_Id, Vehicle_Plate_Number)
    VALUES (?, ?)
  `);
  insertCustomerInterest.run(1, 'RAA 101 A'); // Jean interested in RAA 101 A (has promo 1)
  insertCustomerInterest.run(1, 'RAC 303 C'); // Jean interested in RAC 303 C (has promo 3)
  insertCustomerInterest.run(2, 'RAB 202 B'); // Marie interested in RAB 202 B (has promo 2)
  insertCustomerInterest.run(2, 'RAE 505 E'); // Marie interested in RAE 505 E (has promo 2)
  insertCustomerInterest.run(4, 'RAA 101 A'); // Alice interested in RAA 101 A (has promo 1)

  console.log("Customer Interests seeded!");
}

module.exports = db;
