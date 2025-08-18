
FROM php:8.2-fpm-alpine

RUN apk add --no-cache postgresql-dev git \
    && docker-php-ext-install pdo pdo_pgsql opcache

WORKDIR /var/www/html
COPY . .

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
    && composer install --no-dev --optimize-autoloader \
    && chown -R www-data:www-data storage bootstrap/cache

EXPOSE 9000