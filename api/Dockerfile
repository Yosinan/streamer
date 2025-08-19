# Stage 1: Build frontend assets using Node.js
FROM node:22-alpine AS node-builder

WORKDIR /app

# Copy only frontend-related files (optional improvement)
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: PHP app with Composer and extensions
FROM php:8.3-fpm-alpine3.19

# Install system dependencies and PHP extensions
RUN apk add --no-cache \
    postgresql-dev \
    libzip-dev \
    unzip \
    autoconf \
    g++ \
    make \
    && docker-php-ext-install pdo pdo_pgsql zip \
    && pecl install redis \
    && docker-php-ext-enable redis

WORKDIR /var/www/html

# Install Composer
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

# Copy only composer files first for better caching
COPY composer.json composer.lock ./

# Copy application files
COPY . .

# Install Composer dependencies
RUN composer install --no-interaction --prefer-dist --optimize-autoloader

# Optional: Copy built assets (e.g., /public or /dist)
COPY --from=node-builder /app/public /var/www/html/public

RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["docker-entrypoint.sh"]

EXPOSE 9000

CMD ["php-fpm"]
