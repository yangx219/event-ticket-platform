package com.devtiro.tickets.repositories;

import com.devtiro.tickets.domain.entities.Payment;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

  List<Payment> findByOrderIdOrderByCreatedAtDesc(UUID orderId);
}
