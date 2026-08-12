-- Initialize databases for User Service and Notification Service
CREATE DATABASE user_service_db;
CREATE DATABASE notification_service_db;

GRANT ALL PRIVILEGES ON DATABASE user_service_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE notification_service_db TO postgres;
