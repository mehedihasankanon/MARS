CREATE TABLE Users (
    User_ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Username VARCHAR(100) UNIQUE NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    First_Name VARCHAR(50) NOT NULL,
    Last_Name VARCHAR(50),
    Profile_Picture VARCHAR(255),
    Phone_Number VARCHAR(20) NOT NULL,
    Is_Active BOOLEAN DEFAULT TRUE,
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Last_Login TIMESTAMP
);

CREATE TABLE Admins (
    Admin_ID UUID PRIMARY KEY,
    FOREIGN KEY (Admin_ID) REFERENCES Users(User_ID) ON DELETE CASCADE
);

CREATE TABLE Sellers (
    Seller_ID UUID PRIMARY KEY,
    Shop_Name VARCHAR(100),
    Rating DECIMAL(3, 2) CHECK (Rating BETWEEN 0 AND 5),
    Approved_By_Admin_ID UUID,
    Authorization_Date DATE,
    FOREIGN KEY (Seller_ID) REFERENCES Users(User_ID) ON DELETE CASCADE,
    FOREIGN KEY (Approved_By_Admin_ID) REFERENCES Admins(Admin_ID)
);

CREATE TABLE Customers (
    Customer_ID UUID PRIMARY KEY,
    Loyalty_Points INT DEFAULT 0,
    FOREIGN KEY (Customer_ID) REFERENCES Users(User_ID) ON DELETE CASCADE
);

CREATE TABLE Addresses (
    Address_ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    User_ID UUID NOT NULL,
    House VARCHAR(50),
    Street_Road VARCHAR(100),
    City VARCHAR(50),
    Zip_Code VARCHAR(20),
    Address_Type VARCHAR(20),
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE
);

CREATE TABLE Categories (
    Category_ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Name VARCHAR(50) UNIQUE NOT NULL,
    Description TEXT,
    Image VARCHAR(255),
    Last_Updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Parent_Category_ID UUID, 
    Updated_By_Admin_ID UUID,
    FOREIGN KEY (Parent_Category_ID) REFERENCES Categories(Category_ID),
    FOREIGN KEY (Updated_By_Admin_ID) REFERENCES Admins(Admin_ID)
);

CREATE TABLE Products (
    Product_ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Seller_ID UUID NOT NULL,
    Category_ID UUID NOT NULL,
    Name VARCHAR(100) NOT NULL,
    Description TEXT,
    Unit_Price DECIMAL(10, 2) NOT NULL,
    Stock_Quantity INT DEFAULT 0,
    Condition_State VARCHAR(50),
    Adding_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Seller_ID) REFERENCES Sellers(Seller_ID),
    FOREIGN KEY (Category_ID) REFERENCES Categories(Category_ID)
);

CREATE TABLE Product_Images (
    Image_ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Product_ID UUID NOT NULL,
    Image_URL VARCHAR(255),
    FOREIGN KEY (Product_ID) REFERENCES Products(Product_ID) ON DELETE CASCADE
);

CREATE TABLE Product_Varieties (
    Variety_ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Product_ID UUID NOT NULL,
    Variety_Name VARCHAR(50),
    FOREIGN KEY (Product_ID) REFERENCES Products(Product_ID) ON DELETE CASCADE
);

CREATE TABLE Product_Offers (
    Offer_ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Product_ID UUID NOT NULL,
    Created_By_Seller_ID UUID NOT NULL,
    Offer_Percent DECIMAL(5, 2),
    Start_Date TIMESTAMP,
    Expiry_Date TIMESTAMP,
    FOREIGN KEY (Product_ID) REFERENCES Products(Product_ID) ON DELETE CASCADE,
    FOREIGN KEY (Created_By_Seller_ID) REFERENCES Sellers(Seller_ID)
);

CREATE TABLE Carts (
    Cart_ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Customer_ID UUID UNIQUE NOT NULL,
    Total_Amount DECIMAL(10, 2) DEFAULT 0.00,
    FOREIGN KEY (Customer_ID) REFERENCES Customers(Customer_ID) ON DELETE CASCADE
);

CREATE TABLE Cart_Items (
    Cart_ID UUID NOT NULL,
    Product_ID UUID NOT NULL,
    Quantity INT NOT NULL CHECK (Quantity > 0),
    Net_Price DECIMAL(10, 2),
    PRIMARY KEY (Cart_ID, Product_ID),
    FOREIGN KEY (Cart_ID) REFERENCES Carts(Cart_ID) ON DELETE CASCADE,
    FOREIGN KEY (Product_ID) REFERENCES Products(Product_ID) ON DELETE CASCADE
);

