FROM php:8.2-fpm-alpine

# Install system dependencies and PHP extensions in one layer
RUN apk add --no-cache postgresql-dev git \
    && docker-php-ext-install pdo pdo_pgsql opcache

# Set working directory
WORKDIR /var/www/html

# Copy only composer files first for better caching
COPY composer.json composer.lock ./

# Install Composer globally
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

COPY . .

# Install PHP dependencies (no-dev, optimized autoloader)
RUN composer install

# Copy application code
COPY . .

# Set permissions for storage and cache
RUN chown -R www-data:www-data storage bootstrap/cache

EXPOSE 9000