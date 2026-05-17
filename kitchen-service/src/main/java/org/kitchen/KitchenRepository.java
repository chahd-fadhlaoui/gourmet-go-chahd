package org.kitchen;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class KitchenRepository{

    public void createTableIfNotExists() {

        String sql = """
            CREATE TABLE IF NOT EXISTS tickets (
                ticket_id SERIAL PRIMARY KEY,
                order_id VARCHAR(255) UNIQUE NOT NULL,
                status VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """;

        String alterSql = "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP";

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

    public boolean createTicket(String orderId) {

        String sql = """
            INSERT INTO tickets(order_id, status)
            VALUES (?, 'PENDING')
        """;

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, orderId);
            stmt.executeUpdate();

            System.out.println("🍳 Ticket created for: " + orderId);
            return true;

        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean approveTicket(String orderId) {

        String sql = """
        UPDATE tickets
        SET status = 'APPROVED',
            updated_at = CURRENT_TIMESTAMP
        WHERE order_id = ?
    """;

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, orderId);

            int updated = stmt.executeUpdate();

            System.out.println("✅ Ticket approved: " + orderId);

            return updated > 0;

        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean rejectTicket(String orderId) {

        String sql = """
            UPDATE tickets
            SET status = 'REJECTED',
                updated_at = CURRENT_TIMESTAMP
            WHERE order_id = ?
        """;

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, orderId);
            int updated = stmt.executeUpdate();

            System.out.println("❌ Ticket rejected: " + orderId);
            return updated > 0;

        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public String getStatus(String orderId) {

        String sql = "SELECT status FROM tickets WHERE order_id = ?";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

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