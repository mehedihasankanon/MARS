# MARS Database Schema Reference

## Quick Table Overview

### User Management (ISA Hierarchy)
```
Users (base)
├── Admins
├── Sellers
└── Customers
```

**Users** - Base user table with authentication
- `User_ID` (UUID, PK)
- `Username`, `Email` (unique)
- `Password` (hashed)
- `First_Name`, `Last_Name`, `Phone_Number`
- `Profile_Picture`, `Is_Active`

**Admins** - Admin privileges
- `Admin_ID` (UUID, PK/FK → Users)

**Sellers** - Seller accounts
- `Seller_ID` (UUID, PK/FK → Users)
- `Shop_Name`, `Rating`
- `Approved_By_Admin_ID` (FK → Admins)
- `Authorization_Date`

**Customers** - Customer accounts
- `Customer_ID` (UUID, PK/FK → Users)
- `Loyalty_Points`

**Addresses** - User addresses
- `Address_ID` (UUID, PK)
- `User_ID` (FK → Users)
- `House`, `Street_Road`, `City`, `Zip_Code`
- `Address_Type`

---

### Product Catalog

**Categories** - Product categories (hierarchical)
- `Category_ID` (UUID, PK)
- `Name` (unique), `Description`, `Image`
- `Parent_Category_ID` (FK → Categories, self-reference)
- `Updated_By_Admin_ID` (FK → Admins)

**Products** - Product listings
- `Product_ID` (UUID, PK)
- `Seller_ID` (FK → Sellers)
- `Category_ID` (FK → Categories)
- `Name`, `Description`, `Unit_Price`
- `Stock_Quantity`, `Condition_State`
- `Adding_Date`

**Product_Images** - Product photos
- `Image_ID` (UUID, PK)
- `Product_ID` (FK → Products)
- `Image_URL`

**Product_Varieties** - Product variations
- `Variety_ID` (UUID, PK)
- `Product_ID` (FK → Products)
- `Variety_Name`

**Product_Offers** - Time-limited discounts
- `Offer_ID` (UUID, PK)
- `Product_ID` (FK → Products)
- `Created_By_Seller_ID` (FK → Sellers)
- `Offer_Percent`, `Start_Date`, `Expiry_Date`

---

### Shopping Experience

**Carts** - Shopping carts (1 per customer)
- `Cart_ID` (UUID, PK)
- `Customer_ID` (UUID, FK → Customers, unique)
- `Total_Amount`

**Cart_Items** - Items in cart
- `Cart_ID`, `Product_ID` (composite PK)
- `Quantity`, `Net_Price`

**Wishlists** - Customer wishlists
- `Customer_ID`, `Product_ID` (composite PK)

---

### Customer Interaction

**Questions** - Product Q&A
- `Question_ID` (UUID, PK)
- `Product_ID` (FK → Products)
- `Customer_ID` (FK → Customers)
- `Seller_ID` (FK → Sellers)
- `Question_Text`, `Answer_Text`
- `Question_Date`, `Answer_Date`

**Reviews** - Product reviews
- `Review_ID` (UUID, PK)
- `Customer_ID` (FK → Customers)
- `Product_ID` (FK → Products)
- `Comment_Body`, `Rating` (1-5)
- `Review_Date`

---

### Order Processing

**Coupons** - Discount coupons
- `Coupon_ID` (UUID, PK)
- `Created_By_Admin_ID` (FK → Admins)
- `Discount_Percent`, `Expiry_Date`

**Orders** - Customer orders
- `Order_ID` (UUID, PK)
- `Customer_ID` (FK → Customers)
- `Coupon_ID` (FK → Coupons)
- `Order_Date`, `Delivery_Fee`
- `Total_Amount`, `Discounted_Net_Price`
- `Order_Status`
- `Monitored_By_Admin_ID` (FK → Admins)

**Order_Items** - Order line items
- `Order_ID`, `Product_ID` (composite PK)
- `Quantity`, `Net_Price`

**Payments** - Payment records
- `Payment_ID` (UUID, PK)
- `Order_ID` (FK → Orders, unique)
- `Payment_Method`, `Payment_Status`
- `Payment_Date`

**Shipments** - Shipping information
- `Shipment_ID` (UUID, PK)
- `Order_ID` (FK → Orders, unique)
- `Address_ID` (FK → Addresses)
- `Tracking_Number`
- `Shipment_Date`, `Estimated_Delivery_Date`

**Shipment_Status_History** - Tracking updates
- `Status_ID` (UUID, PK)
- `Shipment_ID` (FK → Shipments)
- `Status`, `Status_Date`

---

### Returns & Refunds

**Returns** - Return requests
- `Return_ID` (UUID, PK)
- `Order_ID` (FK → Orders)
- `Customer_ID` (FK → Customers)
- `Reason`, `Status`
- `Return_Date`, `Refund_Amount`

**Return_Items** - Items being returned
- `Return_ID`, `Product_ID` (composite PK)
- `Quantity`

---

## Key Relationships

### One-to-One
- `Orders` ←→ `Payments`
- `Orders` ←→ `Shipments`
- `Users` ←→ `Admins/Sellers/Customers` (ISA)
- `Customers` ←→ `Carts`

### One-to-Many
- `Users` → `Addresses`
- `Sellers` → `Products`
- `Products` → `Product_Images`
- `Products` → `Product_Varieties`
- `Products` → `Reviews`
- `Customers` → `Orders`
- `Shipments` → `Shipment_Status_History`

### Many-to-Many
- `Customers` ←→ `Products` (via `Wishlists`)
- `Carts` ←→ `Products` (via `Cart_Items`)
- `Orders` ←→ `Products` (via `Order_Items`)
- `Returns` ←→ `Products` (via `Return_Items`)

---

## Important Notes

1. **UUIDs Everywhere**: All primary keys use `UUID` instead of integers
2. **ISA Pattern**: Admins, Sellers, and Customers all inherit from Users
3. **Soft Deletes**: Use `Users.Is_Active` flag instead of deleting users
4. **Referential Integrity**: Extensive use of foreign keys with CASCADE/RESTRICT
5. **Timestamps**: Most tables have creation timestamps
6. **Check Constraints**: Rating (0-5), Review rating (1-5), Quantity > 0

---

## Common Query Patterns

```sql
-- Get user with role
SELECT u.*, 
  CASE 
    WHEN a.Admin_ID IS NOT NULL THEN 'admin'
    WHEN s.Seller_ID IS NOT NULL THEN 'seller'
    WHEN c.Customer_ID IS NOT NULL THEN 'customer'
  END as role
FROM Users u
LEFT JOIN Admins a ON u.User_ID = a.Admin_ID
LEFT JOIN Sellers s ON u.User_ID = s.Seller_ID
LEFT JOIN Customers c ON u.User_ID = c.Customer_ID
WHERE u.User_ID = $1;
```

```sql
-- Product with all details
SELECT p.*, 
  cat.Name as category_name,
  s.Shop_Name,
  AVG(r.Rating) as avg_rating,
  COUNT(r.Review_ID) as review_count
FROM Products p
JOIN Categories cat ON p.Category_ID = cat.Category_ID
JOIN Sellers s ON p.Seller_ID = s.Seller_ID
LEFT JOIN Reviews r ON p.Product_ID = r.Product_ID
WHERE p.Product_ID = $1
GROUP BY p.Product_ID, cat.Name, s.Shop_Name;
```
