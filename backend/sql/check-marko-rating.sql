-- Proveri ocenu Marka Nikolića u bazi
SELECT 
  s.id as stylist_id,
  u.name as stylist_name,
  s.rating,
  s."totalReviews",
  COUNT(r.id) as actual_review_count,
  AVG(r.rating) as calculated_avg_rating
FROM "Stylist" s
JOIN "User" u ON s."userId" = u.id
LEFT JOIN "Review" r ON r."stylistId" = s.id
WHERE u.email = 'marko@salon.com'
GROUP BY s.id, u.name, s.rating, s."totalReviews";

-- Proveri sve review-e za Marka
SELECT 
  r.id,
  r.rating,
  r.comment,
  r."createdAt",
  u_customer.name as customer_name
FROM "Review" r
JOIN "Stylist" s ON r."stylistId" = s.id
JOIN "User" u_stylist ON s."userId" = u_stylist.id
JOIN "User" u_customer ON r."customerId" = u_customer.id
WHERE u_stylist.email = 'marko@salon.com'
ORDER BY r."createdAt" DESC;

