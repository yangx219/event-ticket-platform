package com.devtiro.tickets.repositories;

import com.devtiro.tickets.domain.entities.CustomerOrder;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends JpaRepository<CustomerOrder, UUID> {

  Page<CustomerOrder> findByPurchaserId(UUID purchaserId, Pageable pageable);

  Optional<CustomerOrder> findByIdAndPurchaserId(UUID id, UUID purchaserId);

  Optional<CustomerOrder> findByPurchaserIdAndIdempotencyKey(
      UUID purchaserId,
      String idempotencyKey
  );
}