CREATE TABLE Wishlists (
    Customer_ID UUID NOT NULL,
    Product_ID UUID NOT NULL,
    PRIMARY KEY (Customer_ID, Product_ID),
    FOREIGN KEY (Customer_ID) REFERENCES Customers(Customer_ID) ON DELETE CASCADE,
    FOREIGN KEY (Product_ID) REFERENCES Products(Product_ID) ON DELETE CASCADE
);

CREATE TABLE Questions (
    Question_ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Product_ID UUID NOT NULL,
    Customer_ID UUID NOT NULL,
    Seller_ID UUID,
    Question_Text TEXT,
    Answer_Text TEXT,
    Question_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Answer_Date TIMESTAMP,
    FOREIGN KEY (Customer_ID) REFERENCES Customers(Customer_ID) ON DELETE CASCADE,
    FOREIGN KEY (Seller_ID) REFERENCES Sellers(Seller_ID),
    FOREIGN KEY (Product_ID) REFERENCES Products(Product_ID) ON DELETE CASCADE
);

CREATE TABLE Reviews (
    Review_ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Customer_ID UUID NOT NULL,
    Product_ID UUID NOT NULL,
    Comment_Body TEXT,
    Rating INT CHECK (Rating BETWEEN 1 AND 5),
    Review_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Customer_ID) REFERENCES Customers(Customer_ID) ON DELETE CASCADE,
    FOREIGN KEY (Product_ID) REFERENCES Products(Product_ID) ON DELETE CASCADE
);

CREATE TABLE Coupons (
    Coupon_ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Created_By_Admin_ID UUID,
    Discount_Percent DECIMAL(5, 2),
    Expiry_Date TIMESTAMP,
    FOREIGN KEY (Created_By_Admin_ID) REFERENCES Admins(Admin_ID)
);

CREATE TABLE Orders (
    Order_ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Customer_ID UUID NOT NULL,
    Coupon_ID UUID,
    Order_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Delivery_Fee DECIMAL(10, 2),
    Total_Amount DECIMAL(10, 2),
    Discounted_Net_Price DECIMAL(10, 2),
    Order_Status VARCHAR(50),
    Monitored_By_Admin_ID UUID,
    FOREIGN KEY (Customer_ID) REFERENCES Customers(Customer_ID),
    FOREIGN KEY (Coupon_ID) REFERENCES Coupons(Coupon_ID),
    FOREIGN KEY (Monitored_By_Admin_ID) REFERENCES Admins(Admin_ID)
);

CREATE TABLE Order_Items (
    Order_ID UUID NOT NULL,
    Product_ID UUID NOT NULL,
    Quantity INT NOT NULL,
    Net_Price DECIMAL(10, 2),
    PRIMARY KEY (Order_ID, Product_ID),
    FOREIGN KEY (Order_ID) REFERENCES Orders(Order_ID) ON DELETE CASCADE,
    FOREIGN KEY (Product_ID) REFERENCES Products(Product_ID)
);

CREATE TABLE Payments (
    Payment_ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Order_ID UUID UNIQUE NOT NULL,
    Payment_Method VARCHAR(50),
    Payment_Status VARCHAR(50),
    Payment_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Order_ID) REFERENCES Orders(Order_ID) ON DELETE CASCADE
);

CREATE TABLE Shipments (
    Shipment_ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Order_ID UUID UNIQUE NOT NULL,
    Address_ID UUID NOT NULL,
    Tracking_Number VARCHAR(100),
    Shipment_Date TIMESTAMP,
    Estimated_Delivery_Date TIMESTAMP,
    FOREIGN KEY (Order_ID) REFERENCES Orders(Order_ID) ON DELETE CASCADE,
    FOREIGN KEY (Address_ID) REFERENCES Addresses(Address_ID)
);

CREATE TABLE Shipment_Status_History (
    Status_ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Shipment_ID UUID NOT NULL,
    Status VARCHAR(50),
    Status_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Shipment_ID) REFERENCES Shipments(Shipment_ID) ON DELETE CASCADE
);

CREATE TABLE Returns (
    Return_ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Order_ID UUID NOT NULL,
    Customer_ID UUID NOT NULL,
    Reason TEXT,
    Status VARCHAR(50),
    Return_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Refund_Amount DECIMAL(10, 2),
    FOREIGN KEY (Order_ID) REFERENCES Orders(Order_ID),
    FOREIGN KEY (Customer_ID) REFERENCES Customers(Customer_ID)
);

CREATE TABLE Return_Items (
    Return_ID UUID NOT NULL,
    Product_ID UUID NOT NULL,
    Quantity INT NOT NULL,
    PRIMARY KEY (Return_ID, Product_ID),
    FOREIGN KEY (Return_ID) REFERENCES Returns(Return_ID) ON DELETE CASCADE,
    FOREIGN KEY (Product_ID) REFERENCES Products(Product_ID)
);