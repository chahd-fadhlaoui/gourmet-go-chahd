package org.order;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class OrderRepository {

    public void createTableIfNotExists() {

        String sql = """
            CREATE TABLE IF NOT EXISTS orders (
                order_id VARCHAR(255) PRIMARY KEY,
                status VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """;

        String alterSql = "ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP";

        try (
                Connection conn = DatabaseConnection.getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql)
        ) {

            stmt.execute();
            try (PreparedStatement alterStmt = conn.prepareStatement(alterSql)) {
                alterStmt.execute();
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    public void updateStatus(String orderId, String status) {

        String sql = """
            INSERT INTO orders(order_id, status)
            VALUES (?, ?)
            ON CONFLICT (order_id)
            DO UPDATE SET status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP
        """;

        try (
                Connection conn = DatabaseConnection.getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql)
        ) {

            stmt.setString(1, orderId);
            stmt.setString(2, status);

            stmt.executeUpdate();

            System.out.println(
                    "📦 Order updated: " +
                            orderId +
                            " -> " +
                            status
            );

        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    public String getStatus(String orderId) {

        String sql =
                "SELECT status FROM orders WHERE order_id = ?";

        try (
                Connection conn = DatabaseConnection.getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql)
        ) {

            stmt.setString(1, orderId);

            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                return rs.getString("status");
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return "UNKNOWN";
    }
}