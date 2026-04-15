-- Analytics views for revenue forecasting and host KPIs
-- SECURITY INVOKER so existing RLS on bookings/properties/availability applies

-- Monthly revenue per host (confirmed + completed bookings)
CREATE OR REPLACE VIEW host_monthly_revenue
WITH (security_invoker = true)
AS
SELECT
  b.host_id,
  to_char(date_trunc('month', b.check_in), 'YYYY-MM') AS month,
  COALESCE(SUM(b.total_price), 0)::numeric AS revenue,
  COUNT(*)::int AS bookings_count,
  COALESCE(SUM((b.check_out::date - b.check_in::date)), 0)::int AS nights_booked
FROM bookings b
WHERE b.status IN ('confirmed', 'completed')
GROUP BY b.host_id, date_trunc('month', b.check_in);

-- Property-level monthly occupancy
CREATE OR REPLACE VIEW property_occupancy
WITH (security_invoker = true)
AS
WITH months AS (
  SELECT DISTINCT date_trunc('month', d)::date AS month_start
  FROM generate_series(
    (CURRENT_DATE - INTERVAL '12 months')::date,
    (CURRENT_DATE + INTERVAL '6 months')::date,
    INTERVAL '1 day'
  ) d
),
booked AS (
  SELECT
    b.property_id,
    b.host_id,
    date_trunc('month', gs)::date AS month_start,
    COUNT(*)::int AS nights_booked
  FROM bookings b
  CROSS JOIN LATERAL generate_series(b.check_in::date, (b.check_out::date - INTERVAL '1 day')::date, INTERVAL '1 day') gs
  WHERE b.status IN ('confirmed', 'completed')
  GROUP BY b.property_id, b.host_id, date_trunc('month', gs)
)
SELECT
  p.id AS property_id,
  p.host_id,
  to_char(m.month_start, 'YYYY-MM') AS month,
  COALESCE(bk.nights_booked, 0)::int AS nights_booked,
  (EXTRACT(DAY FROM (m.month_start + INTERVAL '1 month' - INTERVAL '1 day')))::int AS nights_available,
  CASE
    WHEN EXTRACT(DAY FROM (m.month_start + INTERVAL '1 month' - INTERVAL '1 day')) > 0
    THEN ROUND(
      COALESCE(bk.nights_booked, 0)::numeric
      / EXTRACT(DAY FROM (m.month_start + INTERVAL '1 month' - INTERVAL '1 day'))::numeric
      * 100, 2)
    ELSE 0
  END AS occupancy_rate
FROM properties p
CROSS JOIN months m
LEFT JOIN booked bk
  ON bk.property_id = p.id AND bk.month_start = m.month_start;

-- 12-month KPIs per host
CREATE OR REPLACE VIEW host_kpis
WITH (security_invoker = true)
AS
WITH recent AS (
  SELECT *
  FROM bookings
  WHERE status IN ('confirmed', 'completed')
    AND check_in >= (CURRENT_DATE - INTERVAL '12 months')
),
agg AS (
  SELECT
    host_id,
    COALESCE(SUM(total_price), 0)::numeric AS total_revenue_12m,
    COUNT(*)::int AS total_bookings_12m,
    CASE WHEN COUNT(*) > 0
      THEN ROUND(SUM(total_price)::numeric / COUNT(*)::numeric, 2)
      ELSE 0 END AS avg_booking_value,
    CASE WHEN COUNT(*) > 0
      THEN ROUND(SUM(check_out::date - check_in::date)::numeric / COUNT(*)::numeric, 2)
      ELSE 0 END AS avg_stay_length
  FROM recent
  GROUP BY host_id
),
props AS (
  SELECT host_id, COUNT(*)::int AS active_properties
  FROM properties
  WHERE status = 'active'
  GROUP BY host_id
)
SELECT
  p.host_id,
  COALESCE(a.total_revenue_12m, 0)::numeric AS total_revenue_12m,
  COALESCE(a.total_bookings_12m, 0)::int AS total_bookings_12m,
  COALESCE(a.avg_booking_value, 0)::numeric AS avg_booking_value,
  COALESCE(a.avg_stay_length, 0)::numeric AS avg_stay_length,
  COALESCE(p.active_properties, 0)::int AS active_properties
FROM props p
LEFT JOIN agg a ON a.host_id = p.host_id;

GRANT SELECT ON host_monthly_revenue TO authenticated;
GRANT SELECT ON property_occupancy TO authenticated;
GRANT SELECT ON host_kpis TO authenticated;
