package org.accounting;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class AccountingRepository {

    public void createTableIfNotExists() {

        String sql = """
            CREATE TABLE IF NOT EXISTS payments (
                payment_id SERIAL PRIMARY KEY,
                order_id VARCHAR(255) UNIQUE NOT NULL,
                amount DOUBLE PRECISION NOT NULL,
                authorized BOOLEAN NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """;

        String alterSql = "ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.execute();
            try (PreparedStatement alterStmt = conn.prepareStatement(alterSql)) {
                alterStmt.execute();
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    public boolean authorizePayment(String orderId, double amount) {

        // Authorize payments when amount <= 100 
        boolean authorized = amount <= 100;

        String sql = """
            INSERT INTO payments(order_id, amount, authorized)
            VALUES (?, ?, ?)
        """;

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, orderId);
            stmt.setDouble(2, amount);
            stmt.setBoolean(3, authorized);

            stmt.executeUpdate();

            System.out.println("💳 Payment for " + orderId + " => " + authorized);

            return authorized;

        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean isAuthorized(String orderId) {

        String sql = "SELECT authorized FROM payments WHERE order_id = ?";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, orderId);

            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                return rs.getBoolean("authorized");
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return false;
    }
}